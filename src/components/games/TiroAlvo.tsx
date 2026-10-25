import { useEffect, useRef, useState } from 'react';
import { TimeBar, random, useCountdown, type GameProps } from './util';
import { sfx } from '../../sound';

interface Bottle {
  id: number;
  x: number;
  row: number;
  hue: number;
}

const ROWS = [30, 58, 86];
const LIFETIME = 1300;

function BottleArt({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 20 48" width="26" height="62" aria-hidden="true">
      <rect x="7" y="0" width="6" height="5" fill="#6b3e1e" />
      <path d="M 7 5 h 6 v 9 q 6 4 6 12 v 18 a 3 3 0 0 1 -3 3 h -12 a 3 3 0 0 1 -3 -3 v -18 q 0 -8 6 -12 Z" fill={`hsl(${hue} 55% 38%)`} stroke="#2b1a0e" strokeWidth="1.5" />
      <rect x="4" y="26" width="12" height="10" fill="#efe2c0" stroke="#2b1a0e" strokeWidth="1" />
      <rect x="5" y="15" width="2" height="22" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

export default function TiroAlvo({ game, onFinish }: GameProps<'tiro'>) {
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [hits, setHits] = useState(0);
  const [booms, setBooms] = useState<{ id: number; x: number; y: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const nextId = useRef(0);
  const hitsRef = useRef(0);

  const finish = (won: boolean, detail: string) => {
    setFinished(true);
    // As garrafas que sobraram somem; a explosão da última continua aparecendo.
    setBottles([]);
    onFinish(won, detail);
  };

  const { left } = useCountdown(game.seconds, !finished, () => {
    finish(false, `Você acertou ${hitsRef.current} de ${game.target} garrafas.`);
  });

  // Garrafas surgem na cerca e somem sozinhas se ninguém acertar.
  useEffect(() => {
    if (finished) return;
    const spawn = setInterval(() => {
      const bottle = { id: nextId.current++, x: random(6, 92), row: Math.floor(random(0, ROWS.length)), hue: random(80, 160) };
      setBottles((b) => (b.length >= 4 ? b : [...b, bottle]));
      setTimeout(() => setBottles((b) => b.filter((o) => o.id !== bottle.id)), LIFETIME);
    }, 550);
    return () => clearInterval(spawn);
  }, [finished]);

  const shoot = (b: Bottle) => {
    if (finished) return;
    sfx.shot();
    sfx.hit();
    setBottles((list) => list.filter((o) => o.id !== b.id));
    setBooms((list) => [...list, { id: b.id, x: b.x, y: ROWS[b.row] }]);
    setTimeout(() => setBooms((list) => list.filter((o) => o.id !== b.id)), 400);
    const total = hits + 1;
    hitsRef.current = total;
    setHits(total);
    if (total >= game.target) {
      finish(true, `${total} garrafas no chão com ${Math.ceil(left)}s de sobra. Que pontaria!`);
    }
  };

  return (
    <div>
      <TimeBar left={left} total={game.seconds} />
      <p className="game-hint">
        Acertos: {hits} de {game.target}
      </p>
      <div className="range">
        {ROWS.map((y) => (
          <div key={y} className="range-shelf" style={{ top: `${y}%` }} />
        ))}
        {bottles.map((b) => (
          <button key={b.id} className="range-bottle" style={{ left: `${b.x}%`, top: `${ROWS[b.row]}%` }} onPointerDown={() => shoot(b)} aria-label="Garrafa">
            <BottleArt hue={b.hue} />
          </button>
        ))}
        {booms.map((b) => (
          <span key={b.id} className="range-boom" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
            💥
          </span>
        ))}
      </div>
    </div>
  );
}
