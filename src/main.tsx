import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { GameProvider } from './GameContext';
// Música e efeitos: o próprio módulo espera o primeiro toque para liberar o som.
import './sound';
// App instalável: registra o service worker e guarda o convite de instalação.
import './install';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
