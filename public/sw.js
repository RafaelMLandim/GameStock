// Service worker: existe para o celular oferecer "Instalar app" e para receber as
// notificações push. Não guarda nada em cache de propósito: o jogo depende do servidor
// e cada atualização publicada aparece na hora, sem ninguém ficar com versão velha.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

// Aviso da gestão (missão liberada): mostra a notificação mesmo com o app fechado.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Fronteira do Estoque', {
      body: data.body || 'Tem novidade no Oeste!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag,
      data: { url: data.url || '/' },
    }),
  );
});

// Tocar na notificação abre o app (ou traz para a frente o que já está aberto).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin));
      if (open) return open.focus().then((c) => (c && 'navigate' in c ? c.navigate(url) : c)).catch(() => open.focus());
      return self.clients.openWindow(url);
    }),
  );
});
