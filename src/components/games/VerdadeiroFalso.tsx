import { useState } from 'react';
import { TimeBar, shuffle, useCountdown, type GameProps } from './util';
import { sfx } from '../../sound';

/** Uma afirmação com o próprio relógio; responder ou estourar o tempo encerra a rodada. */
function Statement({ text, correct, seconds, onAnswer }: { text: string; correct: boolean; seconds: number; onAnswer: (value: boolean | null) => void }) {
  const [done, setDone] = useState(false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const answer = (v: boolean | null) => {
    if (done) return;
    setDone(true);
    setChosen(v);
    onAnswer(v);
  };
  // Depois de responder: a resposta certa fica verde e a escolha errada, vermelha (sem mexer no layout).
  const mark = (v: boolean) => (!done ? '' : v === correct ? ' right' : v === chosen ? ' wrong' : ' dim');
  const { left } = useCountdown(seconds, !done, () => answer(null));
  return (
    <div className="vf-round">
      <TimeBar left={left} total={seconds} />
      <h3 className="quiz-question">“{text}”</h3>
      <div className="vf-buttons">
        <button className={`btn vf-true${mark(true)}`} disabled={done} onClick={() => answer(true)}>
          ✅ Verdadeiro
        </button>
        <button className={`btn vf-false${mark(false)}`} disabled={done} onClick={() => answer(false)}>
          ❌ Falso
        </button>
      </div>
    </div>
  );
}

export default function VerdadeiroFalso({ game, onFinish }: GameProps<'vf'>) {
  const [list] = useState(() => shuffle(game.statements));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const onAnswer = (value: boolean | null) => {
    const right = value === list[index].answer;
    const total = score + (right ? 1 : 0);
    setScore(total);
    if (right) sfx.correct();
    else sfx.wrong();
    setFeedback(value === null ? '⏰ Tempo esgotado!' : right ? '✅ Certo!' : `❌ Errado! Era ${list[index].answer ? 'verdadeiro' : 'falso'}.`);
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 < list.length) setIndex(index + 1);
      else onFinish(total >= game.minCorrect, `Você acertou ${total} de ${list.length} (precisava de ${game.minCorrect}).`);
    }, 1100);
  };

  return (
    <div className="game-stage">
      <p className="game-hint">
        Afirmação {index + 1} de {list.length} · Acertos: {score}
      </p>
      <Statement key={index} text={list[index].text} correct={list[index].answer} seconds={game.seconds} onAnswer={onAnswer} />
      {/* aviso flutuante por cima da afirmação: não empurra os botões */}
      {feedback && (
        <p className={`game-toast${feedback.startsWith('✅') ? ' good' : ' bad'}`} role="status">
          {feedback}
        </p>
      )}
    </div>
  );
}
