/**
 * Pedido para o mapa abrir as missões de um território (ex.: tocar num aviso do sininho).
 * Fica guardado até o mapa aparecer, porque a aba do mapa pode ainda não estar montada.
 */
let pending: number | null = null;

export function requestTerritory(territory: number) {
  pending = territory;
  window.dispatchEvent(new Event('open-territory'));
}

export function takeTerritoryRequest(): number | null {
  const t = pending;
  pending = null;
  return t;
}
