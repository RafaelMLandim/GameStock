import { useId, type CSSProperties, type ReactNode } from 'react';

/** Cenários do Velho Oeste para o fundo do personagem, no mesmo traço dos bonecos. */
export const BACKDROPS = [
  { id: 'cor', label: 'Cor lisa' },
  { id: 'deserto', label: 'Deserto' },
  { id: 'cidade', label: 'Rua da cidade' },
  { id: 'saloon', label: 'Saloon' },
  { id: 'mina', label: 'Mina de ouro' },
  { id: 'ferrovia', label: 'Ferrovia' },
  { id: 'canion', label: 'Cânion' },
  { id: 'fogueira', label: 'Noite na fogueira' },
] as const;

export type BackdropId = (typeof BACKDROPS)[number]['id'];

const INK = '#2b1a0e';
const line = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: 'round' as const };

function Cactus({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#5b8c3a" {...line}>
      <path d="M-4 0 L-4 -30 Q0 -35 4 -30 L4 0 Z" />
      <path d="M-4 -14 L-10 -14 Q-13 -14 -13 -18 L-13 -24 Q-10 -27 -8 -24 L-8 -19 L-4 -19" />
      <path d="M4 -10 L10 -10 Q13 -10 13 -14 L13 -22 Q10 -25 8 -22 L8 -15 L4 -15" />
    </g>
  );
}

function Stars({ points }: { points: [number, number][] }) {
  return (
    <g fill="#fff3c4">
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={((x + y) % 3) * 0.3 + 0.6} />
      ))}
    </g>
  );
}

function Scene({ id, color, uid }: { id: BackdropId; color: string; uid: string }) {
  const g = (name: string) => `${uid}-${name}`;
  switch (id) {
    case 'deserto':
      return (
        <>
          <defs>
            <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2a65a" />
              <stop offset="1" stopColor="#fde3a1" />
            </linearGradient>
          </defs>
          <rect width="120" height="156" fill={`url(#${g('sky')})`} />
          <circle cx="88" cy="40" r="14" fill="#ffd36b" stroke="#e8a33d" strokeWidth="1.5" />
          <path d="M-2 104 L6 78 L30 78 L36 104 Z" fill="#c9683f" {...line} />
          <path d="M78 104 L84 86 L100 86 L104 74 L118 74 L124 104 Z" fill="#b5573a" {...line} />
          <rect x="-2" y="104" width="124" height="54" fill="#e9c27d" {...line} />
          <path d="M10 124 Q20 120 30 124 M84 134 Q96 130 108 134" fill="none" stroke="#c99a52" strokeWidth="1.5" strokeLinecap="round" />
          <Cactus x={14} y={118} s={0.9} />
          <Cactus x={104} y={122} s={1.1} />
        </>
      );
    case 'cidade':
      return (
        <>
          <rect width="120" height="156" fill="#a9d4ea" />
          <ellipse cx="22" cy="22" rx="12" ry="5" fill="#fff" opacity="0.9" />
          <ellipse cx="96" cy="16" rx="10" ry="4" fill="#fff" opacity="0.9" />
          {/* fachadas */}
          <g {...line}>
            <rect x="-2" y="52" width="36" height="60" fill="#b5603a" />
            <rect x="2" y="44" width="26" height="10" fill="#b5603a" />
            <rect x="6" y="64" width="10" height="12" fill="#f6d27a" />
            <rect x="18" y="64" width="10" height="12" fill="#f6d27a" />
            <rect x="34" y="62" width="26" height="50" fill="#c9a46a" />
            <rect x="60" y="58" width="28" height="54" fill="#8b6b4a" />
            <rect x="88" y="48" width="34" height="64" fill="#9a4e34" />
            <rect x="92" y="40" width="26" height="10" fill="#9a4e34" />
            <rect x="96" y="62" width="10" height="12" fill="#f6d27a" />
            <rect x="108" y="62" width="10" height="12" fill="#f6d27a" />
            <path d="M-2 82 L34 82 L34 88 L-2 88 Z M88 80 L122 80 L122 86 L88 86 Z" fill="#6b4a2b" />
          </g>
          <g fill="#f4e4c1" stroke={INK} strokeWidth="1">
            <rect x="4" y="46" width="22" height="6" />
            <rect x="94" y="42" width="22" height="6" />
          </g>
          <text x="15" y="50.8" fontSize="4.6" fontWeight="700" textAnchor="middle" fill={INK} fontFamily="Georgia, serif">
            SALOON
          </text>
          <text x="105" y="46.8" fontSize="4.6" fontWeight="700" textAnchor="middle" fill={INK} fontFamily="Georgia, serif">
            XERIFE
          </text>
          <rect x="-2" y="112" width="124" height="46" fill="#d9b27a" {...line} />
          <path d="M8 130 Q18 127 28 130 M86 140 Q98 137 110 140" fill="none" stroke="#b58b52" strokeWidth="1.5" strokeLinecap="round" />
          <g fill="#a2723f" {...line}>
            <rect x="96" y="102" width="20" height="12" rx="2" />
          </g>
        </>
      );
    case 'saloon':
      return (
        <>
          <rect width="120" height="156" fill="#9a6235" />
          <g stroke="#7a4a24" strokeWidth="1.5">
            {[14, 30, 46, 62, 78, 94, 110].map((y) => (
              <line key={y} x1="0" y1={y} x2="120" y2={y} />
            ))}
          </g>
          {/* cartaz e lampião */}
          <g {...line}>
            <rect x="6" y="24" width="24" height="30" fill="#f4e4c1" transform="rotate(-4 18 39)" />
            <rect x="92" y="20" width="22" height="16" rx="2" fill="#6b4a2b" />
          </g>
          <text x="18" y="33" fontSize="4.4" fontWeight="700" textAnchor="middle" fill={INK} fontFamily="Georgia, serif" transform="rotate(-4 18 39)">
            WANTED
          </text>
          <circle cx="18" cy="42" r="5" fill="#c9a46a" stroke={INK} strokeWidth="1" transform="rotate(-4 18 39)" />
          <path d="M100 22 L106 22 L106 34 L100 34 Z" fill="#ffd36b" stroke={INK} strokeWidth="1" />
          <circle cx="103" cy="28" r="9" fill="#ffd36b" opacity="0.25" />
          {/* balcão com garrafas */}
          <g {...line}>
            <rect x="72" y="66" width="4" height="12" rx="1.5" fill="#3d8b3d" />
            <rect x="80" y="62" width="4" height="16" rx="1.5" fill="#8b3d1c" />
            <rect x="88" y="66" width="4" height="12" rx="1.5" fill="#c48a1c" />
            <rect x="-2" y="100" width="124" height="58" fill="#6b3f1d" />
            <rect x="-2" y="78" width="124" height="22" fill="#7a4a24" />
            <rect x="-2" y="76" width="124" height="5" fill="#b5844a" />
          </g>
          <g stroke="#4f2c12" strokeWidth="1.5">
            {[20, 44, 76, 100].map((x) => (
              <line key={x} x1={x} y1="100" x2={x} y2="156" />
            ))}
          </g>
        </>
      );
    case 'mina':
      return (
        <>
          <rect width="120" height="156" fill="#8a6a4f" />
          <g fill="#7a5c43" stroke="#5e4532" strokeWidth="1.5">
            <path d="M0 18 Q12 10 26 20 Q20 30 4 28 Z" />
            <path d="M92 10 Q108 4 120 14 L120 30 Q104 32 96 24 Z" />
            <path d="M6 70 Q18 64 26 74 Q18 82 6 80 Z" />
            <path d="M100 66 Q112 62 120 70 L120 84 Q106 84 100 76 Z" />
          </g>
          {/* entrada da mina */}
          <path d="M26 112 L26 46 Q60 22 94 46 L94 112 Z" fill="#2a1a10" {...line} />
          <g fill="#a2723f" {...line}>
            <rect x="24" y="40" width="8" height="74" />
            <rect x="88" y="40" width="8" height="74" />
            <rect x="18" y="34" width="84" height="9" />
          </g>
          <g fill="#ffd36b" stroke="#b5841c" strokeWidth="1">
            <circle cx="12" cy="44" r="3" />
            <circle cx="108" cy="50" r="2.5" />
            <circle cx="14" cy="96" r="2.5" />
          </g>
          <rect x="-2" y="112" width="124" height="46" fill="#a07a58" {...line} />
          <g stroke="#5e4532" strokeWidth="2" strokeLinecap="round">
            <line x1="44" y1="112" x2="20" y2="158" />
            <line x1="76" y1="112" x2="100" y2="158" />
          </g>
          <g stroke="#6b4a2b" strokeWidth="3">
            {[120, 132, 146].map((y, i) => (
              <line key={y} x1={40 - i * 6} y1={y} x2={80 + i * 6} y2={y} />
            ))}
          </g>
          <g {...line}>
            <rect x="100" y="98" width="6" height="10" rx="1.5" fill="#ffd36b" />
            <path d="M99 98 L107 98 L103 93 Z" fill="#6b4a2b" />
          </g>
        </>
      );
    case 'ferrovia':
      return (
        <>
          <defs>
            <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7fb6d8" />
              <stop offset="1" stopColor="#d7ecf2" />
            </linearGradient>
          </defs>
          <rect width="120" height="156" fill={`url(#${g('sky')})`} />
          <path d="M-2 96 L20 70 L36 86 L58 60 L82 90 L100 74 L122 96 Z" fill="#8fa3b5" {...line} />
          {/* caixa d'água */}
          <g {...line}>
            <line x1="92" y1="70" x2="90" y2="104" />
            <line x1="112" y1="70" x2="114" y2="104" />
            <rect x="88" y="52" width="28" height="20" rx="3" fill="#a2723f" />
            <path d="M86 52 L102 42 L118 52 Z" fill="#6b4a2b" />
          </g>
          <rect x="-2" y="96" width="124" height="62" fill="#c9b07a" {...line} />
          {/* trilho em perspectiva */}
          <g fill="#6b4a2b" {...line}>
            <rect x="34" y="104" width="52" height="4" />
            <rect x="24" y="118" width="72" height="5" />
            <rect x="12" y="134" width="96" height="6" />
            <rect x="-2" y="150" width="124" height="7" />
          </g>
          <g stroke="#7d7d7d" strokeWidth="2.5" strokeLinecap="round">
            <line x1="46" y1="98" x2="22" y2="158" />
            <line x1="74" y1="98" x2="98" y2="158" />
          </g>
          <g fill="#ececec" opacity="0.85">
            <circle cx="16" cy="40" r="6" />
            <circle cx="24" cy="34" r="8" />
            <circle cx="34" cy="28" r="10" />
          </g>
        </>
      );
    case 'canion':
      return (
        <>
          <rect width="120" height="156" fill="#8cc7e6" />
          <path d="M70 26 Q74 22 78 26 Q82 22 86 26" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-2 40 L22 40 L26 60 L38 60 L44 104 L-2 104 Z" fill="#c9683f" {...line} />
          <path d="M122 32 L96 32 L92 52 L82 54 L76 104 L122 104 Z" fill="#b5573a" {...line} />
          <g stroke="#9a4e34" strokeWidth="1.5" fill="none">
            <path d="M0 56 L24 56 M0 76 L40 76 M0 92 L42 92" />
            <path d="M120 48 L94 48 M120 70 L80 70 M120 90 L78 90" />
          </g>
          <path d="M44 104 Q60 96 76 104" fill="#5aa5c9" {...line} />
          <rect x="-2" y="104" width="124" height="54" fill="#d98a52" {...line} />
          <path d="M14 124 Q24 120 34 124 M84 136 Q96 132 108 136" fill="none" stroke="#b5683a" strokeWidth="1.5" strokeLinecap="round" />
          <g fill="#9a8a7a" {...line}>
            <ellipse cx="12" cy="146" rx="9" ry="5" />
            <ellipse cx="110" cy="118" rx="7" ry="4" />
          </g>
        </>
      );
    case 'fogueira':
      return (
        <>
          <rect width="120" height="156" fill="#1f2a4a" />
          <Stars points={[[8, 10], [22, 26], [40, 8], [54, 22], [70, 6], [104, 30], [14, 50], [62, 40], [112, 8], [34, 44], [90, 48]]} />
          <circle cx="94" cy="20" r="10" fill="#f4e4c1" />
          <circle cx="98" cy="17" r="9" fill="#1f2a4a" />
          <path d="M-2 100 L14 84 L28 92 L46 80 L64 94 L84 82 L104 92 L122 84 L122 104 L-2 104 Z" fill="#2c3a5a" {...line} />
          {/* barraca */}
          <path d="M4 112 L22 76 L40 112 Z" fill="#c9a46a" {...line} />
          <path d="M22 76 L22 112 L30 112 Z" fill="#8b6b4a" {...line} />
          <rect x="-2" y="108" width="124" height="50" fill="#4a3424" {...line} />
          {/* fogueira */}
          <ellipse cx="100" cy="122" rx="22" ry="12" fill="#ffb347" opacity="0.18" />
          <g {...line}>
            <path d="M92 126 L108 120 M92 120 L108 126" stroke="#6b4a2b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M100 104 Q108 112 105 120 Q100 124 95 120 Q92 112 100 104 Z" fill="#ff8a2b" />
            <path d="M100 111 Q104 116 102 120 Q100 121 98 120 Q96 116 100 111 Z" fill="#ffd36b" stroke="none" />
          </g>
        </>
      );
    default:
      return (
        <>
          <defs>
            <radialGradient id={g('plain')} cx="50%" cy="38%" r="70%">
              <stop offset="0" stopColor="#fff3d6" />
              <stop offset="1" stopColor={color} />
            </radialGradient>
          </defs>
          <rect width="120" height="156" fill={`url(#${g('plain')})`} />
        </>
      );
  }
}

/** Desenha o cenário cobrindo toda a caixa (corta as sobras em vez de deformar). */
export function Backdrop({ id = 'cor', color }: { id?: string; color: string }) {
  const uid = useId().replace(/:/g, '');
  const known = BACKDROPS.some((b) => b.id === id) ? (id as BackdropId) : 'cor';
  return (
    <svg className="backdrop" viewBox="0 0 120 156" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Scene id={known} color={color} uid={uid} />
    </svg>
  );
}

/** Caixa com o cenário atrás e o boneco (ou o que vier) na frente. */
export function SceneBox({
  backdrop,
  color,
  className,
  style,
  title,
  children,
}: {
  backdrop?: string;
  color: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span className={`scene-box ${className ?? ''}`} style={style} title={title}>
      <Backdrop id={backdrop} color={color} />
      {children}
    </span>
  );
}
