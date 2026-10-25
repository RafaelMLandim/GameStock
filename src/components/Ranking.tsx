import { useMemo, useRef, useState } from 'react';
import { TERRITORIES } from '../data';
import { isLegend, journeyValue } from '../game';
import { useGame } from '../GameContext';
import type { GameState, Player } from '../types';
import { plain } from './games/util';
import { Empty, Token } from './shared';

const PAGE_SIZE = 20;

interface Row {
  player: Player;
  points: number;
  /** Posição com empates dividindo o lugar (1, 2, 2, 4…). */
  place: number;
}

function totalPoints(p: Player): number {
  return Object.values(p.categoryPoints).reduce((sum, n) => sum + n, 0);
}

/** Ordena por pontos; no empate, quem foi mais longe no mapa fica na frente. */
function rank(state: GameState): Row[] {
  const score = totalPoints;
  const sorted = [...state.players].sort(
    (a, b) => score(b) - score(a) || journeyValue(state, b) - journeyValue(state, a) || a.codename.localeCompare(b.codename),
  );
  const rows: Row[] = [];
  sorted.forEach((player, i) => {
    const points = score(player);
    const tied = i > 0 && rows[i - 1].points === points && journeyValue(state, sorted[i - 1]) === journeyValue(state, player);
    rows.push({ player, points, place: tied ? rows[i - 1].place : i + 1 });
  });
  return rows;
}

function where(p: Player): string {
  return isLegend(p) ? `⭐ Lenda · ${p.stars} estrela(s)` : `${TERRITORIES[p.territory].icon} ${TERRITORIES[p.territory].name}`;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Ranking() {
  const { state } = useGame();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rows = useMemo(() => rank(state), [state]);

  const query = plain(search.trim());
  const found = query ? rows.filter(({ player: p }) => plain(`${p.codename} ${p.realName}`).includes(query)) : rows;
  const pages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = found.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <section>
      <h2>🏆 Ranking dos participantes</h2>
      <p className="hint">
        Pontos das vitórias nos minijogos (3 de primeira, 2 na segunda, 1 depois, + bônus de distintivo) e 5 por distintivo aprovado. No empate, fica na frente
        quem chegou mais longe no mapa.
      </p>

      {rows.length === 0 ? (
        <Empty>Ninguém criou personagem ainda.</Empty>
      ) : (
        <>
          <div className="podium-row">
            {rows.slice(0, 3).map(({ player: p, points, place }) => (
              <div key={p.id} className={`panel podium-card place-${place}`}>
                <div className="podium-medal">{MEDALS[place - 1] ?? `${place}º`}</div>
                <Token player={p} size={place === 1 ? 64 : 52} />
                <strong>{p.codename}</strong>
                <span className="muted">{p.realName}</span>
                <span className="podium-points">
                  {points} pontos
                </span>
              </div>
            ))}
          </div>

          <div className="ranking-tools">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="🔎 Buscar pelo nome ou codinome…"
              aria-label="Buscar participante"
            />
          </div>

          {found.length === 0 ? (
            <Empty>Ninguém com esse nome.</Empty>
          ) : (
            <ol className="ranking-list">
              {visible.map(({ player: p, points, place }) => (
                <li key={p.id} className="ranking-row">
                  <span className="ranking-place">{place}º</span>
                  <Token player={p} size={36} />
                  <span className="ranking-name">
                    <strong>{p.codename}</strong>
                    <span className="muted">
                      {p.realName} · {where(p)}
                    </span>
                  </span>
                  <span className="ranking-points">{points}</span>
                </li>
              ))}
            </ol>
          )}

          {pages > 1 && (
            <div className="pager">
              <button className="btn small" disabled={current === 0} onClick={() => setPage(current - 1)}>
                ◀ Anterior
              </button>
              <span>
                Página {current + 1} de {pages}
              </span>
              <button className="btn small" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                Próxima ▶
              </button>
            </div>
          )}
        </>
      )}

      <GameBackup />
    </section>
  );
}

/** Backup e reinício do jogo (antes ficavam no Diário). */
function GameBackup() {
  const { state, dispatch } = useGame();
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fronteira-do-estoque-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as GameState;
      if (!Array.isArray(data.players)) throw new Error();
      dispatch({ type: 'IMPORT', state: data });
      setMsg('Backup importado com sucesso.');
    } catch {
      setMsg('Arquivo inválido.');
    }
  };

  return (
    <details className="panel backup">
      <summary>⚙️ Backup do jogo</summary>
      <p className="muted">Guarde uma cópia de tudo (personagens, missões, distintivos e armazém) antes de mudanças grandes ou no fim de cada ciclo.</p>
      <div className="actions">
        <button className="btn" onClick={exportJson}>
          💾 Exportar backup
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          📂 Importar backup
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('Apagar TODO o jogo (personagens, missões e armazém)? Exporte um backup antes.')) {
              dispatch({ type: 'RESET' });
              setMsg('Jogo reiniciado.');
            }
          }}
        >
          Reiniciar jogo
        </button>
      </div>
      {msg && <div className="ok">{msg}</div>}
    </details>
  );
}
