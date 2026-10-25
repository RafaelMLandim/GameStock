import { useId } from 'react';
import type { AvatarLook } from '../types';

/** Escurece uma cor hex (#rrggbb) para sombras e contornos. */
function shade(hex: string, amount = 0.25): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
}

const INK = '#2b1a0e';

function BackHair({ look }: { look: AvatarLook }) {
  const c = look.hairColor;
  switch (look.hairStyle) {
    case 'longo':
      return <path d="M34 50 Q32 22 60 22 Q88 22 86 50 L90 94 Q60 102 30 94 Z" fill={c} stroke={shade(c)} strokeWidth="1.5" />;
    case 'rabo':
      return <path d="M80 40 Q100 46 96 70 Q94 86 86 96 Q88 76 82 60 Z" fill={c} stroke={shade(c)} strokeWidth="1.5" />;
    case 'trancas':
      return (
        <g fill={c} stroke={shade(c)} strokeWidth="1.5">
          {[62, 72, 82, 92].map((y) => (
            <g key={y}>
              <ellipse cx="35" cy={y} rx="6" ry="6" />
              <ellipse cx="85" cy={y} rx="6" ry="6" />
            </g>
          ))}
          <circle cx="35" cy="99" r="3" fill={look.accentColor} />
          <circle cx="85" cy="99" r="3" fill={look.accentColor} />
        </g>
      );
    case 'cacheado':
      return (
        <g fill={c} stroke={shade(c)} strokeWidth="1.5">
          {[
            [36, 40],
            [32, 54],
            [36, 68],
            [84, 40],
            [88, 54],
            [84, 68],
            [44, 28],
            [60, 22],
            [76, 28],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="11" />
          ))}
        </g>
      );
    case 'chanel':
      return <path d="M33 50 Q31 21 60 21 Q89 21 87 50 L89 76 Q81 80 75 74 L45 74 Q39 80 31 76 Z" fill={c} stroke={shade(c)} strokeWidth="1.5" />;
    case 'ondulado':
      return (
        <path
          d="M34 50 Q30 21 60 21 Q90 21 86 50 Q93 61 86 71 Q93 82 85 94 Q60 101 35 94 Q27 82 34 71 Q27 61 34 50Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="1.5"
        />
      );
    case 'mullet':
      return <path d="M36 46 Q33 70 38 86 Q60 92 82 86 Q87 70 84 46 Z" fill={c} stroke={shade(c)} strokeWidth="1.5" />;
    case 'blackpower':
      return <circle cx="60" cy="42" r="37" fill={c} stroke={shade(c)} strokeWidth="1.5" />;
    case 'chiquinha':
      return (
        <g stroke={shade(c)} strokeWidth="1.5">
          <ellipse cx="28" cy="50" rx="9" ry="14" fill={c} transform="rotate(20 28 50)" />
          <ellipse cx="92" cy="50" rx="9" ry="14" fill={c} transform="rotate(-20 92 50)" />
          <circle cx="35" cy="40" r="3.5" fill={look.accentColor} />
          <circle cx="85" cy="40" r="3.5" fill={look.accentColor} />
        </g>
      );
    default:
      return null;
  }
}

function FrontHair({ look }: { look: AvatarLook }) {
  const c = look.hairColor;
  const stroke = shade(c);
  switch (look.hairStyle) {
    case 'careca':
      return <ellipse cx="52" cy="34" rx="7" ry="3" fill="#fff" opacity="0.35" />;
    case 'cacheado':
      return (
        <g fill={c} stroke={stroke} strokeWidth="1.5">
          {[42, 51, 60, 69, 78].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 31 : 34} r="7" />
          ))}
        </g>
      );
    case 'trancas':
    case 'chiquinha':
      return <path d="M36 50 Q35 24 60 24 Q85 24 84 50 Q80 34 61 31 L60 36 L59 31 Q40 34 36 50Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
    case 'coque':
      return (
        <g fill={c} stroke={stroke} strokeWidth="1.5">
          <circle cx="60" cy="20" r="10" />
          <path d="M36 48 Q35 24 60 24 Q85 24 84 48 Q80 33 60 31 Q40 33 36 48Z" />
          <path d="M52 22 Q60 26 68 22" fill="none" />
        </g>
      );
    case 'moicano':
      return (
        <g>
          <path d="M37 46 Q36 27 60 27 Q84 27 83 46 Q72 38 60 38 Q48 38 37 46Z" fill={c} opacity="0.3" />
          <path d="M53 34 Q52 12 60 3 Q68 12 67 34 Q60 37 53 34Z" fill={c} stroke={stroke} strokeWidth="1.5" />
        </g>
      );
    case 'chanel':
      return <path d="M35 46 Q34 24 60 24 Q86 24 85 46 L85 47 Q60 40 35 47Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
    case 'blackpower':
      return <path d="M36 47 Q36 28 60 28 Q84 28 84 47 Q76 36 60 36 Q44 36 36 47Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
    case 'topete':
      return <path d="M36 47 Q31 22 50 15 Q72 7 86 24 Q87 36 84 47 Q79 33 67 33 Q57 38 46 34 Q40 38 36 47Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
    case 'raspado':
      return <path d="M36 46 Q35 25 60 25 Q85 25 84 46 Q72 37 60 37 Q48 37 36 46Z" fill={c} opacity="0.55" />;
    case 'repartido':
      return (
        <g>
          <path d="M36 48 Q33 23 60 23 Q87 23 84 48 Q81 35 72 32 Q56 30 46 38 Q40 41 36 48Z" fill={c} stroke={stroke} strokeWidth="1.5" />
          <path d="M70 25 Q67 29 66 33" fill="none" stroke={shade(c, 0.45)} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'ondulado':
      return (
        <path
          d="M35 52 Q33 23 60 23 Q87 23 85 52 Q82 40 76 37 Q70 42 64 36 Q57 43 50 37 Q43 42 40 40 Q37 45 35 52Z"
          fill={c}
          stroke={stroke}
          strokeWidth="1.5"
        />
      );
    case 'longo':
      return <path d="M35 52 Q33 24 60 24 Q87 24 85 52 Q80 36 70 34 Q58 44 40 38 Q37 44 35 52Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
    case 'rabo':
      return <path d="M36 48 Q35 24 60 24 Q85 24 84 48 Q80 34 60 32 Q40 34 36 48Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
    default:
      return <path d="M36 48 Q34 24 60 24 Q86 24 84 48 Q79 36 68 36 Q60 41 50 36 Q40 37 36 48Z" fill={c} stroke={stroke} strokeWidth="1.5" />;
  }
}

function Eyes({ look }: { look: AvatarLook }) {
  const female = look.makeup.includes('cilios');
  const shadow = look.makeup.includes('sombra');
  const liner = look.makeup.includes('delineado');
  const open = (x: number) => (
    <g key={x}>
      <ellipse cx={x} cy="53" rx="3" ry="3.8" fill={INK} />
      <circle cx={x + 1} cy="51.6" r="1.1" fill="#fff" />
      {female && (
        <path
          d={x < 60 ? `M${x - 2.5} 50.2 l-2.6 -1.6 M${x - 3} 52 l-2.8 -0.6` : `M${x + 2.5} 50.2 l2.6 -1.6 M${x + 3} 52 l2.8 -0.6`}
          stroke={INK}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      )}
    </g>
  );
  const closed = (x: number) => <path key={x} d={`M${x - 4} 54 Q${x} 49 ${x + 4} 54`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />;
  const angry = look.eyes === 'raivoso';
  const brows = (
    <g stroke={shade(look.hairColor, look.hairStyle === 'careca' ? 0 : 0.1)} strokeWidth={angry ? 3 : 2} strokeLinecap="round">
      {angry ? (
        <>
          <path d="M45 43 L56 48" />
          <path d="M64 48 L75 43" />
        </>
      ) : (
        <>
          <path d="M46 46 L55 45" />
          <path d="M65 45 L74 46" />
        </>
      )}
    </g>
  );
  // Olhos semicerrados: a pálpebra corta a parte de cima do olho.
  const glare = (x: number) => (
    <g key={x}>
      <ellipse cx={x} cy="53.5" rx="3" ry="3.2" fill={INK} />
      <path d={x < 60 ? `M${x - 4} 49.5 L${x + 4} 52` : `M${x - 4} 52 L${x + 4} 49.5`} stroke={look.skin} strokeWidth="2.6" />
    </g>
  );
  return (
    <g>
      {shadow && (
        <g fill="#9b6bb5" opacity="0.5">
          <ellipse cx="51" cy="50" rx="4.6" ry="2.6" />
          <ellipse cx="69" cy="50" rx="4.6" ry="2.6" />
        </g>
      )}
      {look.eyes === 'feliz'
        ? [closed(51), closed(69)]
        : look.eyes === 'piscando'
          ? [open(51), closed(69)]
          : angry
            ? [glare(51), glare(69)]
            : [open(51), open(69)]}
      {liner && look.eyes !== 'feliz' && (
        <g fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round">
          <path d="M47.6 51 Q51 48.4 54.4 50.6 L56.2 49.3" />
          {look.eyes !== 'piscando' && <path d="M72.4 51 Q69 48.4 65.6 50.6 L63.8 49.3" />}
        </g>
      )}
      {brows}
    </g>
  );
}

function Mouth({ look }: { look: AvatarLook }) {
  const lips = look.makeup.includes('batom') ? '#b3263e' : INK;
  const width = look.makeup.includes('batom') ? 2.6 : 2;
  switch (look.mouth) {
    case 'normal':
      return <path d="M55 65.5 Q60 66.5 65 65.5" fill="none" stroke={lips} strokeWidth={width} strokeLinecap="round" />;
    case 'dentes':
      return (
        <g stroke={lips} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M53 63 Q60 72.5 67 63 Z" fill="#7a2a22" />
          <path d="M54 63.4 L66 63.4 Q65.4 65.6 60 65.8 Q54.6 65.6 54 63.4 Z" fill="#fff" strokeWidth="0.8" />
        </g>
      );
    case 'bravo':
      return <path d="M54 67 Q60 62 66 67" fill="none" stroke={lips} strokeWidth="2.2" strokeLinecap="round" />;
    default:
      return <path d="M54 64 Q60 69 66 64" fill="none" stroke={lips} strokeWidth={width} strokeLinecap="round" />;
  }
}

function FacialHairLayer({ look }: { look: AvatarLook }) {
  const c = look.hairColor;
  const mustache = <path d="M50 61 Q55 57 60 60 Q65 57 70 61 Q65 64 60 62 Q55 64 50 61Z" fill={c} stroke={shade(c)} strokeWidth="1" />;
  switch (look.facialHair) {
    case 'bigode':
      return mustache;
    case 'barba':
      return (
        <g>
          <path d="M37 52 Q38 78 60 78 Q82 78 83 52 Q80 64 72 65 Q66 70 60 70 Q54 70 48 65 Q40 64 37 52Z" fill={c} stroke={shade(c)} strokeWidth="1.2" />
          {mustache}
        </g>
      );
    case 'cavanhaque':
      return (
        <g>
          <path d="M55 68 Q60 76 65 68 Q60 70 55 68Z" fill={c} stroke={shade(c)} strokeWidth="1" />
          {mustache}
        </g>
      );
    case 'bigodao':
      return (
        <path
          d="M46 59 Q48 63 53 61 Q57 58 60 60 Q63 58 67 61 Q72 63 74 59 Q74 65 68 64 Q63 63.5 60 62.4 Q57 63.5 52 64 Q46 65 46 59Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="1"
        />
      );
    case 'ferradura':
      return (
        <path
          d="M50 61 Q55 57 60 60 Q65 57 70 61 L71 73 L67.5 73 L67 64 Q60 62.6 53 64 L52.5 73 L49 73Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="1"
        />
      );
    case 'costeletas':
      return (
        <g fill={c} stroke={shade(c)} strokeWidth="1">
          <path d="M36 44 L41.5 44 L41.5 58 Q39 61 36 58Z" />
          <path d="M84 44 L78.5 44 L78.5 58 Q81 61 84 58Z" />
        </g>
      );
    case 'rala':
      return <path d="M37 52 Q38 78 60 78 Q82 78 83 52 Q80 64 72 65 Q66 70 60 70 Q54 70 48 65 Q40 64 37 52Z" fill={c} opacity="0.3" />;
    case 'barbaLonga':
      return (
        <g>
          <path d="M37 52 Q37 92 60 98 Q83 92 83 52 Q80 64 72 65 Q66 70 60 70 Q54 70 48 65 Q40 64 37 52Z" fill={c} stroke={shade(c)} strokeWidth="1.2" />
          {mustache}
        </g>
      );
    default:
      return null;
  }
}

/**
 * Altura da aba de cada chapéu. Com chapéu, o cabelo acima dessa linha fica escondido
 * (está por baixo dele): assim moicano, coque e black power não furam o chapéu.
 */
const HAT_BRIM: Record<string, number> = {
  cowboy: 29,
  xerife: 27,
  coco: 29,
  ferroviario: 34,
  sombrero: 26,
  cartola: 30,
  palha: 27,
  boina: 33,
  capacete: 36,
  lenco: 33,
  gaucho: 31,
};

function Hat({ look }: { look: AvatarLook }) {
  const c = look.hatColor;
  const s = shade(c);
  switch (look.hat) {
    case 'cowboy':
    case 'xerife': {
      const wide = look.hat === 'xerife' ? 6 : 0;
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d={`M40 33 Q38 8 50 10 Q60 16 70 10 Q82 8 80 33 Z`} fill={c} />
          <path d="M40 28 Q60 34 80 28 L80 33 Q60 38 40 33Z" fill={shade(c, 0.45)} />
          <path d={`M${22 - wide} ${30 - wide / 2} Q30 40 60 40 Q90 40 ${98 + wide} ${30 - wide / 2} Q90 34 80 32 Q60 37 40 32 Q30 34 ${22 - wide} ${30 - wide / 2}Z`} fill={c} />
          {look.hat === 'xerife' && <polygon points={starPoints(60, 21, 6, 2.6)} fill="#e3b65c" stroke="#9a6b10" strokeWidth="1" />}
        </g>
      );
    }
    case 'coco':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M40 33 Q40 8 60 8 Q80 8 80 33 Z" fill={c} />
          <rect x="40" y="27" width="40" height="5" fill={look.accentColor} />
          <ellipse cx="60" cy="33" rx="28" ry="4.5" fill={c} />
        </g>
      );
    case 'ferroviario':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M37 36 Q37 14 60 14 Q83 14 83 36 Z" fill={c} />
          <g stroke="#fff" strokeWidth="1.5" opacity="0.7">
            <path d="M46 17 L46 36" />
            <path d="M54 15 L54 36" />
            <path d="M62 15 L62 36" />
            <path d="M70 16 L70 36" />
            <path d="M78 20 L78 36" />
          </g>
          <path d="M36 36 Q60 32 84 36 L88 41 Q60 36 32 41Z" fill={shade(c, 0.4)} />
        </g>
      );
    case 'sombrero':
      return (
        <g stroke={s} strokeWidth="1.5">
          <ellipse cx="60" cy="34" rx="46" ry="9" fill={c} />
          <path d="M44 34 Q42 6 60 6 Q78 6 76 34 Z" fill={c} />
          <path d="M44 28 Q60 32 76 28 L76 33 Q60 37 44 33Z" fill={look.accentColor} />
          <ellipse cx="60" cy="34" rx="40" ry="6" fill="none" stroke={look.accentColor} strokeWidth="2" />
        </g>
      );
    case 'cartola':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M43 34 L45 4 Q60 1 75 4 L77 34 Z" fill={c} />
          <ellipse cx="60" cy="4" rx="15" ry="2.5" fill={shade(c, 0.15)} />
          <path d="M43.6 25 L76.4 25 L76.8 31 L43.2 31Z" fill={look.accentColor} />
          <ellipse cx="60" cy="34" rx="28" ry="5" fill={c} />
        </g>
      );
    case 'palha':
      return (
        <g stroke={s} strokeWidth="1.3">
          <ellipse cx="60" cy="34" rx="42" ry="8" fill={c} />
          <path d="M42 34 Q40 12 60 12 Q80 12 78 34 Z" fill={c} />
          <g stroke={shade(c, 0.35)} strokeWidth="0.8" opacity="0.7" fill="none">
            {[18, 23, 28].map((yy) => (
              <path key={yy} d={`M${44 - (yy - 18) / 5} ${yy} Q60 ${yy + 3} ${76 + (yy - 18) / 5} ${yy}`} />
            ))}
            <ellipse cx="60" cy="34" rx="34" ry="5.5" />
            <ellipse cx="60" cy="34" rx="26" ry="4" />
          </g>
          <path d="M42.6 27 Q60 32 77.4 27 L77.8 32 Q60 37 42.2 32Z" fill={look.accentColor} />
        </g>
      );
    case 'boina':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M34 38 Q28 20 52 16 Q82 13 88 30 Q86 38 72 38 Q52 41 34 38Z" fill={c} />
          <path d="M36 38 Q60 34 84 36" fill="none" stroke={shade(c, 0.4)} strokeWidth="2.5" />
          <circle cx="60" cy="15" r="2.5" fill={shade(c, 0.2)} />
        </g>
      );
    case 'capacete':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M36 38 Q36 11 60 11 Q84 11 84 38 Z" fill={c} />
          <path d="M60 11 L60 38" stroke={shade(c, 0.3)} strokeWidth="3" />
          <path d="M31 38 L89 38 L87 43 L33 43Z" fill={shade(c, 0.2)} />
          <rect x="53" y="17" width="14" height="11" rx="3" fill="#8a8a8a" stroke="#4a4a4a" />
          <circle cx="60" cy="22.5" r="4" fill="#fff6b0" stroke="#c9971c" />
          <circle cx="60" cy="22.5" r="8" fill="#fff6b0" opacity="0.35" stroke="none" />
        </g>
      );
    case 'lenco':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M84 36 L96 30 L93 42Z M84 38 L94 46 L86 48Z" fill={c} />
          <path d="M35 44 Q33 21 60 21 Q87 21 85 44 Q60 36 35 44Z" fill={c} />
          <g fill="#fff" stroke="none" opacity="0.8">
            {[
              [46, 30],
              [56, 26],
              [66, 28],
              [76, 32],
              [52, 36],
              [70, 37],
              [40, 38],
            ].map(([x, yy]) => (
              <circle key={`${x}-${yy}`} cx={x} cy={yy} r="1.4" />
            ))}
          </g>
          <circle cx="85" cy="40" r="3" fill={shade(c, 0.15)} />
        </g>
      );
    case 'gaucho':
      return (
        <g stroke={s} strokeWidth="1.5">
          <path d="M38 36 Q40 72 60 75 Q80 72 82 36" fill="none" stroke={shade(c, 0.4)} strokeWidth="1.2" />
          <path d="M44 32 L46 13 L74 13 L76 32 Z" fill={c} />
          <path d="M44.6 26 L75.4 26 L75.8 31 L44.2 31Z" fill={look.accentColor} />
          <path d="M22 31 Q60 29 98 31 L98 35 Q60 34 22 35Z" fill={c} />
        </g>
      );
    default:
      return null;
  }
}

/**
 * Braço direito esticado com o revólver (duelo). Começa mirando à frente e, depois do
 * tiro, sobe comemorando (animação no CSS). O clarão sai da ponta do cano.
 */
function GunArm({ look }: { look: AvatarLook }) {
  const sleeve = look.topColor;
  return (
    <g className="gun-arm">
      <line x1="79" y1="88" x2="101" y2="88" stroke={shade(sleeve)} strokeWidth="11" strokeLinecap="round" />
      <line x1="79" y1="88" x2="101" y2="88" stroke={sleeve} strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(104 86)">
        <path d="M-3 1 L2 1 L4 10 Q0 11 -3 9Z" fill="#6b3e1e" stroke={INK} strokeWidth="1" />
        <rect x="-4" y="-4" width="10" height="6" rx="1.5" fill="#4a4a4a" stroke={INK} strokeWidth="1" />
        <circle cx="2" cy="-1" r="3" fill="#7d7d7d" stroke={INK} strokeWidth="1" />
        <rect x="5" y="-3.5" width="15" height="3.2" rx="1" fill="#9a9a9a" stroke={INK} strokeWidth="1" />
        <polygon className="muzzle-flash" points={starPoints(24, -2, 7, 3)} fill="#ffd36b" stroke="#ff8a2b" strokeWidth="1.2" />
      </g>
      <circle cx="102" cy="88" r="5" fill={look.skin} stroke={shade(look.skin)} strokeWidth="1.2" />
    </g>
  );
}

function Body({ look, aiming }: { look: AvatarLook; aiming?: boolean }) {
  const top = look.topColor;
  const topStroke = shade(top);
  const accent = look.accentColor;
  const dress = look.top === 'vestido' || look.top === 'saia';
  const coat = look.top === 'casaco';
  const poncho = look.top === 'poncho';
  const fringe = look.top === 'franjas';
  const overall = look.top === 'macacao';
  // Cada boneco precisa de um id próprio para o padrão xadrez (vários na mesma página).
  const plaidId = `xadrez${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const shirtFill = look.top === 'xadrez' ? `url(#${plaidId})` : top;

  const arms = (fill: string) => (
    <g fill={fill} stroke={topStroke} strokeWidth="1.5">
      <path d="M42 84 Q34 86 32 96 L30 112 L39 113 L42 98Z" />
      {!aiming && <path d="M78 84 Q86 86 88 96 L90 112 L81 113 L78 98Z" />}
    </g>
  );
  const hands = (
    <g fill={look.skin} stroke={shade(look.skin)} strokeWidth="1.2">
      <circle cx="34.5" cy="115" r="5" />
      {!aiming && <circle cx="85.5" cy="115" r="5" />}
    </g>
  );

  return (
    <g>
      {look.top === 'xadrez' && (
        <defs>
          <pattern id={plaidId} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={top} />
            <rect width="10" height="3" y="3.5" fill={accent} opacity="0.55" />
            <rect width="3" height="10" x="3.5" fill={accent} opacity="0.55" />
            <rect width="10" height="0.8" y="8" fill={shade(top, 0.5)} opacity="0.6" />
          </pattern>
        </defs>
      )}
      {/* pernas e botas */}
      {!dress && (
        <g fill={look.pantsColor} stroke={shade(look.pantsColor)} strokeWidth="1.5">
          <path d="M44 112 L59 112 L58 142 L46 142Z" />
          <path d="M61 112 L76 112 L74 142 L62 142Z" />
        </g>
      )}
      <g fill={look.bootsColor} stroke={shade(look.bootsColor, 0.4)} strokeWidth="1.5">
        <path d="M45 138 L58 138 L58 151 L40 151 Q40 146 45 145Z" />
        <path d="M62 138 L75 138 L75 145 Q80 146 80 151 L62 151Z" />
      </g>

      {/* casaco longo por trás */}
      {coat && <path d="M40 84 L36 140 L84 140 L80 84Z" fill={top} stroke={topStroke} strokeWidth="1.5" />}

      {/* braços */}
      {!poncho && arms(shirtFill)}
      {fringe && (
        <g stroke={top} strokeWidth="1.6" strokeLinecap="round">
          {[0, 3, 6, 9, 12].map((d) => (
            <g key={d}>
              <path d={`M${31 - d * 0.1} ${88 + d * 1.8} l-4 1.5`} />
              <path d={`M${89 + d * 0.1} ${88 + d * 1.8} l4 1.5`} />
            </g>
          ))}
        </g>
      )}
      {hands}

      {/* tronco */}
      <path
        d="M42 82 Q60 76 78 82 L80 114 L40 114 Z"
        fill={coat || fringe ? accent : shirtFill}
        stroke={coat || fringe ? shade(accent) : topStroke}
        strokeWidth="1.5"
      />
      {!dress && !poncho && !overall && (
        <g>
          <rect x="40" y="108" width="40" height="6" fill="#3b220f" />
          <rect x="56" y="107" width="8" height="8" rx="1.5" fill="#e3b65c" stroke="#9a6b10" />
        </g>
      )}

      {look.top === 'colete' && (
        <g fill={accent} stroke={shade(accent)} strokeWidth="1.5">
          <path d="M42 82 L55 80 L56 108 L40 108Z" />
          <path d="M78 82 L65 80 L64 108 L80 108Z" />
          <circle cx="58" cy="94" r="1.2" fill="#e3b65c" />
        </g>
      )}
      {coat && (
        <g fill={top} stroke={topStroke} strokeWidth="1.5">
          <path d="M42 82 L56 81 L56 140 L36 140Z" />
          <path d="M78 82 L64 81 L64 140 L84 140Z" />
        </g>
      )}
      {look.top === 'suspensorio' && (
        <g stroke={shade(accent, 0.1)} strokeWidth="4" strokeLinecap="round">
          <path d="M47 81 L51 108" />
          <path d="M73 81 L69 108" />
          <circle cx="51" cy="106" r="1" fill="#e3b65c" stroke="none" />
          <circle cx="69" cy="106" r="1" fill="#e3b65c" stroke="none" />
        </g>
      )}
      {fringe && (
        <g>
          <g fill={top} stroke={topStroke} strokeWidth="1.5">
            <path d="M42 82 L54 80 L52 116 L40 116Z" />
            <path d="M78 82 L66 80 L68 116 L80 116Z" />
          </g>
          <g stroke={top} strokeWidth="1.6" strokeLinecap="round">
            {[41, 44, 47, 50, 70, 73, 76, 79].map((x) => (
              <path key={x} d={`M${x} 116 l0 6`} />
            ))}
          </g>
          <path d="M42 92 Q48 95 53 92 M78 92 Q72 95 67 92" fill="none" stroke={shade(top, 0.4)} strokeWidth="1.2" />
        </g>
      )}
      {look.top === 'avental' && (
        <g>
          <path d="M51 79 Q60 74 69 79" fill="none" stroke={shade(accent, 0.15)} strokeWidth="2" />
          <path d="M50 86 L70 86 L70 100 L78 104 L78 136 L42 136 L42 104 L50 100 Z" fill={accent} stroke={shade(accent)} strokeWidth="1.5" />
          <path d="M42 104 L36 102 M78 104 L84 102" stroke={shade(accent, 0.15)} strokeWidth="2" />
          <rect x="52" y="112" width="16" height="10" rx="2" fill="none" stroke={shade(accent)} strokeWidth="1.5" />
        </g>
      )}
      {overall && (
        <g fill={look.pantsColor} stroke={shade(look.pantsColor)} strokeWidth="1.5">
          <path d="M47 90 L73 90 L76 116 L44 116 Z" />
          <path d="M47 92 L45 80 L49 80 L51 90Z" />
          <path d="M73 92 L75 80 L71 80 L69 90Z" />
          <circle cx="49" cy="92" r="1.8" fill="#e3b65c" stroke="#9a6b10" strokeWidth="0.8" />
          <circle cx="71" cy="92" r="1.8" fill="#e3b65c" stroke="#9a6b10" strokeWidth="0.8" />
          <rect x="54" y="96" width="12" height="8" rx="1.5" fill="none" />
        </g>
      )}
      {look.top === 'saia' && (
        <g>
          <path d="M42 106 L78 106 L88 138 L32 138 Z" fill={look.pantsColor} stroke={shade(look.pantsColor)} strokeWidth="1.5" />
          <g stroke={shade(look.pantsColor, 0.3)} strokeWidth="1" opacity="0.7">
            <path d="M50 108 L45 137" />
            <path d="M60 108 L60 137" />
            <path d="M70 108 L75 137" />
          </g>
          <rect x="41" y="104" width="38" height="4" fill="#3b220f" />
          <path d="M53 81 Q60 88 67 81" fill="none" stroke={accent} strokeWidth="2.5" />
        </g>
      )}
      {look.top === 'vestido' && (
        <g>
          <path d="M42 106 L78 106 L90 140 L30 140 Z" fill={top} stroke={topStroke} strokeWidth="1.5" />
          <path d="M31 136 Q36 141 41 136 Q46 141 51 136 Q56 141 61 136 Q66 141 71 136 Q76 141 81 136 Q86 141 89 136 L90 140 L30 140Z" fill={accent} />
          <rect x="41" y="104" width="38" height="4" fill={accent} />
        </g>
      )}
      {poncho && (
        <g>
          <path d="M34 84 Q60 74 86 84 L92 116 L60 124 L28 116 Z" fill={top} stroke={topStroke} strokeWidth="1.5" />
          <path d="M31 104 L60 111 L89 104" fill="none" stroke={accent} strokeWidth="3" />
          <path d="M30 110 L60 117 L90 110" fill="none" stroke="#e8e0cc" strokeWidth="2" />
          <g stroke={top} strokeWidth="2">
            {[34, 44, 54, 66, 76, 86].map((x) => (
              <path key={x} d={`M${x} ${x < 60 ? 117 + (x - 28) / 4 : 117 + (92 - x) / 4} l0 5`} />
            ))}
          </g>
        </g>
      )}
    </g>
  );
}

function Accessories({ look, front }: { look: AvatarLook; front: boolean }) {
  const has = (a: string) => look.accessories.includes(a as never);
  if (!front) {
    return has('coldre') ? (
      <g>
        <path d="M78 110 L86 110 L88 128 L80 130Z" fill="#6b3e1e" stroke="#3b220f" strokeWidth="1.5" />
        <path d="M80 106 L88 105 L88 112 L81 112Z" fill="#555" stroke="#222" strokeWidth="1" />
      </g>
    ) : null;
  }
  return (
    <g>
      {has('bandana') && (
        <g fill={look.accentColor} stroke={shade(look.accentColor)} strokeWidth="1.5">
          <path d="M47 76 Q60 82 73 76 L60 94Z" />
          <circle cx="60" cy="78" r="2.5" />
        </g>
      )}
      {has('gravata') && (
        <g fill="#b5442c" stroke="#7a2a1a" strokeWidth="1.2">
          <path d="M60 81 L51 76 L51 86Z" />
          <path d="M60 81 L69 76 L69 86Z" />
          <circle cx="60" cy="81" r="2.2" />
        </g>
      )}
      {has('estrela') && <polygon points={starPoints(70, 92, 6.5, 2.8)} fill="#e3b65c" stroke="#9a6b10" strokeWidth="1.2" />}
      {has('oculos') && (
        <g fill="rgba(255,255,255,0.25)" stroke={INK} strokeWidth="1.8">
          <circle cx="51" cy="53" r="6" />
          <circle cx="69" cy="53" r="6" />
          <path d="M57 53 L63 53" />
        </g>
      )}
      {has('laco') && look.hat === 'nenhum' && (
        <g fill="#e05a8a" stroke="#a83a5e" strokeWidth="1.2">
          <path d="M76 28 L68 22 L68 34Z" />
          <path d="M76 28 L84 22 L84 34Z" />
          <circle cx="76" cy="28" r="2.5" />
        </g>
      )}
      {has('flor') && look.hat === 'nenhum' && (
        <g>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx="43" cy="27" rx="3.2" ry="5" fill="#f0f0f0" stroke="#c9c9c9" strokeWidth="0.8" transform={`rotate(${deg} 43 31)`} />
          ))}
          <circle cx="43" cy="31" r="2.6" fill="#e3b65c" />
        </g>
      )}
      {has('sardas') && (
        <g fill={shade(look.skin, 0.35)}>
          {[
            [43, 59],
            [46, 62],
            [42, 63],
            [77, 59],
            [74, 62],
            [78, 63],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" />
          ))}
        </g>
      )}
      {has('tapaolho') && (
        <g>
          <path d="M47 28 L66 49 M73 52 L85 51" stroke={INK} strokeWidth="1.6" fill="none" />
          <ellipse cx="69" cy="53" rx="5.5" ry="5" fill={INK} />
        </g>
      )}
      {has('brincos') && (
        <g fill="#e3b65c" stroke="#9a6b10" strokeWidth="0.8">
          <circle cx="35" cy="61" r="2.4" />
          <circle cx="85" cy="61" r="2.4" />
        </g>
      )}
      {has('colar') && (
        <g>
          <path d="M51 78 Q60 88 69 78" fill="none" stroke="#9a6b10" strokeWidth="1" />
          {[52, 55, 58, 62, 65, 68].map((x) => (
            <circle key={x} cx={x} cy={78 + (x < 60 ? (x - 50) * 0.9 : (70 - x) * 0.9)} r="1.4" fill="#2c8b8b" />
          ))}
          <path d="M60 85 L63 89 L60 93 L57 89Z" fill="#e3b65c" stroke="#9a6b10" strokeWidth="0.8" />
        </g>
      )}
      {has('cartucheira') && (
        <g>
          <path d="M75 82 L44 114" stroke="#6b3e1e" strokeWidth="6" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={70 - i * 4.6} y={84 + i * 4.8} width="2.4" height="5" rx="1" fill="#e3b65c" stroke="#9a6b10" strokeWidth="0.5" transform={`rotate(44 ${71 - i * 4.6} ${86 + i * 4.8})`} />
          ))}
        </g>
      )}
      {has('relogio') && (
        <g>
          <path d="M53 100 Q58 105 64 101" fill="none" stroke="#e3b65c" strokeWidth="1.2" strokeDasharray="1.5 1" />
          <circle cx="65" cy="102" r="3.4" fill="#e3b65c" stroke="#9a6b10" strokeWidth="0.9" />
          <circle cx="65" cy="102" r="2" fill="#fff8e7" />
        </g>
      )}
      {has('corda') && (
        <g fill="none" stroke="#c9a46a" strokeWidth="2">
          <ellipse cx="40" cy="124" rx="7" ry="8" />
          <ellipse cx="40" cy="124" rx="5" ry="6" />
          <ellipse cx="40" cy="124" rx="3" ry="4" />
          <path d="M40 116 L44 110" stroke="#a87a4a" />
        </g>
      )}
      {has('luvas') && (
        <g fill="#8b5a2b" stroke="#3b220f" strokeWidth="1.2">
          <path d="M29 112 L40 112 L40 116 Q40 121 34.5 121 Q29 121 29 116Z" />
          <path d="M80 112 L91 112 L91 116 Q91 121 85.5 121 Q80 121 80 116Z" />
        </g>
      )}
      {has('esporas') && (
        <g fill="#c9c9c9" stroke="#6a6a6a" strokeWidth="0.8">
          <polygon points={starPoints(41, 147, 4, 1.6)} />
          <polygon points={starPoints(79, 147, 4, 1.6)} />
        </g>
      )}
    </g>
  );
}

export interface AvatarFigureProps {
  look: AvatarLook;
  /** "full" mostra o corpo inteiro; "bust" enquadra cabeça e ombros. */
  crop?: 'full' | 'bust';
  size?: number;
  x?: number;
  y?: number;
  title?: string;
  /** "shoot": braço direito com o revólver (duelo). */
  pose?: 'shoot';
}

export default function AvatarFigure({ look, crop = 'full', size = 120, x, y, title, pose }: AvatarFigureProps) {
  const clipId = `sob-chapeu${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const brim = HAT_BRIM[look.hat];
  const underHat = brim === undefined ? undefined : `url(#${clipId})`;
  const viewBox = crop === 'bust' ? '16 2 88 88' : '0 0 120 156';
  const height = crop === 'bust' ? size : (size * 156) / 120;
  return (
    <svg viewBox={viewBox} width={size} height={height} x={x} y={y} role="img" aria-label={title ?? 'Avatar'} style={{ overflow: crop === 'bust' ? 'hidden' : 'visible' }}>
      {title && <title>{title}</title>}
      {brim !== undefined && (
        <defs>
          <clipPath id={clipId}>
            {/* curva nas laterais: o volume do cabelo desce arredondado em vez de cortado reto */}
            <path d={`M-60 240 L-60 ${brim + 40} Q22 ${brim} 60 ${brim} Q98 ${brim} 180 ${brim + 40} L180 240 Z`} />
          </clipPath>
        </defs>
      )}
      {crop === 'full' && <ellipse cx="60" cy="152" rx="28" ry="4" fill="rgba(0,0,0,0.18)" />}
      <g clipPath={underHat}>
        <BackHair look={look} />
      </g>
      <Accessories look={look} front={false} />
      <Body look={look} aiming={pose === 'shoot'} />
      {/* pescoço, orelhas e cabeça */}
      <rect x="54" y="70" width="12" height="12" rx="3" fill={shade(look.skin, 0.12)} />
      <g fill={look.skin} stroke={shade(look.skin)} strokeWidth="1.5">
        <circle cx="36" cy="54" r="5" />
        <circle cx="84" cy="54" r="5" />
        <circle cx="60" cy="50" r="24" />
      </g>
      <g fill={look.makeup.includes('blush') ? '#e0607a' : '#e8857a'} opacity={look.makeup.includes('blush') ? 0.55 : 0.35}>
        <circle cx="45" cy="61" r={look.makeup.includes('blush') ? 4.6 : 4} />
        <circle cx="75" cy="61" r={look.makeup.includes('blush') ? 4.6 : 4} />
      </g>
      {look.makeup.includes('pinta') && <circle cx="71.5" cy="66" r="0.9" fill="#3b220f" />}
      <Eyes look={look} />
      <ellipse cx="60" cy="58" rx="2" ry="1.5" fill={shade(look.skin, 0.2)} />
      <Mouth look={look} />
      <FacialHairLayer look={look} />
      <g clipPath={underHat}>
        <FrontHair look={look} />
      </g>
      <Accessories look={look} front />
      <Hat look={look} />
      {pose === 'shoot' && <GunArm look={look} />}
    </svg>
  );
}
