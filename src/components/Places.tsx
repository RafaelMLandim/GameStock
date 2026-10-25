/**
 * Ilustrações dos territórios do mapa, desenhadas em SVG.
 * Cada uma fica centrada em (0, 0), cabe em ~110×70 e "pisa" no chão em y ≈ 26.
 */

const INK = '#2b1a0e';
const WOOD = '#8b5a2b';
const DARK_WOOD = '#5b3a1e';
const CANVAS = '#efe2c0';
const GOLD = '#f2c12e';

const line = { stroke: INK, strokeWidth: 1.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Sign({ x, y, w, text, size = 6 }: { x: number; y: number; w: number; text: string; size?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - size} width={w} height={size + 4} rx="1.5" fill={CANVAS} {...line} strokeWidth={1} />
      <text x={x} y={y + 0.5} textAnchor="middle" fontSize={size} fontWeight="bold" fill={INK} fontFamily="Georgia, serif">
        {text}
      </text>
    </g>
  );
}

function Acampamento() {
  return (
    <g>
      {/* barraca de lona */}
      <polygon points="-50,24 -22,-24 6,24" fill={CANVAS} {...line} />
      <polygon points="-22,-24 -32,24 -12,24" fill="#7b5a36" {...line} />
      <line x1="-22" y1="-24" x2="-22" y2="-34" {...line} />
      <polygon points="-22,-34 -10,-31 -22,-28" fill="#b5442c" {...line} strokeWidth={1} />
      {/* pedras e lenha da fogueira */}
      <rect x="14" y="16" width="26" height="5" rx="2.5" fill={DARK_WOOD} transform="rotate(-14 27 18)" {...line} />
      <rect x="14" y="16" width="26" height="5" rx="2.5" fill={WOOD} transform="rotate(14 27 18)" {...line} />
      {[12, 19, 27, 35, 42].map((x) => (
        <ellipse key={x} cx={x} cy="24" rx="3.6" ry="2.6" fill="#8a8178" {...line} strokeWidth={1} />
      ))}
      {/* chamas */}
      <path d="M 27 18 C 15 8, 22 -4, 24 -14 C 28 -6, 31 -9, 31 -20 C 41 -6, 41 8, 27 18 Z" fill="#e8742c" {...line} />
      <path d="M 27 16 C 21 10, 24 2, 26 -4 C 28 2, 34 6, 27 16 Z" fill={GOLD} />
      {/* tronco para sentar */}
      <rect x="40" y="17" width="16" height="8" rx="3" fill={WOOD} {...line} />
      <ellipse cx="56" cy="21" rx="2.5" ry="4" fill="#c9a46a" {...line} strokeWidth={1} />
    </g>
  );
}

function Cabin({ x, w, h, roof }: { x: number; w: number; h: number; roof: string }) {
  const top = 24 - h;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill="#a0703c" {...line} />
      {Array.from({ length: Math.floor(h / 6) - 1 }, (_, i) => (
        <line key={i} x1={x} x2={x + w} y1={top + 6 * (i + 1)} y2={top + 6 * (i + 1)} stroke="#6b4a2b" strokeWidth="1" />
      ))}
      <polygon points={`${x - 5},${top} ${x + w / 2},${top - w / 2 + 4} ${x + w + 5},${top}`} fill={roof} {...line} />
      <rect x={x + w / 2 - 4} y={24 - 13} width="8" height="13" fill={DARK_WOOD} {...line} strokeWidth={1} />
      <rect x={x + 4} y={top + 5} width="7" height="7" fill="#f7d98b" {...line} strokeWidth={1} />
    </g>
  );
}

function Vila() {
  return (
    <g>
      <rect x="-16" y="-30" width="6" height="14" fill="#8a8178" {...line} />
      <path d="M -13 -32 q -4 -6 2 -10 q 5 -4 2 -10" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" />
      <Cabin x={-46} w={40} h={30} roof="#6b3e1e" />
      <Cabin x={4} w={34} h={24} roof="#7b3a26" />
      {/* cerca */}
      <line x1="40" y1="14" x2="56" y2="14" {...line} />
      <line x1="40" y1="20" x2="56" y2="20" {...line} />
      {[42, 48, 54].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="24" {...line} strokeWidth={2} />
      ))}
    </g>
  );
}

function Estacao() {
  return (
    <g>
      {/* trilhos */}
      <line x1="-58" y1="26" x2="58" y2="26" {...line} strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-56 + i * 10} y="26" width="5" height="3" fill={DARK_WOOD} />
      ))}
      {/* prédio da estação */}
      <rect x="-52" y="-12" width="38" height="36" fill="#c98a4a" {...line} />
      <polygon points="-58,-12 -33,-30 -8,-12" fill="#7b3a26" {...line} />
      <Sign x={-33} y={-3} w={32} text="ESTAÇÃO" size={5.5} />
      <rect x="-38" y="6" width="10" height="18" fill={DARK_WOOD} {...line} strokeWidth={1} />
      <rect x="-49" y="8" width="7" height="7" fill="#f7d98b" {...line} strokeWidth={1} />
      {/* locomotiva a vapor */}
      <circle cx="12" cy="-24" r="5" fill="#ddd" />
      <circle cx="5" cy="-33" r="6.5" fill="#e6e6e6" />
      <circle cx="-4" cy="-42" r="7.5" fill="#eee" />
      <polygon points="3,-16 17,-16 13,1 7,1" fill="#2b2b2b" {...line} />
      <rect x="0" y="0" width="32" height="16" rx="4" fill="#2b2b2b" {...line} />
      <rect x="10" y="-6" width="6" height="7" rx="2" fill={GOLD} {...line} strokeWidth={1} />
      <rect x="30" y="-10" width="20" height="28" fill="#b5442c" {...line} />
      <rect x="27" y="-15" width="26" height="5" fill="#2b2b2b" {...line} />
      <rect x="35" y="-5" width="10" height="8" fill="#f7d98b" {...line} strokeWidth={1} />
      <polygon points="0,9 -10,23 0,23" fill="#b5442c" {...line} />
      <circle cx="-1" cy="5" r="3" fill={GOLD} {...line} strokeWidth={1} />
      {[8, 22].map((x) => (
        <circle key={x} cx={x} cy="20" r="5.5" fill={DARK_WOOD} {...line} />
      ))}
      <circle cx="40" cy="19" r="7" fill={DARK_WOOD} {...line} />
    </g>
  );
}

function Mina() {
  return (
    <g>
      {/* morro rochoso */}
      <path d="M -58 26 L -48 -4 L -36 -18 L -22 -30 L -4 -36 L 12 -31 L 28 -24 L 42 -8 L 52 6 L 58 26 Z" fill="#9a6b45" {...line} />
      <ellipse cx="-38" cy="2" rx="6" ry="3.5" fill="#7a5235" />
      <ellipse cx="34" cy="-8" rx="5" ry="3" fill="#7a5235" />
      <ellipse cx="-6" cy="-28" rx="7" ry="3" fill="#b5875e" />
      {/* boca do túnel com escoramento de madeira */}
      <path d="M -17 26 L -17 0 Q 0 -16 17 0 L 17 26 Z" fill="#1a110a" />
      <rect x="-23" y="-6" width="7" height="32" fill={WOOD} {...line} />
      <rect x="16" y="-6" width="7" height="32" fill={WOOD} {...line} />
      <rect x="-27" y="-13" width="54" height="8" fill={WOOD} {...line} />
      <Sign x={0} y={-19} w={30} text="MINA" size={7} />
      {/* lampião pendurado */}
      <line x1="-12" y1="-5" x2="-12" y2="0" {...line} strokeWidth={1} />
      <rect x="-15" y="0" width="6" height="7" rx="1.5" fill={GOLD} {...line} strokeWidth={1} />
      {/* trilho saindo da mina */}
      <line x1="-7" y1="26" x2="-13" y2="32" {...line} />
      <line x1="7" y1="26" x2="13" y2="32" {...line} />
      {/* carrinho cheio de ouro */}
      <circle cx="31" cy="9" r="4" fill={GOLD} {...line} strokeWidth={1} />
      <circle cx="38" cy="6" r="5" fill={GOLD} {...line} strokeWidth={1} />
      <circle cx="45" cy="8" r="4.5" fill={GOLD} {...line} strokeWidth={1} />
      <circle cx="51" cy="10" r="3" fill={GOLD} {...line} strokeWidth={1} />
      <polygon points="26,11 56,11 51,24 31,24" fill="#707070" {...line} />
      <line x1="28" y1="16" x2="54" y2="16" stroke={INK} strokeWidth="1" />
      <circle cx="35" cy="26" r="3.5" fill="#3a3a3a" {...line} strokeWidth={1} />
      <circle cx="47" cy="26" r="3.5" fill="#3a3a3a" {...line} strokeWidth={1} />
      <path d="M 40 -6 l 1.5 3.5 l 3.5 1.5 l -3.5 1.5 l -1.5 3.5 l -1.5 -3.5 l -3.5 -1.5 l 3.5 -1.5 Z" fill="#fff6c8" />
      {/* picareta encostada */}
      <line x1="-50" y1="25" x2="-38" y2="-2" stroke={WOOD} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M -49 -6 Q -39 -12 -29 -1" fill="none" stroke="#8a8a8a" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

function Desfiladeiro() {
  return (
    <g>
      {/* rio lá no fundo do cânion */}
      <path d="M -14 26 Q 0 18 14 26 Z" fill="#5b8fb9" />
      {/* paredões de rocha vermelha */}
      <polygon points="-58,26 -52,-28 -38,-36 -20,-32 -12,-6 -14,26" fill="#c0643a" {...line} />
      <polygon points="14,26 12,-4 18,-28 32,-36 50,-30 58,26" fill="#b5562f" {...line} />
      {[-18, -4, 10].map((y) => (
        <g key={y} stroke="#8f3f20" strokeWidth="1.5" strokeLinecap="round">
          <line x1={-54 + (y + 18) / 10} y1={y} x2={-16} y2={y + 2} />
          <line x1={16} y1={y + 2} x2={53 + (y + 18) / 8} y2={y} />
        </g>
      ))}
      {/* ponte de corda */}
      <path d="M -20 -32 Q -2 -20 18 -28" fill="none" stroke={WOOD} strokeWidth="2.5" />
      <path d="M -20 -38 Q -2 -27 18 -34" fill="none" stroke={DARK_WOOD} strokeWidth="1" />
      {[-14, -8, -2, 4, 10].map((x) => (
        <line key={x} x1={x} y1={-31 + (x + 20) * 0.22 - Math.abs(x) * 0.05} x2={x} y2={-36 + (x + 20) * 0.22} stroke={DARK_WOOD} strokeWidth="1" />
      ))}
      {/* urubu rondando */}
      <path d="M -6 -50 q 4 -4 8 0 q 4 -4 8 0" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function Forte() {
  const logs = Array.from({ length: 10 }, (_, i) => -40 + i * 8);
  return (
    <g>
      {/* paliçada de troncos pontudos */}
      {logs.map((x, i) => (
        <polygon key={x} points={`${x},24 ${x},-4 ${x + 4},-11 ${x + 8},-4 ${x + 8},24`} fill={i % 2 ? WOOD : '#9a6a3a'} {...line} strokeWidth={1.2} />
      ))}
      {/* torres de vigia */}
      {[-56, 38].map((x) => (
        <g key={x}>
          <rect x={x} y="-22" width="18" height="46" fill="#7b4a24" {...line} />
          <rect x={x - 2} y="-26" width="22" height="5" fill={DARK_WOOD} {...line} />
          <polygon points={`${x - 3},-26 ${x + 9},-38 ${x + 21},-26`} fill={DARK_WOOD} {...line} />
          <rect x={x + 5} y="-17" width="8" height="6" fill="#1a110a" />
        </g>
      ))}
      {/* portão */}
      <rect x="-12" y="2" width="24" height="22" fill={DARK_WOOD} {...line} />
      <line x1="0" y1="2" x2="0" y2="24" stroke={INK} strokeWidth="1" />
      <Sign x={0} y={-2} w={30} text="FORTE" size={6} />
      {/* bandeira */}
      <line x1="0" y1="-8" x2="0" y2="-44" {...line} />
      <polygon points="0,-44 20,-39 0,-33" fill="#b5442c" {...line} strokeWidth={1} />
    </g>
  );
}

function Shop({ x, w, h, front, color, label }: { x: number; w: number; h: number; front: number; color: string; label: string }) {
  const top = 24 - h;
  return (
    <g>
      <rect x={x} y={top - front} width={w} height={h + front} fill={color} {...line} />
      <Sign x={x + w / 2} y={top - front + 9} w={w - 6} text={label} size={5} />
      <rect x={x + w / 2 - 4} y={24 - 13} width="8" height="13" fill={DARK_WOOD} {...line} strokeWidth={1} />
      <rect x={x + 3} y={24 - 18} width="6" height="7" fill="#f7d98b" {...line} strokeWidth={1} />
      <rect x={x + w - 9} y={24 - 18} width="6" height="7" fill="#f7d98b" {...line} strokeWidth={1} />
    </g>
  );
}

function Cidade() {
  return (
    <g>
      <Shop x={-56} w={34} h={30} front={10} color="#c9a46a" label="BANCO" />
      <Shop x={-21} w={36} h={36} front={12} color="#b5603a" label="XERIFE" />
      <path d="M -3 -10 l 1.8 3.8 l 4.2 0.4 l -3.2 2.8 l 1 4 l -3.8 -2.2 l -3.8 2.2 l 1 -4 l -3.2 -2.8 l 4.2 -0.4 Z" fill={GOLD} {...line} strokeWidth={0.8} />
      <Shop x={16} w={40} h={28} front={8} color="#8b6b4a" label="ARMAZÉM" />
      {/* toldo listrado do armazém */}
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points={`${16 + i * 8},4 ${24 + i * 8},4 ${26 + i * 8},10 ${18 + i * 8},10`} fill={i % 2 ? CANVAS : '#b5442c'} {...line} strokeWidth={0.8} />
      ))}
      {/* calçada de tábuas */}
      <rect x="-58" y="23" width="116" height="4" fill="#6b4a2b" {...line} strokeWidth={1} />
    </g>
  );
}

function Saloon() {
  return (
    <g>
      {/* estrela dos campeões */}
      <path d="M 0 -60 l 3.5 7.2 l 8 1.1 l -5.8 5.6 l 1.4 7.9 l -7.1 -3.8 l -7.1 3.8 l 1.4 -7.9 l -5.8 -5.6 l 8 -1.1 Z" fill={GOLD} {...line} />
      {/* fachada falsa alta */}
      <polygon points="-40,-22 -40,-36 -12,-36 0,-44 12,-36 40,-36 40,-22" fill="#8b3a1e" {...line} />
      <Sign x={0} y={-27} w={56} text="SALOON" size={9} />
      <rect x="-50" y="-22" width="100" height="46" fill="#a0522d" {...line} />
      {/* janelas de cima e sacada */}
      {[-38, -16, 8, 30].map((x) => (
        <rect key={x} x={x} y="-18" width="8" height="9" fill="#f7d98b" {...line} strokeWidth={1} />
      ))}
      <rect x="-54" y="-6" width="108" height="4" fill={DARK_WOOD} {...line} />
      {Array.from({ length: 13 }, (_, i) => (
        <line key={i} x1={-50 + i * 8.3} y1="-12" x2={-50 + i * 8.3} y2="-6" stroke={DARK_WOOD} strokeWidth="1.2" />
      ))}
      <line x1="-54" y1="-12" x2="54" y2="-12" stroke={DARK_WOOD} strokeWidth="1.5" />
      {/* porta vaivém */}
      <rect x="-11" y="2" width="22" height="22" fill="#1a110a" {...line} />
      <path d="M -10 7 h 9 v 10 h -9 Z M 1 7 h 9 v 10 h -9 Z" fill="#c9971c" {...line} strokeWidth={1} />
      <rect x="-40" y="5" width="14" height="11" fill="#f7d98b" {...line} strokeWidth={1} />
      <rect x="26" y="5" width="14" height="11" fill="#f7d98b" {...line} strokeWidth={1} />
      {/* barris na porta */}
      <rect x="-56" y="12" width="9" height="12" rx="2" fill={WOOD} {...line} strokeWidth={1} />
      <rect x="47" y="12" width="9" height="12" rx="2" fill={WOOD} {...line} strokeWidth={1} />
    </g>
  );
}

const PLACES = [Acampamento, Vila, Estacao, Mina, Desfiladeiro, Forte, Cidade, Saloon];

export default function Place({ id }: { id: number }) {
  const Drawing = PLACES[id] ?? Acampamento;
  return (
    <g>
      <ellipse cx="0" cy="27" rx="60" ry="9" fill="rgba(110,70,30,0.2)" />
      <Drawing />
    </g>
  );
}

/** Mesa (morro de topo chato) típico do deserto. */
export function Mesa({ x, y, w = 110, h = 50 }: { x: number; y: number; w?: number; h?: number }) {
  const top = w * 0.55;
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon
        points={`${-w / 2},${h} ${-top / 2 - 6},${h * 0.25} ${-top / 2},0 ${top / 2},0 ${top / 2 + 8},${h * 0.3} ${w / 2},${h}`}
        fill="#c98a5a"
        stroke="#9a5a33"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1={-top / 2 - 2} y1={h * 0.3} x2={top / 2 + 4} y2={h * 0.32} stroke="#a8643a" strokeWidth="2" strokeLinecap="round" />
      <line x1={-w * 0.36} y1={h * 0.62} x2={w * 0.38} y2={h * 0.6} stroke="#a8643a" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** Cacto saguaro. */
export function Cactus({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#5b8a3a" stroke="#355a22" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="-4" y="-30" width="8" height="30" rx="4" />
      <path d="M -4 -12 h -6 a 3 3 0 0 1 -3 -3 v -9 a 3 3 0 0 1 6 0 v 6 h 3" />
      <path d="M 4 -16 h 5 a 3 3 0 0 0 3 -3 v -7 a 3 3 0 0 0 -6 0 v 4 h -2" />
    </g>
  );
}
