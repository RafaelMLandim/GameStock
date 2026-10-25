import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../GameContext';
import { random, type GameProps } from './util';
import { sfx } from '../../sound';

const STEP = 2;
const TICK = 100;
/** Na velocidade 1, um rival cruza a pista em ~13 s. */
const RIVAL_BASE = 100 / 130;
const RIVAL_NAMES = ['Relâmpago', 'Poeira', 'Trovão', 'Fumaça', 'Pé de Vento'];

export default function Corrida({ game, onFinish }: GameProps<'corrida'>) {
  const { myPlayer } = useGame();
  const [countdown, setCountdown] = useState(3);
  const [me, setMe] = useState(0);
  const [rivals, setRivals] = useState<number[]>(() => Array.from({ length: game.rivals }, () => 0));
  const [finished, setFinished] = useState(false);
  const lastSide = useRef<'L' | 'R' | null>(null);
  const meRef = useRef(0);
  const running = countdown === 0 && !finished;

  useEffect(() => {
    if (countdown === 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 800);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRivals((list) => list.map((p) => Math.min(100, p + RIVAL_BASE * game.speed * random(0.6, 1.4))));
    }, TICK);
    return () => clearInterval(timer);
  }, [running, game.speed]);

  useEffect(() => {
    if (running && rivals.some((p) => p >= 100)) {
      setFinished(true);
      onFinish(false, 'Um rival cruzou a linha primeiro. Alterne os botões mais rápido!');
    }
  }, [rivals]);

  const gallop = (side: 'L' | 'R') => {
    if (!running || lastSide.current === side) return;
    lastSide.current = side;
    sfx.hoof();
    const pos = Math.min(100, meRef.current + STEP);
    meRef.current = pos;
    setMe(pos);
    if (pos >= 100) {
      setFinished(true);
      onFinish(true, 'Você cruzou a linha de chegada em primeiro! 🏁');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') gallop('L');
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') gallop('R');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const lanes = [{ name: myPlayer?.codename ?? 'Você', pos: me, mine: true }, ...rivals.map((pos, i) => ({ name: RIVAL_NAMES[i % RIVAL_NAMES.length], pos, mine: false }))];

  return (
    <div>
      <p className="game-hint">Toque alternando ◀ e ▶ o mais rápido que puder (no computador, use as setas). Repetir o mesmo lado não vale!</p>
      <div className="race">
        {lanes.map((l, i) => (
          <div key={i} className={`race-lane${l.mine ? ' mine' : ''}`}>
            <span className="race-name">{l.name}</span>
            <span className="race-horse" style={{ left: `calc(${l.pos}% * 0.88)` }}>
              🐎
            </span>
          </div>
        ))}
        <div className="race-finish" />
        {countdown > 0 && <div className="race-count">{countdown}</div>}
      </div>
      <div className="race-buttons">
        <button className="btn primary" onPointerDown={() => gallop('L')} disabled={!running}>
          ◀
        </button>
        <button className="btn primary" onPointerDown={() => gallop('R')} disabled={!running}>
          ▶
        </button>
      </div>
    </div>
  );
}
