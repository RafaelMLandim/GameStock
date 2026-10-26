// Service worker mínimo: só existe para o celular oferecer "Instalar app".
// Não guarda nada em cache de propósito: o jogo depende do servidor e cada
// atualização publicada aparece na hora, sem ninguém ficar com versão velha.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
