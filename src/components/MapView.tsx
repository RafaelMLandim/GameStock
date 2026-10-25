import { useEffect, useRef, useState } from 'react';
import { LAST_TERRITORY, TERRITORIES } from '../data';
import { areaMissions, isLegend } from '../game';
import { useGame } from '../GameContext';
import AvatarFigure from './AvatarFigure';
import TerritoryMissions from './Missions';
import Place, { Cactus, Mesa } from './Places';
import { useIsPhone } from './shared';

const FIG_W = 44;
const FIG_H = (FIG_W * 156) / 120;

interface MapLayout {
  w: number;
  h: number;
  /** Posição de cada território, na ordem da jornada. */
  spots: { x: number; y: number }[];
  river: string;
  rail?: string;
  mesas: { x: number; y: number; w: number; h: number }[];
  cacti: [number, number][];
}

/** Mapa deitado para telas largas. */
const WIDE: MapLayout = {
  w: 1000,
  h: 600,
  spots: TERRITORIES.map((t) => ({ x: t.x, y: t.y })),
  river: 'M 0 330 C 120 300, 160 380, 300 340 S 460 420, 520 520 S 600 600, 640 600',
  rail: 'M 40 230 L 330 260 L 520 200',
  mesas: [
    { x: 110, y: 60, w: 120, h: 50 },
    { x: 610, y: 90, w: 130, h: 56 },
    { x: 720, y: 190, w: 90, h: 40 },
  ],
  cacti: [
    [130, 380],
    [470, 470],
    [600, 380],
    [930, 420],
    [760, 560],
    [60, 120],
  ],
};

/** Mapa em pé para o celular: a trilha desce em zigue-zague. */
const TALL: MapLayout = {
  w: 400,
  h: 1560,
  spots: [110, 290, 120, 280, 110, 290, 120, 280].map((x, i) => ({ x, y: 120 + i * 190 })),
  river: 'M 0 795 C 120 770, 220 830, 400 800',
  mesas: [
    { x: 310, y: 90, w: 110, h: 46 },
    { x: 75, y: 640, w: 100, h: 42 },
    { x: 320, y: 1180, w: 100, h: 42 },
  ],
  cacti: [
    [340, 420],
    [50, 450],
    [350, 990],
    [60, 1180],
    [365, 1300],
    [40, 1420],
  ],
};

function trailPath(spots: MapLayout['spots']): string {
  return spots
    .map((t, i) => {
      if (i === 0) return `M ${t.x} ${t.y}`;
      const a = spots[i - 1];
      const cx = (a.x + t.x) / 2 + (i % 2 ? 40 : -40);
      const cy = (a.y + t.y) / 2 + (i % 2 ? -30 : 30);
      return `Q ${cx} ${cy} ${t.x} ${t.y}`;
    })
    .join(' ');
}

function Scenery({ layout }: { layout: MapLayout }) {
  return (
    <g>
      <path d={layout.river} className="river" />
      {layout.mesas.map((m, i) => (
        <Mesa key={i} {...m} />
      ))}
      {layout.rail && (
        <>
          <path d={layout.rail} className="rail" />
          <path d={layout.rail} className="rail-ties" />
        </>
      )}
      {layout.cacti.map(([x, y], i) => (
        <Cactus key={i} x={x} y={y} s={i % 2 ? 0.8 : 1} />
      ))}
    </g>
  );
}

export default function MapView() {
  const { state, myPlayer, isAdmin } = useGame();
  const [openTerritory, setOpenTerritory] = useState<number | null>(null);
  const phone = useIsPhone();
  const layout = phone ? TALL : WIDE;
  const hereRef = useRef<SVGGElement>(null);

  // No celular o mapa é comprido: rola até onde o jogador está.
  useEffect(() => {
    if (phone && hereRef.current) hereRef.current.scrollIntoView({ block: 'center' });
  }, [phone, myPlayer?.territory]);
  // O jogador só abre as missões de onde está; a gestão abre qualquer território.
  const canOpen = (id: number) => isAdmin || myPlayer?.territory === id;

  return (
    <section>
      <p className="hint">
        {myPlayer
          ? `📍 Você está em ${TERRITORIES[myPlayer.territory].name}. Toque no local para jogar as missões de lá.`
          : isAdmin
            ? '⭐ Gestão: toque em qualquer território para ver, liberar e editar as missões de lá.'
            : 'Crie seu personagem na aba 🤠 Personagens para começar a jornada no Acampamento.'}
      </p>
      <div className="map-wrap">
        <svg viewBox={`0 0 ${layout.w} ${layout.h}`} className="map" role="img" aria-label="Mapa da Jornada do Oeste">
          <rect width={layout.w} height={layout.h} className="map-bg" rx="18" />
          <Scenery layout={layout} />
          <path d={trailPath(layout.spots)} className="trail" />
          {TERRITORIES.map((t) => {
            const mine = myPlayer?.territory === t.id;
            const clickable = canOpen(t.id);
            const ahead = !isAdmin && myPlayer && t.id > myPlayer.territory;
            const spot = layout.spots[t.id];
            return (
            <g
              key={t.id}
              ref={mine ? hereRef : undefined}
              transform={`translate(${spot.x} ${spot.y})`}
              className={`place${clickable ? ' clickable' : ''}${ahead ? ' locked' : ''}`}
              onClick={clickable ? () => setOpenTerritory(t.id) : undefined}
              onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && setOpenTerritory(t.id) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-label={clickable ? `Abrir missões de ${t.name}` : undefined}
            >
              {mine && <ellipse cy="27" rx="66" ry="15" className="here-ring" />}
              <rect x="-62" y="-62" width="124" height="96" fill="transparent" />
              <Place id={t.id} />
              {mine && (
                <text textAnchor="middle" y="92" className="node-cta">
                  {phone ? '👆 Toque para jogar' : '👆 Clique para jogar'}
                </text>
              )}
              <text textAnchor="middle" y="56" className="node-label">
                {t.id + 1}. {t.name}
              </text>
              {t.id < LAST_TERRITORY && (
                <text textAnchor="middle" y="74" className="node-sub">
                  {areaMissions(state, t.id).length} missões na área
                </text>
              )}
            </g>
            );
          })}
          {/* Com centenas de jogadores, cada um vê só o próprio bonequinho no mapa. */}
          {myPlayer && (
            <g
              transform={`translate(${layout.spots[myPlayer.territory].x} ${layout.spots[myPlayer.territory].y - 40})`}
              className="clickable"
              onClick={() => setOpenTerritory(myPlayer.territory)}
            >
              <title>{`${myPlayer.codename} (você)`}</title>
              <ellipse rx="14" ry="5" fill={myPlayer.color} stroke="#2b1a0e" strokeWidth="1.5" />
              <AvatarFigure look={myPlayer.look} size={FIG_W} x={-FIG_W / 2} y={-FIG_H + 2} />
              {isLegend(myPlayer) && (
                <text textAnchor="middle" y={-FIG_H - 2} fontSize="13">
                  ⭐
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
      {openTerritory !== null && <TerritoryMissions territory={openTerritory} onClose={() => setOpenTerritory(null)} />}
    </section>
  );
}
