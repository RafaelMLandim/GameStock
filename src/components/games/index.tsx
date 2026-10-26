import { useEffect, useRef, useState } from 'react';
import { BADGE_POINTS, BADGE_WIN_BONUS, CATEGORY_LABELS, MAX_PENDING_BADGES, WIN_POINTS } from '../../data';
import { badgeBonus, badgeTypesIn, pendingBadges, suggestedBadge, winPoints } from '../../game';
import { useGame } from '../../GameContext';
import { isInstalled } from '../../install';
import { sfx } from '../../sound';
import { useIsPhone } from '../shared';
import type { GameKind, Mission, MissionGame } from '../../types';
import { RequestBadge } from '../Badges';
import CacaCacto from './CacaCacto';
import Corrida from './Corrida';
import Duelo from './Duelo';
import Embaralhada from './Embaralhada';
import Forca from './Forca';
import Memoria from './Memoria';
import Ordem from './Ordem';
import Quiz from './Quiz';
import TiroAlvo from './TiroAlvo';
import VerdadeiroFalso from './VerdadeiroFalso';

/** Pausa entre o fim do jogo e a tela de resultado, para ver a última jogada (tiro, garrafa, carta...). */
const END_PAUSE_MS = 1800;

interface GameInfo {
  icon: string;
  label: string;
  rules: string;
  /** Conteúdo escrito pela gestão, uma linha por item (jogos de habilidade não têm). */
  content?: { help: string; placeholder: string };
  params: { key: string; label: string; step?: number }[];
}

export const GAME_INFO: Record<GameKind, GameInfo> = {
  forca: {
    icon: '💀',
    label: 'Jogo da Forca',
    rules: 'Adivinhe a palavra letra por letra. Seis erros e o forasteiro vai pra forca!',
    content: { help: 'Uma palavra por linha: PALAVRA | dica (o jogo sorteia uma)', placeholder: 'PALETE | Base de madeira para empilhar a carga' },
    params: [],
  },
  memoria: {
    icon: '🃏',
    label: 'Jogo da Memória',
    rules: 'Vire duas cartas por vez e encontre todos os pares.',
    content: { help: 'Um par por linha: carta A | carta B (repita o texto para pares iguais)', placeholder: '🧤 Luva | Mãos' },
    params: [],
  },
  quiz: {
    icon: '❓',
    label: 'Quiz do Xerife',
    rules: 'Responda às perguntas escolhendo uma alternativa. Acerte o mínimo para vencer.',
    content: {
      help: 'Uma pergunta por linha: Pergunta | *alternativa certa | errada | errada (marque a certa com *)',
      placeholder: 'O que é EPI? | *Equipamento de Proteção Individual | Estoque de Peças Importadas',
    },
    params: [{ key: 'minCorrect', label: 'Acertos para vencer' }],
  },
  embaralhada: {
    icon: '🔤',
    label: 'Palavra Embaralhada',
    rules: 'Desembaralhe todas as palavras antes que o tempo acabe. Acentos não importam.',
    content: { help: 'Uma palavra por linha: PALAVRA | dica', placeholder: 'VALIDADE | Data limite do produto' },
    params: [{ key: 'seconds', label: 'Tempo total (s)' }],
  },
  ordem: {
    icon: '🚂',
    label: 'Ordene a Trilha',
    rules: 'Coloque as etapas na ordem certa. Você tem 3 tentativas de conferir.',
    content: { help: 'Uma etapa por linha, já na ordem CERTA (o jogo embaralha)', placeholder: 'Conferir a nota fiscal' },
    params: [],
  },
  vf: {
    icon: '⚖️',
    label: 'Verdadeiro ou Falso',
    rules: 'Cada afirmação tem poucos segundos. Responda V ou F antes do relógio zerar.',
    content: { help: 'Uma afirmação por linha: V | texto  ou  F | texto', placeholder: 'V | Corredores devem ficar livres.' },
    params: [
      { key: 'minCorrect', label: 'Acertos para vencer' },
      { key: 'seconds', label: 'Segundos por afirmação' },
    ],
  },
  tiro: {
    icon: '🎯',
    label: 'Tiro ao Alvo',
    rules: 'Garrafas aparecem na cerca por pouco tempo. Clique nelas e acerte a meta antes do tempo acabar.',
    params: [
      { key: 'target', label: 'Acertos para vencer' },
      { key: 'seconds', label: 'Tempo (s)' },
    ],
  },
  duelo: {
    icon: '🔫',
    label: 'Duelo ao Meio-Dia',
    rules: 'Espere o sino tocar e clique o mais rápido possível. Se clicar antes do sino, perde a rodada!',
    params: [
      { key: 'rounds', label: 'Rodadas (melhor de)' },
      { key: 'banditMs', label: 'Reflexo do bandido (ms)', step: 10 },
    ],
  },
  cacto: {
    icon: '🌵',
    label: 'Caça ao Cacto',
    rules: 'Encontre todos os cactos escondidos no deserto. Clicar em outra coisa tira 2 segundos!',
    params: [
      { key: 'count', label: 'Cactos escondidos' },
      { key: 'seconds', label: 'Tempo (s)' },
    ],
  },
  corrida: {
    icon: '🐎',
    label: 'Corrida de Cavalos',
    rules: 'Alterne os botões ◀ ▶ (ou as setas do teclado) bem rápido para seu cavalo cruzar a linha primeiro.',
    params: [
      { key: 'rivals', label: 'Rivais' },
      { key: 'speed', label: 'Velocidade dos rivais (1 = normal)', step: 0.1 },
    ],
  },
};

export function defaultGame(kind: GameKind): MissionGame {
  switch (kind) {
    case 'forca':
      return { kind, words: [{ word: 'ESTOQUE', hint: 'Onde guardamos tudo que chega' }] };
    case 'memoria':
      return { kind, pairs: [['🤠', '🤠'], ['🐎', '🐎'], ['🌵', '🌵'], ['⭐', '⭐']] };
    case 'quiz':
      return { kind, minCorrect: 1, questions: [{ question: 'O que é EPI?', options: ['Equipamento de Proteção Individual', 'Estoque de Peças Importadas'], answer: 0 }] };
    case 'embaralhada':
      return { kind, seconds: 60, words: [{ word: 'PALETE', hint: 'Base de madeira para a carga' }] };
    case 'ordem':
      return { kind, steps: ['Primeira etapa', 'Segunda etapa', 'Terceira etapa'] };
    case 'vf':
      return { kind, minCorrect: 1, seconds: 8, statements: [{ text: 'Corredores devem ficar livres.', answer: true }] };
    case 'tiro':
      return { kind, target: 12, seconds: 30 };
    case 'duelo':
      return { kind, rounds: 3, banditMs: 600 };
    case 'cacto':
      return { kind, count: 5, seconds: 40 };
    case 'corrida':
      return { kind, rivals: 3, speed: 1 };
  }
}

const split = (line: string) => line.split('|').map((s) => s.trim());
const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** Conteúdo do jogo no formato de texto do editor (uma linha por item). */
export function contentToText(g: MissionGame): string {
  switch (g.kind) {
    case 'forca':
    case 'embaralhada':
      return g.words.map((w) => `${w.word} | ${w.hint}`).join('\n');
    case 'memoria':
      return g.pairs.map(([a, b]) => `${a} | ${b}`).join('\n');
    case 'quiz':
      return g.questions.map((q) => [q.question, ...q.options.map((o, i) => (i === q.answer ? `*${o}` : o))].join(' | ')).join('\n');
    case 'ordem':
      return g.steps.join('\n');
    case 'vf':
      return g.statements.map((s) => `${s.answer ? 'V' : 'F'} | ${s.text}`).join('\n');
    default:
      return '';
  }
}

/** Lê o texto do editor de volta para o conteúdo do jogo. */
export function textToContent(g: MissionGame, text: string): MissionGame {
  switch (g.kind) {
    case 'forca':
    case 'embaralhada':
      return { ...g, words: lines(text).map((l) => ({ word: split(l)[0].toUpperCase(), hint: split(l)[1] ?? '' })) };
    case 'memoria':
      return { ...g, pairs: lines(text).map((l) => [split(l)[0], split(l)[1] ?? split(l)[0]] as [string, string]) };
    case 'quiz':
      return {
        ...g,
        questions: lines(text).map((l) => {
          const [question, ...raw] = split(l);
          const answer = Math.max(0, raw.findIndex((o) => o.startsWith('*')));
          return { question, options: raw.map((o) => o.replace(/^\*\s*/, '')), answer };
        }),
      };
    case 'ordem':
      return { ...g, steps: lines(text) };
    case 'vf':
      return {
        ...g,
        statements: lines(text).map((l) => {
          const [flag, ...rest] = split(l);
          return { text: rest.join(' | ') || flag, answer: !/^f/i.test(flag) };
        }),
      };
    default:
      return g;
  }
}

/** O conteúdo tem o mínimo para o jogo funcionar? Retorna o problema, se houver. */
export function gameProblem(g: MissionGame): string | null {
  switch (g.kind) {
    case 'forca':
    case 'embaralhada':
      return g.words.length && g.words.every((w) => /[A-Z]/i.test(w.word)) ? null : 'Cadastre pelo menos uma palavra.';
    case 'memoria':
      return g.pairs.length >= 2 ? null : 'Cadastre pelo menos 2 pares.';
    case 'quiz':
      if (!g.questions.length || g.questions.some((q) => q.options.length < 2)) return 'Cada pergunta precisa de pelo menos 2 alternativas.';
      return g.minCorrect <= g.questions.length ? null : 'Acertos para vencer é maior que o número de perguntas.';
    case 'ordem':
      return g.steps.length >= 2 ? null : 'Cadastre pelo menos 2 etapas.';
    case 'vf':
      if (!g.statements.length) return 'Cadastre pelo menos uma afirmação.';
      return g.minCorrect <= g.statements.length ? null : 'Acertos para vencer é maior que o número de afirmações.';
    default:
      return null;
  }
}

function Minigame({ game, onFinish }: { game: MissionGame; onFinish: (won: boolean, detail?: string) => void }) {
  switch (game.kind) {
    case 'forca':
      return <Forca game={game} onFinish={onFinish} />;
    case 'memoria':
      return <Memoria game={game} onFinish={onFinish} />;
    case 'quiz':
      return <Quiz game={game} onFinish={onFinish} />;
    case 'embaralhada':
      return <Embaralhada game={game} onFinish={onFinish} />;
    case 'ordem':
      return <Ordem game={game} onFinish={onFinish} />;
    case 'vf':
      return <VerdadeiroFalso game={game} onFinish={onFinish} />;
    case 'tiro':
      return <TiroAlvo game={game} onFinish={onFinish} />;
    case 'duelo':
      return <Duelo game={game} onFinish={onFinish} />;
    case 'cacto':
      return <CacaCacto game={game} onFinish={onFinish} />;
    case 'corrida':
      return <Corrida game={game} onFinish={onFinish} />;
  }
}

/** Depois da vitória: leva o assunto do jogo para a prática, sugerindo um distintivo. */
function BadgeTip({ mission, practice }: { mission: Mission; practice?: boolean }) {
  const { state, myPlayer } = useGame();
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState(false);
  const badge = suggestedBadge(state, mission, myPlayer?.id);
  const canAsk = !practice && !!myPlayer && pendingBadges(state, myPlayer.id).length < MAX_PENDING_BADGES;

  if (sent) return <p className="ok badge-tip">📨 Pedido enviado! A gestão vai analisar e você acompanha na aba 🎖️ Distintivos.</p>;
  if (asking && myPlayer) {
    return (
      <div className="badge-tip-form">
        <RequestBadge
          player={myPlayer}
          initialType={badge.id}
          onDone={(ok) => {
            setAsking(false);
            setSent(ok);
          }}
        />
      </div>
    );
  }
  return (
    <div className="badge-tip">
      <span className="badge-tip-icon">{badge.icon}</span>
      <div>
        <b>💡 Aumente seus pontos nas missões solicitando um distintivo</b>
        <p>
          <b>{badge.name}</b>: {badge.description} Vale {BADGE_POINTS} pontos e +{BADGE_WIN_BONUS} ponto extra nas próximas missões de{' '}
          {CATEGORY_LABELS[badge.category]}.
        </p>
        {canAsk && (
          <button className="btn" onClick={() => setAsking(true)}>
            📨 Pedir {badge.name}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Tela da missão: regras → minijogo → resultado.
 * Em modo treino (gestão testando ou missão já paga) a vitória não vale recompensa.
 */
export function PlayMission({ mission, practice, onClose }: { mission: Mission; practice?: boolean; onClose: () => void }) {
  const { state, dispatch, myPlayer } = useGame();
  const phone = useIsPhone();
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ won: boolean; detail?: string; points?: number }>({ won: false });
  const info = GAME_INFO[mission.game.kind];
  // Distintivos da categoria da missão rendem pontos extras na vitória.
  const bonusBadges = myPlayer && !practice ? badgeTypesIn(state, myPlayer.id, mission.category) : [];
  const bonus = myPlayer && !practice ? badgeBonus(state, myPlayer.id, mission.category) : 0;

  // Fim do jogo: o resultado fica por cima do jogo parado um instante (a última jogada aparece) e só depois vem a tela de resultado.
  const [ending, setEnding] = useState<{ won: boolean } | null>(null);
  const ended = useRef(false);
  const endTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(endTimer.current), []);

  // Ao fechar a missão, sai da tela cheia que o "Começar" pediu.
  useEffect(
    () => () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
    [],
  );

  const start = () => {
    // No celular pelo navegador, esconde a barra de endereço (no app instalado ela já não existe; iPhone não deixa).
    if (phone && !isInstalled() && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
    }
    setPhase('play');
  };

  const finish = (won: boolean, detail?: string) => {
    // Alguns jogos ainda têm relógio correndo: só vale o primeiro fim.
    if (ended.current) return;
    ended.current = true;
    setEnding({ won });
    // Registra já, para não perder a vitória se a pessoa fechar durante a pausa.
    if (practice || !myPlayer) {
      setResult({ won, detail });
    } else {
      // Vencer de primeira vale mais pontos na premiação; cada derrota fica registrada.
      const failures = myPlayer.attempts[mission.id] ?? 0;
      setResult({ won, detail, points: won ? winPoints(failures) + bonus : undefined });
      dispatch({ type: won ? 'WIN_MISSION' : 'LOSE_MISSION', playerId: myPlayer.id, missionId: mission.id });
    }
    endTimer.current = window.setTimeout(() => {
      setPhase('result');
      setEnding(null);
      (won ? sfx.win : sfx.lose)();
    }, END_PAUSE_MS);
  };

  const replay = () => {
    ended.current = false;
    setAttempt(attempt + 1);
    setPhase('play');
  };

  return (
    <div className="modal-backdrop game-backdrop">
      <div className={`modal game-modal${phase === 'play' ? ' playing' : ''}`} role="dialog" aria-label={mission.name}>
        <div className="modal-head">
          <span className="mission-icon">{mission.icon}</span>
          <div>
            <h2>{mission.name}</h2>
            <p className="muted">
              {info.icon} {info.label}
              {practice ? ' · modo treino (não vale recompensa)' : ` · recompensa $${mission.reward}`}
            </p>
          </div>
          <button className="btn small modal-close" onClick={onClose} aria-label="Fechar">
            ✖
          </button>
        </div>

        {phase === 'intro' && (
          <div className="game-intro">
            <p>{mission.description}</p>
            <p className="game-rules">📜 {info.rules}</p>
            {bonus > 0 && (
              <p className="badge-bonus">
                🎖️ +{bonus} ponto(s) extra(s) se vencer, pelo(s) seu(s) distintivo(s) {bonusBadges.map((t) => `${t.icon} ${t.name}`).join(' e ')}!
              </p>
            )}
            <button className="btn primary big" onClick={start}>
              ▶️ Começar
            </button>
          </div>
        )}

        {phase === 'play' && (
          <div className="game-area">
            <Minigame key={attempt} game={mission.game} onFinish={finish} />
            {ending && (
              <div className="game-ending" aria-live="polite">
                <div className={`game-ending-banner ${ending.won ? 'won' : 'lost'}`}>{ending.won ? '🏆 Venceu!' : '💀 Não foi dessa vez…'}</div>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className={`game-result ${result.won ? 'won' : 'lost'}`}>
            <div className="game-result-icon">{result.won ? '🏆' : '💀'}</div>
            <h3>{result.won ? 'Missão cumprida, parceiro!' : 'Não foi dessa vez…'}</h3>
            {result.detail && <p>{result.detail}</p>}
            {result.won && !practice && (
              <p className="ok">
                +${mission.reward} na sua carteira e +{result.points} ponto(s) de {CATEGORY_LABELS[mission.category]}
                {result.points! - bonus === WIN_POINTS[0] ? ' (de primeira!)' : ''}
                {bonus > 0 ? `, com +${bonus} dos seus distintivos 🎖️` : ''}. O progresso no mapa foi registrado.
              </p>
            )}
            {!result.won && !practice && <p className="muted">Vencer de primeira vale {WIN_POINTS[0]} pontos; depois, menos. Mas pode tentar quantas vezes quiser!</p>}
            <div className="actions">
              {!result.won && (
                <button className="btn primary" onClick={replay}>
                  🔁 Tentar de novo
                </button>
              )}
              {result.won && practice && (
                <button className="btn" onClick={replay}>
                  🔁 Jogar de novo
                </button>
              )}
              <button className={result.won ? 'btn primary' : 'btn'} onClick={onClose}>
                Voltar ao mapa
              </button>
            </div>
            {result.won && <BadgeTip mission={mission} practice={practice} />}
          </div>
        )}
      </div>
    </div>
  );
}
