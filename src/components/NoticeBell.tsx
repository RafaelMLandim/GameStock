import { useEffect, useState } from 'react';
import { TERRITORIES } from '../data';
import { missionsAt, noticeMissions, noticesFor, unreadNotices } from '../game';
import { useGame } from '../GameContext';
import { requestTerritory } from '../navigation';
import { disablePush, enablePush, pushStatus, refreshPush, type PushStatus } from '../push';

/** Liga ou desliga as notificações no celular, explicando o que fazer em cada caso. */
function PushSwitch() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    void pushStatus().then(setStatus);
  }, []);
  if (!status || status === 'sem-suporte') return null;
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch {
      setError('Não deu para ligar as notificações agora. Tente de novo.');
    }
    setStatus(await pushStatus());
    setBusy(false);
  };
  return (
    <div className={`push-switch ${status}`}>
      {status === 'ativo' && (
        <>
          <span>📲 Notificações ligadas neste celular: você recebe os avisos mesmo com o app fechado.</span>
          <button className="btn small" disabled={busy} onClick={() => run(disablePush)}>
            Desligar
          </button>
        </>
      )}
      {status === 'desligado' && (
        <>
          <span>📲 Quer receber os avisos no celular, mesmo com o app fechado?</span>
          <button className="btn primary small" disabled={busy} onClick={() => run(enablePush)}>
            🔔 Ligar notificações
          </button>
        </>
      )}
      {status === 'bloqueado' && (
        <span>🔕 As notificações estão bloqueadas neste navegador. Para receber, libere em Configurações › Notificações.</span>
      )}
      {status === 'instalar-iphone' && (
        <span>📲 No iPhone, para receber os avisos no celular, primeiro instale o app: Compartilhar › Adicionar à Tela de Início.</span>
      )}
      {error && <span className="game-bad">{error}</span>}
    </div>
  );
}

function when(at: number): string {
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// "Agora não" no convite: ele volta a aparecer depois de alguns dias (guardado neste celular).
const PROMPT_AGAIN_MS = 7 * 24 * 60 * 60 * 1000;
const promptKey = (playerId: string) => `push-convite:${playerId}`;

function promptDismissedRecently(playerId: string): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(promptKey(playerId)) ?? 0) < PROMPT_AGAIN_MS;
  } catch {
    return false;
  }
}

function rememberDismiss(playerId: string) {
  try {
    localStorage.setItem(promptKey(playerId), String(Date.now()));
  } catch {
    // sem armazenamento (aba anônima): o convite só volta a aparecer no próximo acesso
  }
}

/** Convite ao entrar: liga as notificações do celular (ou ensina a instalar no iPhone). */
function PushInvite({ playerId }: { playerId: string }) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!promptDismissedRecently(playerId)) void pushStatus().then(setStatus);
  }, [playerId]);
  if (closed || (status !== 'desligado' && status !== 'instalar-iphone')) return null;
  const later = () => {
    rememberDismiss(playerId);
    setClosed(true);
  };
  const turnOn = async () => {
    setBusy(true);
    const result = await enablePush().catch(() => 'desligado' as const);
    setBusy(false);
    // Ligou ou bloqueou: não pergunta mais. Fechou sem escolher: pergunta de novo outro dia.
    if (result !== 'ativo') rememberDismiss(playerId);
    setClosed(true);
  };
  return (
    <div className="modal-backdrop">
      <div className="modal push-invite" role="dialog" aria-label="Receber avisos no celular">
        <div className="push-invite-icon">🔔</div>
        <h2>Fique de olho nas missões, parceiro!</h2>
        {status === 'desligado' ? (
          <>
            <p>Ligue as notificações para saber na hora quando a gestão liberar uma missão nova, mesmo com o app fechado.</p>
            <div className="push-invite-actions">
              <button className="btn primary" disabled={busy} onClick={turnOn}>
                🔔 Ligar notificações
              </button>
              <button className="btn" disabled={busy} onClick={later}>
                Agora não
              </button>
            </div>
          </>
        ) : (
          <>
            <p>No iPhone, os avisos só chegam com o app instalado. É rapidinho:</p>
            <ol className="push-invite-steps">
              <li>
                Toque em <b>Compartilhar</b> (o quadrado com a seta ⬆️) no Safari.
              </li>
              <li>
                Toque em <b>Adicionar à Tela de Início</b>.
              </li>
              <li>
                Abra o app pelo ícone novo e toque em <b>Ligar notificações</b>.
              </li>
            </ol>
            <div className="push-invite-actions">
              <button className="btn primary" onClick={later}>
                Entendi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Sininho do jogador: avisos de missões liberadas pela gestão, com contador de não lidos. */
export default function NoticeBell({ onOpenMap }: { onOpenMap: () => void }) {
  const { state, myPlayer, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  // O que era novo quando a lista abriu continua destacado até fechar.
  const [seenBefore, setSeenBefore] = useState(0);
  // Quem já permitiu as notificações continua inscrito nesta conta ao abrir o app.
  useEffect(() => {
    void refreshPush();
  }, [myPlayer?.id]);
  if (!myPlayer) return null;
  const notices = noticesFor(state, myPlayer);
  const unread = unreadNotices(state, myPlayer).length;
  const here = new Set(missionsAt(state, myPlayer.territory).map((m) => m.id));

  const show = () => {
    setSeenBefore(myPlayer.noticesSeenAt ?? 0);
    setOpen(true);
    if (unread) void dispatch({ type: 'SEE_NOTICES', playerId: myPlayer.id });
  };
  const goPlay = () => {
    setOpen(false);
    onOpenMap();
    requestTerritory(myPlayer.territory);
  };

  return (
    <>
      <button className="btn small bell" onClick={show} aria-label={unread ? `Avisos: ${unread} novo(s)` : 'Avisos'}>
        🔔{unread > 0 && <span className="tab-count">{unread}</span>}
      </button>
      <PushInvite playerId={myPlayer.id} />
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal notices" role="dialog" aria-label="Avisos" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span className="mission-icon">🔔</span>
              <div>
                <h2>Avisos</h2>
                <p className="muted">Missões novas que a gestão liberou para você.</p>
              </div>
              <button className="btn small modal-close" onClick={() => setOpen(false)} aria-label="Fechar">
                ✖
              </button>
            </div>
            <PushSwitch />
            {notices.length === 0 ? (
              <p className="muted notices-empty">Nenhum aviso por enquanto. Quando a gestão liberar uma missão, ela aparece aqui.</p>
            ) : (
              <ul className="notice-list">
                {notices.map((n) => {
                  const missions = noticeMissions(state, myPlayer, n);
                  const playable = missions.some((m) => here.has(m.id));
                  const ahead = missions.find((m) => m.territory != null && m.territory > myPlayer.territory);
                  return (
                    <li key={n.id} className={n.at > seenBefore ? 'notice new' : 'notice'}>
                      <span className="notice-icon">{n.icon}</span>
                      <div>
                        <b>{n.title}</b>
                        <span className="notice-when"> · {when(n.at)}</span>
                        <p>{n.text}</p>
                        {playable ? (
                          <button className="btn primary small" onClick={goPlay}>
                            🎮 Jogar agora
                          </button>
                        ) : (
                          ahead && <p className="muted">Fica disponível quando você chegar a {TERRITORIES[ahead.territory!].name}.</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
