import { useEffect, useState, type ReactNode } from 'react';
import { AVATARS } from '../data';
import type { Player } from '../types';
import AvatarFigure from './AvatarFigure';
import { SceneBox } from './Backdrops';

const PHONE_QUERY = '(max-width: 700px)';

/** Tela de celular? Acompanha giro de tela e redimensionamento. */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const mq = matchMedia(PHONE_QUERY);
    const onChange = () => setPhone(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return phone;
}

export function avatarOf(p: Player) {
  return AVATARS.find((a) => a.id === p.avatar) ?? AVATARS[0];
}

export function Token({ player, size = 40 }: { player: Player; size?: number }) {
  return (
    <SceneBox className="token" title={`${player.codename} — ${player.realName}`} backdrop={player.backdrop} color={player.color} style={{ width: size, height: size }}>
      <AvatarFigure look={player.look} crop="bust" size={size - 6} />
    </SceneBox>
  );
}

/** Sem acento e em minúsculas, para a busca achar "Íris" digitando "iris". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const MAX_RESULTS = 8;

/**
 * Escolha de participante pela busca: com centenas de pessoas, uma lista inteira é inviável.
 * A cada letra digitada aparecem os nomes que combinam; Enter escolhe o primeiro.
 */
export function PlayerSelect({
  players,
  value,
  onChange,
  placeholder = 'Digite o nome ou codinome…',
}: {
  players: Player[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const chosen = players.find((p) => p.id === value);

  if (chosen) {
    return (
      <div className="player-picked">
        <Token player={chosen} size={32} />
        <span className="player-picked-name">
          <b>{chosen.codename}</b> <span className="muted">{chosen.realName}</span>
        </span>
        <button type="button" className="btn small" onClick={() => onChange('')}>
          Trocar
        </button>
      </div>
    );
  }

  const q = normalize(query.trim());
  const all = q ? players.filter((p) => normalize(`${p.codename} ${p.realName}`).includes(q)) : [];
  const matches = all.slice(0, MAX_RESULTS);
  const pick = (p: Player) => {
    onChange(p.id);
    setQuery('');
  };

  return (
    <div className="player-search">
      <input
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (matches[0]) pick(matches[0]);
          }
        }}
      />
      {q && (
        <ul className="player-results">
          {matches.length === 0 ? (
            <li className="muted player-results-empty">Ninguém com esse nome.</li>
          ) : (
            matches.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => pick(p)}>
                  <Token player={p} size={28} />
                  <span>
                    <b>{p.codename}</b> <span className="muted">{p.realName}</span>
                  </span>
                </button>
              </li>
            ))
          )}
          {all.length > MAX_RESULTS && <li className="muted player-results-empty">+{all.length - MAX_RESULTS} pessoas — continue digitando para filtrar.</li>}
        </ul>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
