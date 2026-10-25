import { useEffect, useState } from 'react';
import { useIsPhone } from '../shared';
import { shuffle, type GameProps } from './util';
import { sfx } from '../../sound';

interface Card {
  key: number;
  pair: number;
  text: string;
}

/** Colunas que fecham a grade sem carta sobrando (no celular, cartas mais largas para caber texto). */
function columns(cards: number, phone: boolean): number {
  const options = phone ? [3, 4, 2] : [4, 3, 5];
  return options.find((c) => cards % c === 0) ?? options[0];
}

/** Carta só com emoji (sem letras nem números) aparece grande; palavras curtas como "Pés" ficam no tamanho de texto. */
function isEmojiOnly(text: string): boolean {
  return [...text].length <= 3 && !/[\p{L}\p{N}]/u.test(text);
}

export default function Memoria({ game, onFinish }: GameProps<'memoria'>) {
  const phone = useIsPhone();
  const [cards] = useState<Card[]>(() =>
    shuffle(game.pairs.flatMap(([a, b], pair) => [{ key: pair * 2, pair, text: a }, { key: pair * 2 + 1, pair, text: b }])),
  );
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.includes(cards[i].pair)) return;
    const next = [...open, i];
    setOpen(next);
    sfx.flip();
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((n) => cards[n]);
    if (a.pair === b.pair) {
      sfx.correct();
      setMatched((m) => [...m, a.pair]);
      setOpen([]);
    } else {
      setTimeout(() => setOpen([]), 900);
    }
  };

  useEffect(() => {
    if (matched.length === game.pairs.length) onFinish(true, `Você encontrou todos os pares em ${moves} jogadas.`);
  }, [matched.length]);

  return (
    <div>
      <p className="game-hint">
        Pares encontrados: {matched.length} de {game.pairs.length} · Jogadas: {moves}
      </p>
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${columns(cards.length, phone)}, 1fr)` }}>
        {cards.map((c, i) => {
          const up = open.includes(i) || matched.includes(c.pair);
          return (
            <button
              key={c.key}
              className={`memory-card${up ? ' up' : ''}${matched.includes(c.pair) ? ' matched' : ''}`}
              onClick={() => flip(i)}
              aria-label={up ? c.text : 'Carta virada'}
            >
              {/* As duas faces ficam montadas; a carta gira em 3D para mostrar uma ou outra. */}
              <span className="memory-inner">
                <span className="memory-face memory-cover">
                  <span className="memory-back">🤠</span>
                </span>
                <span className="memory-face memory-front">
                  <span className={isEmojiOnly(c.text) ? 'memory-emoji' : 'memory-text'}>{c.text}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
