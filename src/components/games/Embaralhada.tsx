import { useState } from 'react';
import { TimeBar, plain, shuffle, useCountdown, type GameProps } from './util';
import { sfx } from '../../sound';

const squash = (text: string) => plain(text).replace(/[^A-Z]/g, '');

/** Embaralha as letras garantindo que não fique igual à palavra original. */
function scramble(word: string): string[] {
  const letters = [...word.toUpperCase().replace(/\s/g, '')];
  if (new Set(letters).size < 2) return letters;
  let out = shuffle(letters);
  while (out.join('') === letters.join('')) out = shuffle(letters);
  return out;
}

export default function Embaralhada({ game, onFinish }: GameProps<'embaralhada'>) {
  const [queue, setQueue] = useState(() => shuffle(game.words).map((w) => ({ ...w, tiles: scramble(w.word) })));
  const [solved, setSolved] = useState(0);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [finished, setFinished] = useState(false);
  const { left } = useCountdown(game.seconds, !finished, () => {
    setFinished(true);
    onFinish(false, `O tempo acabou! Você desembaralhou ${solved} de ${game.words.length}.`);
  });
  const current = queue[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (squash(answer) !== squash(current.word)) {
      setWrong(true);
      sfx.wrong();
      return;
    }
    sfx.correct();
    setAnswer('');
    setWrong(false);
    setSolved(solved + 1);
    if (queue.length === 1) {
      setFinished(true);
      onFinish(true, `Todas as ${game.words.length} palavras desembaralhadas com ${Math.ceil(left)}s de sobra!`);
    } else {
      setQueue(queue.slice(1));
    }
  };

  return (
    <div className="scramble">
      <TimeBar left={left} total={game.seconds} />
      <p className="game-hint">
        Palavra {solved + 1} de {game.words.length} · 💡 {current.hint}
      </p>
      <div className="tiles">
        {current.tiles.map((t, i) => (
          <span key={i} className="tile">
            {t}
          </span>
        ))}
      </div>
      <form className="row compact" onSubmit={submit}>
        <input
          autoFocus
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setWrong(false);
          }}
          placeholder="Digite a palavra"
          className={wrong ? 'shake' : undefined}
        />
        <button className="btn primary">Responder</button>
        <button
          type="button"
          className="btn"
          disabled={queue.length < 2}
          onClick={() => {
            setQueue([...queue.slice(1), queue[0]]);
            setAnswer('');
            setWrong(false);
          }}
        >
          Pular
        </button>
      </form>
      {wrong && <p className="game-bad">Não é essa, forasteiro. Tente de novo!</p>}
    </div>
  );
}
