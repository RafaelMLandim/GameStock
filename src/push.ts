import { api } from './api';

/**
 * Notificações push: avisos da gestão que chegam no celular mesmo com o app fechado.
 * - Android (Chrome): funciona direto no navegador.
 * - iPhone: só com o app instalado na tela de início (iOS 16.4 ou mais novo).
 */
export type PushStatus = 'ativo' | 'desligado' | 'bloqueado' | 'instalar-iphone' | 'sem-suporte';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInstalled = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

function supported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function pushStatus(): Promise<PushStatus> {
  if (!supported()) return isIos() && !isInstalled() ? 'instalar-iphone' : 'sem-suporte';
  if (Notification.permission === 'denied') return 'bloqueado';
  if (Notification.permission !== 'granted') return 'desligado';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'ativo' : 'desligado';
}

function keyBytes(base64: string): ArrayBuffer {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)).buffer;
}

// Uma inscrição por vez: duas ao mesmo tempo criariam dois endereços (só o último vale).
let inflight: Promise<void> | null = null;

/** Inscreve este celular (ou confirma a inscrição) e manda para o servidor na conta logada. */
function subscribe(): Promise<void> {
  inflight ??= doSubscribe().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function doSubscribe(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await api.pushKey();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  }
  await api.pushSubscribe(sub.toJSON());
}

/** Pede a permissão e liga as notificações. Devolve como ficou. */
export async function enablePush(): Promise<PushStatus> {
  if (!supported()) return pushStatus();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'bloqueado' : 'desligado';
  await subscribe();
  return 'ativo';
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api.pushUnsubscribe(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe();
}

/** Ao abrir o app: quem já permitiu continua inscrito (e o celular passa para a conta logada). */
export async function refreshPush(): Promise<void> {
  if (supported() && Notification.permission === 'granted') await subscribe().catch(() => undefined);
}
