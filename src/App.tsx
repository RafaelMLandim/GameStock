import { useState } from 'react';
import BadgesTab from './components/Badges';
import Login from './components/Login';
import MapView from './components/MapView';
import Players from './components/Players';
import Ranking from './components/Ranking';
import SoundToggles from './components/SoundToggles';
import Store from './components/Store';
import { pendingBadges, pendingOrders } from './game';
import { useAuth, useGame } from './GameContext';

// Usuário comum vê só o mapa, o próprio personagem e o armazém; o resto é da gestão.
const TABS = [
  { id: 'mapa', label: '🗺️ Mapa', playerLabel: '🗺️ Mapa', Component: MapView, adminOnly: false },
  { id: 'distintivos', label: '🎖️ Distintivos', playerLabel: '🎖️ Distintivos', Component: BadgesTab, adminOnly: false },
  { id: 'ranking', label: '🏆 Ranking', playerLabel: '', Component: Ranking, adminOnly: true },
  { id: 'personagens', label: '🤠 Personagens', playerLabel: '🤠 Meu Personagem', Component: Players, adminOnly: false },
  { id: 'armazem', label: '🛒 Armazém', playerLabel: '🛒 Armazém', Component: Store, adminOnly: false },
] as const;

type TabId = (typeof TABS)[number]['id'];

function Game() {
  const { state, user, isAdmin, myPlayer, logout, error, clearError } = useGame();
  // Pedidos de distintivo esperando a gestão aparecem como contador na aba.
  const waiting = pendingBadges(state).length;
  // E os pedidos de troca do Armazém esperando a nota.
  const orders = pendingOrders(state).length;
  const tabs = TABS.filter((t) => isAdmin || !t.adminOnly);
  const [tab, setTabState] = useState<TabId>(() => {
    const id = location.hash.slice(1);
    if (tabs.some((t) => t.id === id)) return id as TabId;
    // Jogador que ainda não criou o personagem começa por ele; a gestão não cria personagem.
    return myPlayer || isAdmin ? 'mapa' : 'personagens';
  });
  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  const setTab = (id: TabId) => {
    setTabState(id);
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="app">
      <header className="header no-print">
        <div className="userbar">
          <span>
            {isAdmin ? '⭐ Gestão' : '🤠'} <b>{myPlayer?.codename ?? user.realName}</b> <span className="muted">({user.username})</span>
          </span>
          <SoundToggles />
          <button className="btn small" onClick={logout}>
            Sair
          </button>
        </div>
        <h1>Fronteira do Estoque</h1>
        <p className="subtitle">A Jornada do Oeste</p>
        <nav className="tabs">
          {tabs.map((t) => {
            // "🎖️ Distintivos" → ícone e nome separados (no celular o ícone fica em cima).
            const [icon, ...name] = (isAdmin ? t.label : t.playerLabel).split(' ');
            return (
              <button key={t.id} className={t.id === current.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
                <span className="tab-icon">{icon}</span> <span className="tab-name">{name.join(' ')}</span>
                {/* Pedidos esperando análise: aviso só para a gestão. */}
                {isAdmin && t.id === 'distintivos' && waiting > 0 && <span className="tab-count">{waiting}</span>}
                {isAdmin && t.id === 'armazem' && orders > 0 && <span className="tab-count">{orders}</span>}
              </button>
            );
          })}
        </nav>
      </header>
      {error && (
        <div className="error-banner no-print" role="alert">
          {error}
          <button className="btn small" onClick={clearError}>
            OK
          </button>
        </div>
      )}
      <main className="content">
        <current.Component />
      </main>
      {/* A licença da música tema (CC BY) pede o crédito ao autor. */}
      <footer className="credits no-print">
        🎵 Música: “Sergio's Magic Dustbin” — Kevin MacLeod (<a href="https://incompetech.com" target="_blank" rel="noreferrer">incompetech.com</a>) · Licença{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading">Selando os cavalos…</div>;
  return user ? <Game /> : <Login />;
}
