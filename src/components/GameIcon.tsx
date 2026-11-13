/**
 * Revólver de faroeste desenhado à mão: o emoji 🔫 virou pistola d'água no Windows e nos
 * celulares, o que não combina com o duelo. Aparece no tamanho do texto (1em), como um emoji.
 */
export function Revolver() {
  return (
    <svg className="icon-svg" viewBox="0 0 64 64" role="img" aria-label="Revólver">
      {/* cano e mira */}
      <rect x="27" y="17" width="34" height="7" rx="1.5" fill="#7d8691" stroke="#2b2f35" strokeWidth="1.5" />
      <rect x="56.5" y="13.5" width="3" height="4" rx="0.8" fill="#2b2f35" />
      {/* vareta do extrator, embaixo do cano */}
      <rect x="31" y="24" width="22" height="3.5" rx="1.2" fill="#5b636d" stroke="#2b2f35" strokeWidth="1.2" />
      {/* armação */}
      <path d="M13 16 H30 V33 H22 L15 29 Z" fill="#4a525c" stroke="#2b2f35" strokeWidth="1.5" strokeLinejoin="round" />
      {/* tambor com sulcos */}
      <rect x="17" y="18" width="14" height="13" rx="2.5" fill="#9aa3ad" stroke="#2b2f35" strokeWidth="1.5" />
      <line x1="17.5" y1="22.5" x2="30.5" y2="22.5" stroke="#5b636d" strokeWidth="1.3" />
      <line x1="17.5" y1="26.5" x2="30.5" y2="26.5" stroke="#5b636d" strokeWidth="1.3" />
      {/* cão (martelo) */}
      <path d="M14 17 L8 10.5 L11 9 L17 15.5 Z" fill="#4a525c" stroke="#2b2f35" strokeWidth="1.3" strokeLinejoin="round" />
      {/* guarda-mato e gatilho */}
      <path d="M20 33 Q20.5 41.5 29 40 L30 33" fill="none" stroke="#2b2f35" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24.5 33 Q25.5 36.5 23.5 38.5" fill="none" stroke="#2b2f35" strokeWidth="2" strokeLinecap="round" />
      {/* cabo de madeira */}
      <path
        d="M13 18 L21 31 L16.5 50 Q15.5 54.5 11 53.5 L5 52 Q2 51 2.8 47.5 L7.5 25 Q8.5 19 13 18 Z"
        fill="#8b5a2b"
        stroke="#3b220f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 26 L6.5 45" stroke="#b07a45" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="33" r="1.4" fill="#e8d6a8" />
    </svg>
  );
}

/** Mostra o ícone de uma missão ou minijogo; o 🔫 vira o revólver desenhado. */
export default function GameIcon({ icon }: { icon: string }) {
  return icon === '🔫' ? <Revolver /> : <>{icon}</>;
}
