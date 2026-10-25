import { useState } from 'react';
import { BADGE_TYPES, CATEGORY_LABELS, LAST_TERRITORY, MISSION_BADGE_HINTS, MISSION_REWARD, TERRITORIES } from '../data';
import { areaMissions, areaProgress, badgeBonus, canPlay, isLegend, missionsAt, uid, whole } from '../game';
import { useGame } from '../GameContext';
import type { GameKind, Mission, MissionCategory } from '../types';
import { GAME_INFO, PlayMission, contentToText, defaultGame, gameProblem, textToContent } from './games';
import Place from './Places';
import { Empty, PlayerSelect } from './shared';

/** Quantas missões cada território deve ter. */
export const MISSIONS_PER_AREA = 4;

function CompleteMission({ mission }: { mission: Mission }) {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  const [bonus, setBonus] = useState('0');
  const [done, setDone] = useState('');

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const ids = mission.collective ? state.players.map((p) => p.id) : selected;

  return (
    <div className="complete">
      <p className="muted">Registro manual: use quando a missão foi cumprida fora do jogo (ou para corrigir algo).</p>
      {mission.collective ? (
        <p className="muted">Missão coletiva: ao confirmar, todos os jogadores ({state.players.length}) avançam juntos.</p>
      ) : (
        <>
          <PlayerSelect
            players={state.players.filter((p) => !selected.includes(p.id))}
            value=""
            onChange={(id) => id && toggle(id)}
            placeholder="Quem cumpriu? Digite o nome…"
          />
          {selected.length > 0 && (
            <div className="chips">
              {selected.map((id) => {
                const p = state.players.find((x) => x.id === id);
                return (
                  p && (
                    <button key={id} type="button" className="chip selected" onClick={() => toggle(id)} aria-label={`Tirar ${p.codename}`}>
                      {p.codename}
                      {p.outlaw ? ' ☠️' : ''} ✕
                    </button>
                  )
                );
              })}
            </div>
          )}
        </>
      )}
      <div className="row compact">
        <label className="inline">
          Bônus extra $
          <input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} style={{ maxWidth: 90 }} />
        </label>
        <button
          className="btn primary"
          disabled={ids.length === 0}
          onClick={() => {
            dispatch({ type: 'COMPLETE_MISSION', missionId: mission.id, playerIds: ids, bonus: Number(bonus) || 0 });
            setDone(`Missão registrada para ${ids.length} aventureiro(s)!`);
            setSelected([]);
            setBonus('0');
          }}
        >
          ✅ Registrar
        </button>
        {done && <span className="ok">{done}</span>}
      </div>
    </div>
  );
}

function MissionEditor({ initial, onDone }: { initial: Mission; onDone: () => void }) {
  const { dispatch } = useGame();
  const [m, setM] = useState(initial);
  const [text, setText] = useState(() => contentToText(initial.game));
  const info = GAME_INFO[m.game.kind];
  const game = info.content ? textToContent(m.game, text) : m.game;
  const problem = gameProblem(game);

  const setKind = (kind: GameKind) => {
    const g = defaultGame(kind);
    setM({ ...m, game: g });
    setText(contentToText(g));
  };

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!m.name.trim() || problem) return;
        dispatch({ type: 'SAVE_MISSION', mission: { ...m, name: m.name.trim(), game } });
        onDone();
      }}
    >
      <div className="row">
        <label style={{ maxWidth: 80 }}>
          Ícone
          <input value={m.icon} onChange={(e) => setM({ ...m, icon: e.target.value })} />
        </label>
        <label>
          Nome
          <input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} />
        </label>
        <label style={{ maxWidth: 120 }}>
          Recompensa $
          <input type="number" value={m.reward} min={0} step={1} onChange={(e) => setM({ ...m, reward: whole(Number(e.target.value)) })} />
        </label>
      </div>
      <label>
        Descrição
        <input value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} />
      </label>
      <div className="row">
        <label>
          Minijogo
          <select value={m.game.kind} onChange={(e) => setKind(e.target.value as GameKind)}>
            {Object.entries(GAME_INFO).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Categoria
          <select value={m.category} onChange={(e) => setM({ ...m, category: e.target.value as MissionCategory })}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Área da missão
          <select
            value={m.territory ?? ''}
            onChange={(e) => setM({ ...m, territory: e.target.value === '' ? undefined : Number(e.target.value) })}
          >
            <option value="">Extra: qualquer lugar (não conta para avançar)</option>
            {TERRITORIES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id + 1}. {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Distintivo sugerido no fim
          <select value={m.badgeHint ?? MISSION_BADGE_HINTS[m.id] ?? ''} onChange={(e) => setM({ ...m, badgeHint: e.target.value || undefined })}>
            <option value="">Automático (pela categoria)</option>
            {BADGE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name} ({CATEGORY_LABELS[t.category]})
              </option>
            ))}
          </select>
        </label>
      </div>
      {info.content && (
        <label>
          Conteúdo do jogo <span className="muted">— {info.content.help}</span>
          <textarea rows={6} value={text} placeholder={info.content.placeholder} onChange={(e) => setText(e.target.value)} />
        </label>
      )}
      {info.params.length > 0 && (
        <div className="row">
          {info.params.map((p) => (
            <label key={p.key} style={{ maxWidth: 220 }}>
              {p.label}
              <input
                type="number"
                min={0}
                step={p.step ?? 1}
                value={(m.game as unknown as Record<string, number>)[p.key]}
                onChange={(e) => setM({ ...m, game: { ...m.game, [p.key]: Number(e.target.value) || 0 } as typeof m.game })}
              />
            </label>
          ))}
        </div>
      )}
      <div className="row compact">
        <label className="inline">
          <input type="checkbox" checked={!!m.surprise} onChange={(e) => setM({ ...m, surprise: e.target.checked })} /> Surpresa (liberta Fora da Lei)
        </label>
        <label className="inline">
          <input type="checkbox" checked={!!m.collective} onChange={(e) => setM({ ...m, collective: e.target.checked })} /> Coletiva (registro manual
          avança todos os jogadores)
        </label>
      </div>
      {problem && <p className="game-bad">⚠️ {problem}</p>}
      <div className="actions">
        <button className="btn primary" disabled={!!problem || !m.name.trim()}>
          Salvar missão
        </button>
        <button type="button" className="btn" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Missões de um território, abertas ao clicar no local do mapa. */
export default function TerritoryMissions({ territory, onClose }: { territory: number; onClose: () => void }) {
  const { state, dispatch, isAdmin, myPlayer } = useGame();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [playing, setPlaying] = useState<{ mission: Mission; practice: boolean } | null>(null);
  const t = TERRITORIES[territory];
  // Primeiro as missões obrigatórias da área, depois as extras.
  const missions = [...missionsAt(state, territory)].sort((a, b) => Number(b.territory === territory) - Number(a.territory === territory));
  const area = areaMissions(state, territory);
  const here = myPlayer?.territory === territory ? myPlayer : undefined;
  const progress = here && areaProgress(state, here);
  const next = TERRITORIES[territory + 1];
  const locked = area.filter((m) => !m.released);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={`Missões de ${t.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <svg viewBox="-60 -60 120 100" className="modal-place" aria-hidden="true">
            <Place id={territory} />
          </svg>
          <div>
            <h2>
              {t.id + 1}. {t.name}
            </h2>
            {here ? (
              isLegend(here) ? (
                <p className="muted">Você é uma ⭐ Lenda do Oeste! Cada desafio do Saloon vencido rende uma estrela.</p>
              ) : (
                <>
                  <p className="muted">
                    Você está aqui: {progress!.done} de {progress!.total} missões concluídas. Vença todas para seguir até {next.icon} {next.name}.
                    {here.outlaw && ' ☠️ Fora da Lei: vença uma missão ⚡ surpresa para suas vitórias voltarem a contar.'}
                  </p>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${(progress!.done / Math.max(1, progress!.total)) * 100}%` }} />
                  </div>
                </>
              )
            ) : (
              territory < LAST_TERRITORY && <p className="muted">{area.length} missões na área. É preciso vencer todas para seguir até {next.name}.</p>
            )}
          </div>
          <button className="btn small modal-close" onClick={onClose} aria-label="Fechar">
            ✖
          </button>
        </div>

        {isAdmin && (
          <div className="admin-bar">
            <span className={area.length === MISSIONS_PER_AREA ? 'muted' : 'game-bad'}>
              {area.length} de {MISSIONS_PER_AREA} missões na área · {area.length - locked.length} liberada(s)
            </span>
            <button
              className="btn primary"
              disabled={locked.length === 0}
              onClick={() => dispatch({ type: 'SET_RELEASED', missionIds: area.map((m) => m.id), released: true })}
            >
              🔓 Liberar todas da área
            </button>
            <button
              className="btn"
              disabled={locked.length === area.length}
              onClick={() => dispatch({ type: 'SET_RELEASED', missionIds: area.map((m) => m.id), released: false })}
            >
              🔒 Bloquear todas
            </button>
            <button
              className="btn"
              onClick={() =>
                setEditing({ id: uid(), icon: '📌', name: '', description: '', reward: MISSION_REWARD, category: 'espirito', territory, game: defaultGame('quiz') })
              }
            >
              ➕ Nova missão aqui
            </button>
          </div>
        )}
        {editing && !state.missions.some((m) => m.id === editing.id) && (
          <div className="panel">
            <MissionEditor initial={editing} onDone={() => setEditing(null)} />
          </div>
        )}

        {missions.length === 0 && <Empty>Nenhuma missão neste território ainda.</Empty>}
        <div className="mission-list">
          {missions.map((m) => {
            const info = GAME_INFO[m.game.kind];
            const cleared = !!here && here.cleared.includes(m.id);
            const playable = !!here && canPlay(state, here, m);
            // Extra já vencida: pode jogar de novo, mas só por diversão.
            const replay = playable && m.territory == null && !!here?.missionsDone[m.id];
            const bonus = playable && !replay ? badgeBonus(state, here!.id, m.category) : 0;
            return (
              <div key={m.id} className={`panel mission${cleared ? ' cleared' : ''}${!m.released ? ' locked' : ''}`}>
                {editing?.id === m.id ? (
                  <MissionEditor initial={m} onDone={() => setEditing(null)} />
                ) : (
                  <>
                    <div className="mission-head">
                      <span className="mission-icon">{m.icon}</span>
                      <div>
                        <h3>{m.name}</h3>
                        <div className="muted">{m.description}</div>
                        <div>
                          <span className="badge">
                            {info.icon} {info.label}
                          </span>
                          <span className="badge gold">${m.reward}</span>
                          {bonus > 0 && <span className="badge gold">🎖️ +{bonus} ponto(s) pelos distintivos</span>}
                          {cleared &&<span className="badge done">✅ Concluída</span>}
                          {!m.released && <span className="badge">🔒 Aguardando o xerife liberar</span>}
                          {m.territory == null && <span className="badge">🗺️ Extra · qualquer lugar</span>}
                          {m.surprise && <span className="badge red">⚡ Surpresa</span>}
                        </div>
                      </div>
                    </div>
                    <div className="actions">
                      {playable && (
                        <button className="btn primary" onClick={() => setPlaying({ mission: m, practice: replay })}>
                          ▶️ {replay ? 'Jogar de novo' : 'Jogar'}
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            className={m.released ? 'btn' : 'btn primary'}
                            onClick={() => dispatch({ type: 'SET_RELEASED', missionIds: [m.id], released: !m.released })}
                          >
                            {m.released ? '🔒 Bloquear' : '🔓 Liberar para todos'}
                          </button>
                          <button className="btn" onClick={() => setPlaying({ mission: m, practice: true })}>
                            🎮 Testar
                          </button>
                          <button className="btn" onClick={() => setOpen(open === m.id ? null : m.id)}>
                            {open === m.id ? 'Fechar' : '📝 Registrar'}
                          </button>
                          <button className="btn" onClick={() => setEditing(m)} aria-label="Editar">
                            ✏️
                          </button>
                          <button
                            className="btn danger"
                            aria-label="Remover"
                            onClick={() => {
                              if (confirm(`Remover a missão "${m.name}"?`)) dispatch({ type: 'REMOVE_MISSION', id: m.id });
                            }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                    {isAdmin &&
                      open === m.id &&
                      (state.players.length ? <CompleteMission mission={m} /> : <Empty>Nenhum aventureiro criou personagem ainda.</Empty>)}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {playing && (
        <div onClick={(e) => e.stopPropagation()}>
          <PlayMission mission={playing.mission} practice={playing.practice} onClose={() => setPlaying(null)} />
        </div>
      )}
    </div>
  );
}
