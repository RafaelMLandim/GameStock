import { useInstall } from '../install';

/** Convite para pôr o jogo na tela inicial do celular, como um aplicativo. */
export default function InstallApp() {
  const { mode, install } = useInstall();
  if (mode === 'installed' || mode === 'none') return null;
  return (
    <div className="install-app">
      {mode === 'prompt' ? (
        <button type="button" className="btn" onClick={install}>
          📲 Instalar o app no celular
        </button>
      ) : (
        <p>
          📲 <b>Use como aplicativo:</b>{' '}
          {mode === 'ios' ? (
            <>
              abra no Safari, toque em <b>Compartilhar</b> (o quadrado com a seta ⬆️) e depois em <b>Adicionar à Tela de Início</b>.
            </>
          ) : (
            <>
              abra no Chrome, toque no menu <b>⋮</b> e depois em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).
            </>
          )}
        </p>
      )}
    </div>
  );
}
