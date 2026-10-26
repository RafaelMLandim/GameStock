import { useState } from 'react';
import { useInstall } from '../install';

/**
 * Botão para pôr o jogo na tela inicial como aplicativo. Onde o navegador deixa (Chrome/Edge),
 * abre a janela de instalação; no iPhone e no resto, mostra o passo a passo.
 * `compact`: versão pequena para a barra do topo do jogo.
 */
export default function InstallApp({ compact }: { compact?: boolean }) {
  const { mode, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (mode === 'installed' || mode === 'none') return null;
  return (
    <div className={compact ? 'install-app compact' : 'install-app'}>
      <button type="button" className={compact ? 'btn small' : 'btn'} onClick={() => (mode === 'prompt' ? install() : setHelp(!help))} aria-expanded={mode === 'prompt' ? undefined : help}>
        📲 {compact ? 'Instalar app' : 'Instalar o app'}
      </button>
      {help && (
        <p role="note">
          {mode === 'ios' ? (
            <>
              No <b>Safari</b>, toque em <b>Compartilhar</b> (o quadrado com a seta ⬆️) e depois em <b>Adicionar à Tela de Início</b>.
            </>
          ) : (
            <>
              No <b>Chrome</b>, toque no menu <b>⋮</b> e depois em <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).
            </>
          )}{' '}
          Se abriu pelo WhatsApp, primeiro toque em <b>Abrir no navegador</b>.
        </p>
      )}
    </div>
  );
}
