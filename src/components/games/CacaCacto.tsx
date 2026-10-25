import { useState } from 'react';
import { useIsPhone } from '../shared';
import { TimeBar, random, shuffle, useCountdown, type GameProps } from './util';
import { sfx } from '../../sound';

/** Grade deitada no computador, em pé no celular (dedos precisam de alvos maiores). */
const WIDE_GRID = { cols: 10, rows: 6, min: 16, max: 26 };
const TALL_GRID = { cols: 6, rows: 9, min: 22, max: 30 };
const DECOYS = ['🦴', '💀', '🌾', '🐍', '🦂', '🍂', '🌿', '🍀', '🌱', '🐚', '🥾', '🐾'];
const PENALTY = 2;

interface Thing {
  id: number;
  emoji: string;
  cactus: boolean;
  x: number;
  y: number;
  size: number;
  turn: number;
}

/** Espalha cactos e objetos falsos em células de uma grade, para nada ficar por cima de nada. */
function scatter(count: number, grid: typeof WIDE_GRID): Thing[] {
  const { cols, rows } = grid;
  const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, Math.min(cols * rows, count + 34));
  return cells.map((cell, i) => ({
    id: i,
    cactus: i < count,
    emoji: i < count ? '🌵' : DECOYS[i % DECOYS.length],
    x: ((cell % cols) + random(0.2, 0.8)) * (100 / cols),
    y: (Math.floor(cell / cols) + random(0.2, 0.8)) * (100 / rows),
    size: random(grid.min, grid.max),
    turn: random(-25, 25),
  }));
}

export default function CacaCacto({ game, onFinish }: GameProps<'cacto'>) {
  const phone = useIsPhone();
  const [things] = useState(() => scatter(game.count, phone ? TALL_GRID : WIDE_GRID));
  const [found, setFound] = useState<number[]>([]);
  const [miss, setMiss] = useState<{ x: number; y: number; at: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const { left, addSeconds } = useCountdown(game.seconds, !finished, () => {
    setFinished(true);
    onFinish(false, `Você achou ${found.length} de ${game.count} cactos.`);
  });

  const pick = (t: Thing) => {
    if (finished || found.includes(t.id)) return;
    if (!t.cactus) {
      sfx.wrong();
      addSeconds(-PENALTY);
      setMiss({ x: t.x, y: t.y, at: Date.now() });
      return;
    }
    sfx.hit();
    const next = [...found, t.id];
    setFound(next);
    if (next.length === game.count) {
      setFinished(true);
      onFinish(true, `Todos os ${game.count} cactos encontrados com ${Math.ceil(left)}s de sobra!`);
    }
  };

  return (
    <div>
      <TimeBar left={left} total={game.seconds} />
      <p className="game-hint">
        🌵 {found.length} de {game.count} · tocar em outra coisa custa {PENALTY}s
      </p>
      <div className={phone ? 'desert tall' : 'desert'}>
        {things.map((t) => (
          <button
            key={t.id}
            className={`desert-thing${found.includes(t.id) ? ' found' : ''}`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, fontSize: t.size, transform: `translate(-50%, -50%) rotate(${t.turn}deg)` }}
            onPointerDown={() => pick(t)}
            aria-label={t.cactus ? 'Cacto' : 'Objeto do deserto'}
          >
            {t.emoji}
          </button>
        ))}
        {miss && (
          <span key={miss.at} className="desert-miss" style={{ left: `${miss.x}%`, top: `${miss.y}%` }}>
            -{PENALTY}s
          </span>
        )}
      </div>
    </div>
  );
}
