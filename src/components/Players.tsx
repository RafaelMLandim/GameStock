import { useMemo, useState } from 'react';
import { makeLook } from '../avatar';
import { AVATARS, PLAYER_COLORS, TERRITORIES } from '../data';
import { isLegend, missionsLeft, type PlayerProfile } from '../game';
import { useGame } from '../GameContext';
import type { Player } from '../types';
import Accounts from './Accounts';
import AvatarBuilder from './AvatarBuilder';
import AvatarFigure from './AvatarFigure';
import { EarnedBadges } from './Badges';
import { SceneBox } from './Backdrops';
import { plain } from './games/util';
import { Empty, Token } from './shared';

function blankDraft(realName: string, count: number): PlayerProfile {
  // Começa com um boneco neutro, sem chapéu: a pessoa monta tudo do jeito dela.
  return { realName, codename: '', avatar: AVATARS[2].id, look: makeLook({ hat: 'nenhum', accessories: [] }), color: PLAYER_COLORS[count % PLAYER_COLORS.length], backdrop: 'deserto' };
}

/** Formulário único de criação e edição do personagem. */
function PlayerForm({
  initial,
  title,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: PlayerProfile;
  title: string;
  submitLabel: string;
  onSubmit: (d: PlayerProfile) => Promise<boolean> | void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const valid = draft.realName.trim() && draft.codename.trim();

  return (
    <form
      className="panel form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        await onSubmit({ ...draft, realName: draft.realName.trim(), codename: draft.codename.trim() });
        setBusy(false);
      }}
    >
      <h2 className="form-title">{title}</h2>
      <div className="row">
        <label>
          Nome real
          <input value={draft.realName} onChange={(e) => setDraft({ ...draft, realName: e.target.value })} placeholder="Ex.: Ana Souza" />
        </label>
        <label>
          Codinome no jogo
          <input value={draft.codename} onChange={(e) => setDraft({ ...draft, codename: e.target.value })} placeholder="Ex.: Ana Bala de Prata" />
        </label>
      </div>

      <div className="field-label">Monte seu bonequinho</div>
      <AvatarBuilder
        look={draft.look}
        onChange={(look) => setDraft({ ...draft, look })}
        backdrop={draft.backdrop ?? 'cor'}
        color={draft.color}
        onSceneChange={(scene) => setDraft({ ...draft, ...scene })}
      />
      <div className="actions">
        <button className="btn primary" disabled={!valid || busy}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function profileOf(p: Player): PlayerProfile {
  return { realName: p.realName, codename: p.codename, avatar: p.avatar, look: p.look, color: p.color, backdrop: p.backdrop ?? 'cor' };
}

/** O personagem de quem está logado, em destaque. */
function MyCharacter({ player }: { player: Player }) {
  const { state, dispatch } = useGame();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PlayerForm
        initial={profileOf(player)}
        title="✏️ Editar meu personagem"
        submitLabel="💾 Salvar alterações"
        onCancel={() => setEditing(false)}
        onSubmit={async (changes) => {
          if (await dispatch({ type: 'UPDATE_PLAYER', id: player.id, changes })) setEditing(false);
          return true;
        }}
      />
    );
  }

  const legend = isLegend(player);
  const here = TERRITORIES[player.territory];
  const next = TERRITORIES[player.territory + 1];

  return (
    <div className="panel hero">
      <SceneBox className="hero-figure" backdrop={player.backdrop} color={player.color}>
        <AvatarFigure look={player.look} size={230} title={player.codename} />
      </SceneBox>
      <div className="hero-info">
        <div className="muted">Meu personagem</div>
        <h2 className="hero-name">{player.codename}</h2>
        <div className="muted">
          {player.realName}
        </div>
        <div className="hero-stats">
          <div>
            <span className="stat-label">Território</span>
            <span className="stat-value">
              {here.icon} {here.name}
            </span>
          </div>
          <div>
            <span className="stat-label">Dólares do Oeste</span>
            <span className="stat-value money">${player.dollars}</span>
          </div>
          {legend && (
            <div>
              <span className="stat-label">Estrelas de Lenda</span>
              <span className="stat-value">⭐ {player.stars}</span>
            </div>
          )}
        </div>
        <EarnedBadges playerId={player.id} />
        <div>
          {legend && <span className="badge gold">⭐ LENDA DO OESTE</span>}
          {player.outlaw && <span className="badge red">☠️ Fora da Lei — cumpra uma missão surpresa</span>}
          {player.shortcuts > 0 && <span className="badge">🗺️ {player.shortcuts} atalho(s)</span>}
        </div>
        {!legend && (
          <p>
            Próximo destino: {next.icon} <b>{next.name}</b> — falta(m) {missionsLeft(state, player)} missão(ões).
          </p>
        )}
        <div className="actions">
          <button className="btn primary" onClick={() => setEditing(true)}>
            ✏️ Editar personagem
          </button>
          {player.shortcuts > 0 && (
            <button className="btn" disabled={player.outlaw} onClick={() => dispatch({ type: 'USE_SHORTCUT', playerId: player.id })}>
              🗺️ Usar atalho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Controles da gestão sobre o personagem de um jogador. */
function AdminControls({ player }: { player: Player }) {
  const { dispatch } = useGame();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  return (
    <>
      <form
        className="row compact"
        onSubmit={(e) => {
          e.preventDefault();
          const value = Number(amount);
          if (!value) return;
          dispatch({ type: 'ADJUST_DOLLARS', playerId: player.id, amount: value, reason: reason.trim() });
          setAmount('');
          setReason('');
        }}
      >
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="± dólares" style={{ maxWidth: 110 }} />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" />
        <button className="btn">Ajustar $</button>
      </form>
      <div className="actions">
        <button
          className="btn danger"
          onClick={() => {
            if (confirm(`Remover ${player.codename} do jogo? A pessoa poderá criar um novo personagem.`)) dispatch({ type: 'REMOVE_PLAYER', id: player.id });
          }}
        >
          Remover personagem
        </button>
      </div>
    </>
  );
}

function MemberCard({ player, isMe }: { player: Player; isMe: boolean }) {
  const { isAdmin } = useGame();
  return (
    <div className={isMe ? 'panel player-card me' : 'panel player-card'}>
      <div className="player-head">
        <SceneBox className="player-figure" backdrop={player.backdrop} color={player.color}>
          <AvatarFigure look={player.look} size={72} />
        </SceneBox>
        <div>
          <h3>
            {player.codename} {isMe && <span className="badge">você</span>}
          </h3>
          <div className="muted">
            {player.realName}
          </div>
          <div>
            {TERRITORIES[player.territory].icon} {TERRITORIES[player.territory].name}
            {isLegend(player) && <span className="badge gold">⭐ Lenda · {player.stars}</span>}
            {player.outlaw && <span className="badge red">☠️ Fora da Lei</span>}
          </div>
          <EarnedBadges playerId={player.id} small />
        </div>
        <div className="journey-dollars">${player.dollars}</div>
      </div>
      {isAdmin && <AdminControls player={player} />}
    </div>
  );
}

export default function Players() {
  const { state, dispatch, user, isAdmin, myPlayer } = useGame();

  return (
    <section>
      {myPlayer ? (
        <>
          <MyCharacter player={myPlayer} />
        </>
      ) : isAdmin ? null : (
        <>
          <p className="hint welcome">Bem-vindo(a) ao Oeste, {user.realName}! Crie seu personagem para entrar no Acampamento.</p>
          <PlayerForm
            initial={blankDraft(user.realName, state.players.length)}
            title="🐴 Criar meu personagem"
            submitLabel="🐴 Entrar no Acampamento"
            onSubmit={(player) => dispatch({ type: 'ADD_PLAYER', player })}
          />
        </>
      )}

      {isAdmin && <AdminPeople />}
    </section>
  );
}

/** Gestão: personagens do jogo ou matrículas da planilha (cadastro e senhas). */
function AdminPeople() {
  const [view, setView] = useState<'personagens' | 'matriculas'>('personagens');
  return (
    <>
      <div className="chips badge-views">
        <button className={view === 'personagens' ? 'chip selected' : 'chip'} onClick={() => setView('personagens')}>
          🤠 Personagens
        </button>
        <button className={view === 'matriculas' ? 'chip selected' : 'chip'} onClick={() => setView('matriculas')}>
          📇 Matrículas e senhas
        </button>
      </div>
      {view === 'personagens' ? <Roster /> : <Accounts />}
    </>
  );
}

const PAGE_SIZE = 20;

/** Todos os personagens para a gestão, em ordem alfabética: busca e 20 por página; tocar na linha abre o card completo. */
function Roster() {
  const { state, myPlayer } = useGame();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const sorted = useMemo(() => [...state.players].sort((a, b) => a.realName.localeCompare(b.realName, 'pt-BR')), [state.players]);
  const query = plain(search.trim());
  const found = query ? sorted.filter((p) => plain(`${p.codename} ${p.realName}`).includes(query)) : sorted;
  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = found.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const goTo = (n: number) => {
    setPage(n);
    setOpen(null);
  };

  return (
    <>
      <h2>Todos os personagens ({state.players.length})</h2>
      <p className="hint">Cada pessoa cria e edita o próprio personagem pela sua conta. Toque em alguém para ver os distintivos, ajustar dólares ou remover.</p>
      {state.players.length === 0 ? (
        <Empty>Ninguém criou personagem ainda.</Empty>
      ) : (
        <>
          <div className="ranking-tools">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                goTo(0);
              }}
              placeholder="🔎 Buscar pelo nome ou codinome…"
              aria-label="Buscar personagem"
            />
          </div>

          {found.length === 0 ? (
            <Empty>Ninguém com esse nome.</Empty>
          ) : (
            <ul className="ranking-list">
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    className={open === p.id ? 'ranking-row roster-row open' : 'ranking-row roster-row'}
                    onClick={() => setOpen(open === p.id ? null : p.id)}
                    aria-expanded={open === p.id}
                  >
                    <Token player={p} size={36} />
                    <span className="ranking-name">
                      <strong>{p.realName}</strong>
                      <span className="muted">
                        {p.codename} · {isLegend(p) ? `⭐ Lenda · ${p.stars}` : `${TERRITORIES[p.territory].icon} ${TERRITORIES[p.territory].name}`}
                      </span>
                    </span>
                    <span className="ranking-points">${p.dollars}</span>
                  </button>
                  {open === p.id && <MemberCard player={p} isMe={p.id === myPlayer?.id} />}
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <div className="pager">
              <button className="btn small" disabled={current === 0} onClick={() => goTo(current - 1)}>
                ◀ Anterior
              </button>
              <span>
                Página {current + 1} de {pages}
              </span>
              <button className="btn small" disabled={current >= pages - 1} onClick={() => goTo(current + 1)}>
                Próxima ▶
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
