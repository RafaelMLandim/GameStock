import { useState } from 'react';
import { shuffle, type GameProps } from './util';
import { sfx } from '../../sound';

export default function Quiz({ game, onFinish }: GameProps<'quiz'>) {
  const [questions] = useState(() =>
    game.questions.map((q) => ({ question: q.question, options: shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer }))) })),
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = questions[index];
  const last = index === questions.length - 1;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (q.options[i].correct) {
      sfx.correct();
      setScore((s) => s + 1);
    } else sfx.wrong();
  };

  const next = () => {
    if (!last) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    const won = score >= game.minCorrect;
    onFinish(won, `Você acertou ${score} de ${questions.length} (precisava de ${game.minCorrect}).`);
  };

  return (
    <div className="quiz">
      <p className="game-hint">
        Pergunta {index + 1} de {questions.length} · Acertos: {score}
      </p>
      <h3 className="quiz-question">{q.question}</h3>
      <div className="quiz-options">
        {q.options.map((o, i) => (
          <button
            key={i}
            className={`quiz-option${picked !== null && o.correct ? ' right' : ''}${picked === i && !o.correct ? ' wrong' : ''}`}
            disabled={picked !== null}
            onClick={() => pick(i)}
          >
            {o.text}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="game-feedback">
          <span>{q.options[picked].correct ? '✅ Na mosca, parceiro!' : '❌ Errou o tiro.'}</span>
          <button className="btn primary" onClick={next}>
            {last ? 'Ver resultado' : 'Próxima ➜'}
          </button>
        </div>
      )}
    </div>
  );
}
