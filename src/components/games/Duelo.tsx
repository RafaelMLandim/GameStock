import { useEffect, useRef, useState } from 'react';
import { makeLook } from '../../avatar';
import { useGame } from '../../GameContext';
import AvatarFigure from '../AvatarFigure';
import { sfx } from '../../sound';
import { random, type GameProps } from './util';

const BANDIT = makeLook({
  hat: 'cowboy',
  hatColor: '#2b2b2b',
  eyes: 'raivoso',
  mouth: 'bravo',
  facialHair: 'bigode',
  top: 'poncho',
  topColor: '#3b3b3b',
  accentColor: '#a8321e',
  pantsColor: '#2b2b2b',
  accessories: ['bandana', 'coldre'],
});

const INK = '#2b1a0e';
const line = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const };

/** Fachada de madeira com a frente falsa (mais alta que o telhado), varanda e placa. */
function Building({ x, w, h, front, color, sign, doors }: { x: number; w: number; h: number; front: number; color: string; sign: string; doors?: 'saloon' | 'porta' }) {
  const ground = 130;
  const top = ground - h;
  const windows = Math.max(1, Math.floor((w - 16) / 22));
  const gap = (w - windows * 12) / (windows + 1);
  return (
    <g>
      {/* frente falsa com degraus no topo */}
      <path
        d={`M${x} ${ground} L${x} ${top} L${x + 4} ${top} L${x + 4} ${top - front} L${x + w - 4} ${top - front} L${x + w - 4} ${top} L${x + w} ${top} L${x + w} ${ground} Z`}
        fill={color}
        {...line}
      />
      {/* tábuas */}
      {Array.from({ length: Math.floor(w / 8) }, (_, i) => (
        <line key={i} x1={x + 8 * (i + 1)} y1={top - front + 2} x2={x + 8 * (i + 1)} y2={ground - 22} stroke="rgba(43,26,14,0.18)" strokeWidth="1" />
      ))}
      <rect x={x + 7} y={top - front + 4} width={w - 14} height="11" fill="#f4e4c1" stroke={INK} strokeWidth="1.2" />
      <text
        x={x + w / 2}
        y={top - front + 12.6}
        fontSize="7.4"
        fontWeight="700"
        textAnchor="middle"
        fill={INK}
        fontFamily="Rye, Georgia, serif"
        // placa estreita: aperta o texto para caber
        {...(sign.length * 6 > w - 18 ? { textLength: w - 18, lengthAdjust: 'spacingAndGlyphs' } : {})}
      >
        {sign}
      </text>
      {/* janelas do andar de cima */}
      {Array.from({ length: windows }, (_, i) => (
        <g key={i}>
          <rect x={x + gap + i * (12 + gap)} y={top + 6} width="12" height="14" fill="#f6d27a" {...line} />
          <line x1={x + gap + i * (12 + gap) + 6} y1={top + 6} x2={x + gap + i * (12 + gap) + 6} y2={top + 20} stroke={INK} strokeWidth="1" />
        </g>
      ))}
      {/* varanda: telhadinho e postes */}
      <path d={`M${x - 3} ${ground - 30} L${x + w + 3} ${ground - 30} L${x + w + 3} ${ground - 26} L${x - 3} ${ground - 26} Z`} fill="#6b4a2b" {...line} />
      <line x1={x + 1} y1={ground - 26} x2={x + 1} y2={ground} {...line} />
      <line x1={x + w - 1} y1={ground - 26} x2={x + w - 1} y2={ground} {...line} />
      {doors === 'saloon' ? (
        // portas vaivém do saloon
        <g>
          <rect x={x + w / 2 - 9} y={ground - 22} width="18" height="22" fill="#3a2414" {...line} />
          <path d={`M${x + w / 2 - 9} ${ground - 17} L${x + w / 2 - 0.6} ${ground - 15} L${x + w / 2 - 0.6} ${ground - 6} L${x + w / 2 - 9} ${ground - 6} Z`} fill="#c8902e" {...line} />
          <path d={`M${x + w / 2 + 9} ${ground - 17} L${x + w / 2 + 0.6} ${ground - 15} L${x + w / 2 + 0.6} ${ground - 6} L${x + w / 2 + 9} ${ground - 6} Z`} fill="#c8902e" {...line} />
        </g>
      ) : (
        <rect x={x + w / 2 - 7} y={ground - 21} width="14" height="21" fill="#5a3a20" {...line} />
      )}
      {w > 50 && (
        <>
          <rect x={x + 6} y={ground - 20} width="10" height="11" fill="#f6d27a" {...line} />
          <rect x={x + w - 16} y={ground - 20} width="10" height="11" fill="#f6d27a" {...line} />
        </>
      )}
    </g>
  );
}

/** Rua da cidade atrás do duelo: saloon, banco, xerife, armazém e hotel, com calçada de tábuas. */
function DuelTown() {
  return (
    <svg className="duel-town" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {/* montanhas ao longe */}
      <path d="M0 108 L40 84 L72 100 L118 70 L160 98 L210 76 L258 100 L300 80 L346 102 L400 86 L400 130 L0 130 Z" fill="#d79a5e" opacity="0.55" />
      {/* caixa d'água */}
      <g {...line}>
        <line x1="352" y1="128" x2="358" y2="72" />
        <line x1="384" y1="128" x2="378" y2="72" />
        <line x1="354" y1="104" x2="382" y2="104" strokeWidth="1" />
        <rect x="350" y="56" width="36" height="18" rx="2" fill="#8b6b4a" />
        <path d="M348 57 L368 46 L388 57 Z" fill="#6b4a2b" />
      </g>
      {/* no celular só a faixa do meio aparece: as fachadas principais ficam entre x=54 e x=346 */}
      <Building x={2} w={48} h={50} front={10} color="#a88a5a" sign="CORREIO" />
      <Building x={54} w={60} h={64} front={16} color="#b5603a" sign="SALOON" doors="saloon" />
      <Building x={117} w={42} h={54} front={12} color="#c9a46a" sign="BANCO" />
      <Building x={162} w={42} h={54} front={10} color="#8b6b4a" sign="XERIFE" />
      <Building x={240} w={56} h={58} front={14} color="#9a4e34" sign="ARMAZÉM" />
      <Building x={299} w={46} h={68} front={12} color="#b07a45" sign="HOTEL" />
      {/* estrela do xerife na fachada */}
      <path d="M169 82 l2.2 4.4 4.8 0.6 -3.5 3.3 0.9 4.8 -4.4 -2.3 -4.4 2.3 0.9 -4.8 -3.5 -3.3 4.8 -0.6 Z" fill="#f2c12e" stroke={INK} strokeWidth="1" />
      {/* chão, calçada de tábuas e detalhes da rua */}
      <rect x="-2" y="130" width="404" height="72" fill="#d9b27a" />
      <rect x="-2" y="128" width="404" height="5" fill="#8b6b4a" {...line} />
      <path d="M30 160 Q50 156 70 160 M300 172 Q322 168 344 172 M180 186 Q196 183 212 186" fill="none" stroke="#b58b52" strokeWidth="2" strokeLinecap="round" />
      {/* barril, cerca de amarrar cavalo e um arbusto rolando */}
      <g {...line}>
        <rect x="222" y="114" width="13" height="16" rx="3" fill="#a2723f" />
        <line x1="222" y1="119" x2="235" y2="119" />
        <line x1="222" y1="125" x2="235" y2="125" />
        <line x1="208" y1="130" x2="208" y2="116" />
        <line x1="218" y1="130" x2="218" y2="116" />
        <line x1="205" y1="118" x2="221" y2="118" strokeWidth="2.4" />
      </g>
      <g className="duel-tumbleweed" fill="none" stroke="#a2723f" strokeWidth="1.4">
        <circle cx="0" cy="0" r="7" />
        <path d="M-6 -2 Q0 4 6 -3 M-4 5 Q1 -5 5 4 M-7 1 Q0 -1 7 2" />
      </g>
    </svg>
  );
}

/** Quem ainda não tem personagem (ex.: gestão testando) duela com um cowboy padrão. */
const HERO = makeLook({});


type Phase ='ready' | 'wait' | 'fire' | 'round';

export default function Duelo({ game, onFinish }: GameProps<'duelo'>) {
  const { myPlayer } = useGame();
  const [phase, setPhase] = useState<Phase>('ready');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [message, setMessage] = useState('');
  // Quem atirou na última rodada: aparece com o revólver erguido e o feixe da bala.
  const [shooter, setShooter] = useState<'hero' | 'bandit' | null>(null);
  const fireAt = useRef(0);
  const timers = useRef<number[]>([]);
  const need = Math.floor(game.rounds / 2) + 1;

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const endRound = (won: boolean, text: string) => {
    clearTimers();
    const w = wins + (won ? 1 : 0);
    const l = losses + (won ? 0 : 1);
    setWins(w);
    setLosses(l);
    setMessage(text);
    setShooter(won ? 'hero' : 'bandit');
    sfx.shot();
    setPhase('round');
    // Na rodada decisiva, deixa a animação do tiro (feixe, braço erguido) terminar antes do resultado.
    const finish = (won: boolean, detail: string) => onFinish(won, detail);
    if (w >= need) finish(true, `Você venceu ${w} duelo(s) contra ${l}. O bandido fugiu da cidade!`);
    else if (l >= need) finish(false, `O bandido venceu ${l} duelo(s) contra ${w}.`);
  };

  const start = () => {
    setMessage('');
    setShooter(null);
    setPhase('wait');
    const bandit = game.banditMs * random(0.85, 1.15);
    timers.current.push(
      window.setTimeout(() => {
        fireAt.current = performance.now();
        sfx.bell();
        setPhase('fire');
        timers.current.push(window.setTimeout(() => endRound(false, `💀 O bandido sacou em ${Math.round(bandit)} ms. Você foi lento!`), bandit));
      }, random(1500, 4000)),
    );
  };

  const draw = () => {
    if (phase === 'wait') endRound(false, '🚫 Sacou antes do sino! Isso é trapaça no Oeste.');
    else if (phase === 'fire') {
      const ms = Math.round(performance.now() - fireAt.current);
      endRound(true, `🔫 Bang! Você sacou em ${ms} ms, antes do bandido.`);
    }
  };

  return (
    <div className="duel">
      <p className="game-hint">
        Placar: você {wins} × {losses} bandido · vence quem ganhar {need} de {game.rounds}
      </p>
      <div className={`duel-stage ${phase}`} onPointerDown={phase === 'wait' || phase === 'fire' ? draw : undefined}>
        <DuelTown />
        <div className={`duel-fighter${shooter === 'bandit' ? ' down' : ''}`}>
          <AvatarFigure look={myPlayer?.look ?? HERO} size={90} pose={shooter === 'hero' ? 'shoot' : undefined} />
        </div>
        <div className="duel-center">
          {phase === 'ready' && <span>Clique em “Pronto” e espere o sino…</span>}
          {phase === 'wait' && <span className="duel-wait">✋ Mão no coldre…</span>}
          {phase === 'fire' && <span className="duel-fire">🔔 FOGO! CLIQUE!</span>}
          {phase === 'round' && <span>{message}</span>}
        </div>
        <div className={`duel-fighter bandit${shooter === 'hero' ? ' down' : ''}`}>
          <AvatarFigure look={BANDIT} size={90} pose={shooter === 'bandit' ? 'shoot' : undefined} />
        </div>
        {/* a key faz o feixe animar de novo a cada rodada */}
        {shooter && <div key={`${wins}-${losses}`} className={`duel-beam from-${shooter}`} />}
      </div>
      {(phase === 'ready' || phase === 'round') && wins < need && losses < need && (
        <div className="game-feedback">
          <button className="btn primary" onClick={start}>
            🤠 Pronto{phase === 'round' ? ' para a próxima' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
