import { useEffect, useState } from 'react';
import { plain, shuffle, type GameProps } from './util';
import { sfx } from '../../sound';

const MAX_ERRORS = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Forca de madeira; cada erro desenha uma parte do forasteiro. */
function Gallows({ errors }: { errors: number }) {
  const ink = { stroke: '#2b1a0e', strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg viewBox="0 0 160 170" className="forca-art" aria-label={`${errors} de ${MAX_ERRORS} erros`}>
      <rect x="10" y="155" width="120" height="10" rx="3" fill="#6b3e1e" />
      <rect x="28" y="12" width="10" height="145" fill="#8b5a2b" />
      <rect x="28" y="10" width="92" height="9" fill="#8b5a2b" />
      <line x1="38" y1="40" x2="62" y2="19" stroke="#6b3e1e" strokeWidth="6" />
      <line x1="106" y1="19" x2="106" y2="38" stroke="#c9a46a" strokeWidth="3" />
      {errors > 0 && (
        <g>
          <circle cx="106" cy="52" r="13" fill="#e0a87a" stroke="#2b1a0e" strokeWidth="3" />
          <ellipse cx="106" cy="40" rx="20" ry="4" fill="#6b3e1e" />
          <rect x="96" y="28" width="20" height="12" rx="4" fill="#6b3e1e" />
        </g>
      )}
      {errors > 1 && <line x1="106" y1="65" x2="106" y2="105" {...ink} />}
      {errors > 2 && <line x1="106" y1="75" x2="88" y2="94" {...ink} />}
      {errors > 3 && <line x1="106" y1="75" x2="124" y2="94" {...ink} />}
      {errors > 4 && <line x1="106" y1="105" x2="92" y2="132" {...ink} />}
      {errors > 5 && <line x1="106" y1="105" x2="120" y2="132" {...ink} />}
    </svg>
  );
}

export default function Forca({ game, onFinish }: GameProps<'forca'>) {
  const [clue] = useState(() => shuffle(game.words)[0]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const target = plain(clue.word);
  const letters = [...new Set(target.replace(/[^A-Z]/g, ''))];
  const errors = guessed.filter((l) => !target.includes(l)).length;
  const won = letters.every((l) => guessed.includes(l));
  const lost = errors >= MAX_ERRORS;

  const guess = (letter: string) => {
    if (won || lost || guessed.includes(letter)) return;
    if (target.includes(letter)) sfx.correct();
    else sfx.wrong();
    setGuessed((g) => (g.includes(letter) ? g : [...g, letter]));
  };

  useEffect(() => {
    if (won) onFinish(true, `A palavra era ${clue.word}.`);
    else if (lost) onFinish(false, `A palavra era ${clue.word}.`);
  }, [won, lost]);

  // Também dá para jogar pelo teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const l = plain(e.key);
      if (/^[A-Z]$/.test(l)) guess(l);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="forca">
      <Gallows errors={errors} />
      <div>
        <p className="game-hint">💡 Dica: {clue.hint}</p>
        <div className="forca-word" aria-label="Palavra">
          {[...clue.word].map((ch, i) => {
            const p = plain(ch);
            if (ch === ' ') return <span key={i} className="forca-gap" />;
            const hidden = /[A-Z]/.test(p) && !guessed.includes(p);
            return (
              <span key={i} className="forca-letter">
                {hidden ? '' : ch.toUpperCase()}
              </span>
            );
          })}
        </div>
        <p className="muted">
          Erros: {errors} de {MAX_ERRORS}
        </p>
        <div className="keyboard">
          {ALPHABET.map((l) => (
            <button
              key={l}
              className={`key${guessed.includes(l) ? (target.includes(l) ? ' hit' : ' miss') : ''}`}
              disabled={guessed.includes(l)}
              onClick={() => guess(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
