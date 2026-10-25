import { useEffect, useRef, useState } from 'react';
import { api, shrinkPhoto } from '../api';
import { BADGE_POINTS, BADGE_TYPES, BADGE_WIN_BONUS, CATEGORY_LABELS, MAX_BADGE_WIN_BONUS, MAX_PENDING_BADGES } from '../data';
import { badgeTaken, pendingBadges, uid } from '../game';
import { useGame } from '../GameContext';
import type { Badge, Player } from '../types';
import { Empty, PlayerSelect, Token } from './shared';

const typeOf = (b: Badge) => BADGE_TYPES.find((t) => t.id === b.typeId) ?? BADGE_TYPES[0];
const when = (at: number) => new Date(at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/** Foto protegida: só carrega para quem pode ver (o dono e a gestão). */
function BadgePhoto({ photoId }: { photoId: string }) {
  const [url, setUrl] = useState('');
  const [big, setBig] = useState(false);
  useEffect(() => {
    let alive = true;
    let created = '';
    api
      .photoUrl(photoId)
      .then((u) => {
        created = u;
        if (alive) setUrl(u);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [photoId]);
  if (!url) return <div className="badge-photo loading">📷 carregando…</div>;
  return (
    <>
      <button type="button" className="badge-photo" onClick={() => setBig(true)} aria-label="Ver foto">
        <img src={url} alt="Foto enviada" />
      </button>
      {big && (
        <div className="modal-backdrop photo-viewer" onClick={() => setBig(false)}>
          <img src={url} alt="Foto enviada" />
        </div>
      )}
    </>
  );
}

const TAKEN_LABEL = { aprovado: '✅ Já conquistado', pendente: '⏳ Já pedido, esperando a gestão' } as const;

/** Escolha do tipo; os que a pessoa já tem (ou já pediu) aparecem desativados, pois cada um vale uma vez só. */
function BadgeTypePicker({ value, onChange, playerId }: { value: string; onChange: (id: string) => void; playerId?: string }) {
  const { state } = useGame();
  const list = useRef<HTMLDivElement>(null);
  // Quem chega pela dica da missão já vem com um distintivo escolhido: mostra ele sem precisar rolar.
  useEffect(() => {
    list.current?.querySelector('.badge-type.selected')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);
  const takenOf = (typeId: string) => (playerId ? badgeTaken(state, playerId, typeId) : null);
  // Se o escolhido ficou indisponível (ex.: trocou a pessoa), desmarca.
  useEffect(() => {
    if (value && takenOf(value)) onChange('');
  });
  return (
    <div className="badge-types" ref={list}>
      {BADGE_TYPES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`badge-type${value === t.id ? ' selected' : ''}`}
          disabled={!!takenOf(t.id)}
          onClick={() => onChange(t.id)}
        >
          <span className="badge-type-icon">{t.icon}</span>
          <span>
            <b>{t.name}</b>
            {takenOf(t.id) && <small className="badge-type-taken">{TAKEN_LABEL[takenOf(t.id)!]}</small>}
            <small>{t.description}</small>
            {value === t.id && <small className="badge-proof">📸 Como comprovar: {t.proof}</small>}
            {t.photoRequired && <small className="badge-type-cat">📷 Pede foto</small>}
            <small className="badge-type-cat">{CATEGORY_LABELS[t.category]}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

/** O jogador conta o que fez (e pode mandar uma foto) para a gestão aprovar. */
export function RequestBadge({ player, initialType = '', onDone }: { player: Player; initialType?: string; onDone: (sent: boolean) => void }) {
  const { dispatch } = useGame();
  const [typeId, setTypeId] = useState(initialType);
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const type = BADGE_TYPES.find((t) => t.id === typeId);
  const missingPhoto = !!type?.photoRequired && !photo;

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setError('Não consegui abrir essa foto. Tente outra.');
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !reason.trim() || missingPhoto) return;
    setBusy(true);
    setError('');
    try {
      const photoId = photo ? (await api.uploadPhoto(photo)).id : undefined;
      if (await dispatch({ type: 'REQUEST_BADGE', badge: { id: uid(), playerId: player.id, typeId, reason: reason.trim(), photoId } })) onDone(true);
    } catch {
      setError('Não foi possível enviar a foto. Verifique a conexão e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel form request-badge" onSubmit={send}>
      <h3>📨 Pedir distintivo</h3>
      <p className="muted">
        Fez algo que merece reconhecimento? Conte para a gestão. Se aprovado, vale {BADGE_POINTS} pontos na premiação e +{BADGE_WIN_BONUS} ponto extra em
        cada missão da mesma categoria que você vencer daí em diante.
      </p>
      <div className="field-label">1. Qual distintivo?</div>
      <BadgeTypePicker value={typeId} onChange={setTypeId} playerId={player.id} />
      <label>
        2. O que você fez?
        {type && <span className="badge-proof">📸 Inclua a comprovação: {type.proof}</span>}
        <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: vi uma caixa bloqueando a saída de emergência e retirei." />
      </label>
      <div className="field-label">3. Foto {type?.photoRequired ? <b className="game-bad">(obrigatória para este distintivo)</b> : '(opcional)'}</div>
      {photo ? (
        <div className="photo-preview">
          <img src={photo} alt="Foto escolhida" />
          <button type="button" className="btn small" onClick={() => setPhoto('')}>
            🗑️ Remover foto
          </button>
        </div>
      ) : (
        <label className="btn photo-pick">
          📷 Tirar ou escolher foto
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </label>
      )}
      <p className="muted">A foto só aparece para você e para a gestão.</p>
      {error && <p className="game-bad">{error}</p>}
      <div className="actions">
        <button className="btn primary" disabled={busy || !type || !reason.trim() || missingPhoto}>
          {busy ? 'Enviando…' : '📨 Enviar para a gestão'}
        </button>
        {missingPhoto && reason.trim() && <span className="muted">Falta a foto 📷</span>}
        <button type="button" className="btn" onClick={() => onDone(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

const STATUS_LABEL = { pendente: '⏳ Esperando a gestão', aprovado: '✅ Aprovado', recusado: '❌ Recusado' } as const;

function BadgeCard({ badge, player, children }: { badge: Badge; player?: Player; children?: React.ReactNode }) {
  const type = typeOf(badge);
  return (
    <div className={`panel badge-card ${badge.status}`}>
      <div className="badge-card-head">
        <span className="badge-card-icon">{type.icon}</span>
        <div>
          <h3>{type.name}</h3>
          <div className="muted">
            {player && (
              <>
                <b>{player.codename}</b> ·{' '}
              </>
            )}
            {CATEGORY_LABELS[type.category]} · {badge.from === 'gestao' ? 'dado pela gestão' : 'pedido'} em {when(badge.at)}
          </div>
        </div>
      </div>
      <p className="badge-reason">“{badge.reason}”</p>
      {badge.status === 'pendente' && <p className="badge-proof">📸 Comprovação esperada: {type.proof}</p>}
      {badge.photoId && <BadgePhoto photoId={badge.photoId} />}
      <div>
        <span className="badge">{STATUS_LABEL[badge.status]}</span>
        {badge.status === 'aprovado' && <span className="badge gold">+{BADGE_POINTS} pontos</span>}
        {badge.dollars > 0 && <span className="badge gold">+${badge.dollars}</span>}
      </div>
      {badge.note && <p className="muted">💬 Gestão: {badge.note}</p>}
      {children}
    </div>
  );
}

function ReviewControls({ badge }: { badge: Badge }) {
  const { state, dispatch } = useGame();
  const [note, setNote] = useState('');
  const [dollars, setDollars] = useState('0');
  // Pode ter ganho o mesmo distintivo da gestão depois de pedir: aí só dá para recusar.
  const owned = badgeTaken(state, badge.playerId, badge.typeId) === 'aprovado';
  return (
    <div className="review">
      {owned && <p className="game-bad">Essa pessoa já tem esse distintivo (cada um vale uma vez só). Recuse o pedido.</p>}
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comentário para a pessoa (opcional)" />
      <label className="inline">
        Bônus $
        <input type="number" min={0} value={dollars} onChange={(e) => setDollars(e.target.value)} style={{ maxWidth: 90 }} />
      </label>
      <div className="actions">
        <button
          className="btn primary"
          disabled={owned}
          onClick={() => dispatch({ type: 'REVIEW_BADGE', badgeId: badge.id, approve: true, note, dollars: Number(dollars) || 0 })}
        >
          ✅ Aprovar
        </button>
        <button className="btn danger" onClick={() => dispatch({ type: 'REVIEW_BADGE', badgeId: badge.id, approve: false, note, dollars: 0 })}>
          ❌ Recusar
        </button>
      </div>
    </div>
  );
}

function GiveBadge() {
  const { state, dispatch } = useGame();
  const [playerId, setPlayerId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [reason, setReason] = useState('');
  const [dollars, setDollars] = useState('0');
  const [done, setDone] = useState('');
  const player = state.players.find((p) => p.id === playerId);

  return (
    <form
      className="panel form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!player || !typeId || !reason.trim()) return;
        const ok = await dispatch({ type: 'GIVE_BADGE', badge: { id: uid(), playerId, typeId, reason: reason.trim(), dollars: Number(dollars) || 0 } });
        if (ok) {
          setDone(`Distintivo entregue para ${player.codename}!`);
          setTypeId('');
          setReason('');
          setDollars('0');
        }
      }}
    >
      <h3>🎖️ Dar distintivo agora</h3>
      <p className="muted">Viu a atitude acontecer? Entregue na hora, sem esperar pedido.</p>
      <PlayerSelect players={state.players} value={playerId} onChange={setPlayerId} placeholder="Para quem? Digite o nome…" />
      <BadgeTypePicker value={typeId} onChange={setTypeId} playerId={playerId || undefined} />
      <label>
        O que a pessoa fez?
        <textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <label className="inline">
        Bônus $
        <input type="number" min={0} value={dollars} onChange={(e) => setDollars(e.target.value)} style={{ maxWidth: 90 }} />
      </label>
      <div className="actions">
        <button className="btn primary" disabled={!player || !typeId || !reason.trim()}>
          🎖️ Entregar distintivo
        </button>
        {done && <span className="ok">{done}</span>}
      </div>
    </form>
  );
}

/** Aba da gestão: fila de pedidos, entrega direta e histórico. */
function BadgesAdmin() {
  const { state } = useGame();
  const [give, setGive] = useState(false);
  const [view, setView] = useState<'pendente' | 'recusado'>('pendente');
  const pending = pendingBadges(state);
  const refused = state.badges.filter((b) => b.status === 'recusado');
  const playerOf = (b: Badge) => state.players.find((p) => p.id === b.playerId);

  return (
    <section>
      <div className="section-head">
        <h2>🎖️ Distintivos</h2>
        <button className="btn" onClick={() => setGive(!give)}>
          {give ? 'Fechar' : '🎖️ Dar distintivo'}
        </button>
      </div>
      <p className="hint">
        Distintivos reconhecem atitudes reais no estoque. Cada pessoa ganha cada distintivo uma vez só. Cada um aprovado vale {BADGE_POINTS} pontos na categoria (uma vitória num minijogo vale de 1 a 3)
        e cada tipo diferente dá +{BADGE_WIN_BONUS} ponto nas próximas vitórias daquela categoria (até +{MAX_BADGE_WIN_BONUS}).
      </p>
      {give && <GiveBadge />}

      <div className="chips badge-views">
        <button className={view === 'pendente' ? 'chip selected' : 'chip'} onClick={() => setView('pendente')}>
          📨 Pedidos esperando ({pending.length})
        </button>
        <button className={view === 'recusado' ? 'chip selected' : 'chip'} onClick={() => setView('recusado')}>
          ❌ Recusados ({refused.length})
        </button>
      </div>
      {view === 'recusado' ? (
        refused.length === 0 ? (
          <Empty>Nenhum pedido recusado.</Empty>
        ) : (
          <div className="grid">
            {refused.map((b) => (
              <BadgeCard key={b.id} badge={b} player={playerOf(b)} />
            ))}
          </div>
        )
      ) : pending.length === 0 ? (
        <Empty>Nenhum pedido esperando aprovação.</Empty>
      ) : (
        <div className="grid">
          {pending.map((b) => {
            const p = playerOf(b);
            return (
              <BadgeCard key={b.id} badge={b} player={p}>
                {p && (
                  <div className="row compact">
                    <Token player={p} size={32} />
                    <span className="muted">{p.realName}</span>
                  </div>
                )}
                <ReviewControls badge={b} />
              </BadgeCard>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Aba "Distintivos" do jogador: conquistados, pedido novo e o histórico dos pedidos. */
function PlayerBadges({ player }: { player: Player }) {
  const { state } = useGame();
  const [asking, setAsking] = useState(false);
  const [view, setView] = useState<'pendente' | 'recusado'>('pendente');
  const mine = state.badges.filter((b) => b.playerId === player.id);
  const earned = mine.filter((b) => b.status === 'aprovado');
  const pending = mine.filter((b) => b.status === 'pendente');
  const refused = mine.filter((b) => b.status === 'recusado');
  const full = pending.length >= MAX_PENDING_BADGES;
  const list = view === 'pendente' ? pending : refused;

  return (
    <section>
      <h2>🎖️ Meus distintivos ({earned.length})</h2>
      {earned.length === 0 ? (
        <p className="muted">Nenhum conquistado ainda. Atitudes de segurança, qualidade e companheirismo no dia a dia valem distintivos!</p>
      ) : (
        <div className="badge-earned">
          {earned.map((b) => (
            <div key={b.id} className="badge-earned-item" title={b.reason}>
              <span className="badge-medal">{typeOf(b).icon}</span>
              <span>{typeOf(b).name}</span>
            </div>
          ))}
        </div>
      )}
      <p className="hint">
        Cada distintivo pode ser conquistado uma vez e vale {BADGE_POINTS} pontos e +{BADGE_WIN_BONUS} ponto extra nas missões da mesma categoria (até +
        {MAX_BADGE_WIN_BONUS}).
      </p>

      {asking ? (
        <RequestBadge
          player={player}
          onDone={(sent) => {
            setAsking(false);
            if (sent) setView('pendente');
          }}
        />
      ) : (
        <div className="actions">
          <button className="btn primary" disabled={full} onClick={() => setAsking(true)}>
            📨 Pedir distintivo
          </button>
          {full && <span className="muted">Você já tem {MAX_PENDING_BADGES} pedidos esperando a gestão.</span>}
        </div>
      )}

      <div className="chips badge-views">
        <button className={view === 'pendente' ? 'chip selected' : 'chip'} onClick={() => setView('pendente')}>
          ⏳ Pendentes ({pending.length})
        </button>
        <button className={view === 'recusado' ? 'chip selected' : 'chip'} onClick={() => setView('recusado')}>
          ❌ Recusados ({refused.length})
        </button>
      </div>
      {list.length === 0 ? (
        <Empty>{view === 'pendente' ? 'Nenhum pedido esperando a gestão.' : 'Nenhum pedido recusado.'}</Empty>
      ) : (
        <div className="grid">
          {list.map((b) => (
            <BadgeCard key={b.id} badge={b} />
          ))}
        </div>
      )}
    </section>
  );
}

/** A gestão analisa os pedidos de todos; o jogador vê e pede os próprios distintivos. */
export default function BadgesTab() {
  const { isAdmin, myPlayer } = useGame();
  if (isAdmin) return <BadgesAdmin />;
  if (!myPlayer) return <Empty>Crie seu personagem na aba 🤠 Meu Personagem para pedir distintivos.</Empty>;
  return <PlayerBadges player={myPlayer} />;
}

/** Medalhas conquistadas, para mostrar no card do personagem. */
export function EarnedBadges({ playerId, small }: { playerId: string; small?: boolean }) {
  const { state } = useGame();
  const earned = state.badges.filter((b) => b.playerId === playerId && b.status === 'aprovado');
  if (earned.length === 0) return null;
  return (
    <div className={`card-badges${small ? ' small' : ''}`} aria-label={`${earned.length} distintivo(s) conquistado(s)`}>
      {!small && <span className="stat-label card-badges-title">Distintivos ({earned.length})</span>}
      {earned.map((b) => (
        <span key={b.id} className="badge-medal" title={typeOf(b).name}>
          {typeOf(b).icon}
        </span>
      ))}
    </div>
  );
}
