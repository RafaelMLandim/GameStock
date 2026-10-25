import { useState } from 'react';
import { shuffle, type GameProps } from './util';
import { sfx } from '../../sound';

const MAX_TRIES = 3;

export default function Ordem({ game, onFinish }: GameProps<'ordem'>) {
  const [items, setItems] = useState(() => {
    let out = shuffle(game.steps);
    while (game.steps.length > 1 && out.join('|') === game.steps.join('|')) out = shuffle(game.steps);
    return out;
  });
  const [tries, setTries] = useState(0);
  const [checked, setChecked] = useState(false);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setChecked(false);
    sfx.flip();
  };

  const check = () => {
    const t = tries + 1;
    setTries(t);
    setChecked(true);
    const right = items.filter((s, i) => s === game.steps[i]).length;
    if (right < items.length) sfx.wrong();
    if (right === items.length) onFinish(true, t === 1 ? 'De primeira! Trilha perfeita.' : `Acertou na tentativa ${t}.`);
    else if (t >= MAX_TRIES) onFinish(false, `${right} de ${items.length} etapas no lugar certo. Acabaram as tentativas.`);
  };

  const right = items.filter((s, i) => s === game.steps[i]).length;

  return (
    <div>
      <p className="game-hint">
        Use as setas para pôr as etapas em ordem, do começo ao fim. Tentativas: {tries} de {MAX_TRIES}
      </p>
      <ol className="order-list">
        {items.map((s, i) => (
          <li key={s} className={checked ? (s === game.steps[i] ? 'right' : 'wrong') : undefined}>
            <span className="order-num">{i + 1}</span>
            <span className="order-text">{s}</span>
            <button className="btn small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">
              ▲
            </button>
            <button className="btn small" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Descer">
              ▼
            </button>
          </li>
        ))}
      </ol>
      <div className="game-feedback">
        {checked && <span>{right} de {items.length} no lugar certo (verde).</span>}
        <button className="btn primary" onClick={check}>
          🔍 Conferir
        </button>
      </div>
    </div>
  );
}
