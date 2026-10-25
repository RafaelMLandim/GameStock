import { normalizeLook } from './avatar';
import {
  AVATARS,
  BADGE_POINTS,
  BADGE_TYPES,
  BADGE_WIN_BONUS,
  DEFAULT_MISSIONS,
  DEFAULT_STORE,
  RETIRED_STORE,
  ECONOMY_VERSION,
  LAST_TERRITORY,
  MAX_BADGE_WIN_BONUS,
  MAX_PENDING_BADGES,
  MISSION_BADGE_HINTS,
  MISSION_REWARD,
  SPECIAL_CARDS,
  TERRITORIES,
  WIN_POINTS,
  initialState,
} from './data';
import type { Badge, BadgeType, CardId, GameState, LogEntry, Mission, MissionCategory, Player, StoreItem, StoreOrder } from './types';

export type PlayerProfile = Pick<Player, 'realName' | 'codename' | 'avatar' | 'look' | 'color' | 'backdrop'>;

/** Completa estados salvos por versões antigas (ex.: jogadores sem visual). */
// Emojis novos demais que viram um quadradinho vazio em muitos celulares e no Windows.
const BROKEN_ICONS = ['🪢', '🪨', '🪵', '🪶', '🦺'];

function fixOldIcon(m: Mission): Mission {
  if (!BROKEN_ICONS.includes(m.icon)) return m;
  return { ...m, icon: DEFAULT_MISSIONS.find((d) => d.id === m.id)?.icon ?? '⭐' };
}

/** Dólares são sempre inteiros e nunca negativos. */
export function whole(n: number): number {
  return Math.max(0, Math.round(Number(n) || 0));
}

/**
 * Economia antiga (missões de $30 a $80, armazém de $80 a $250) para a escala da época:
 * missões de $1 e armazém de $3 a $33. Itens e missões padrão recebem os valores novos;
 * os criados pela gestão e as carteiras são reduzidos na mesma proporção.
 */
function convertOldEconomy(state: GameState): GameState {
  return {
    ...state,
    economy: 1,
    missions: state.missions.map((m) => ({
      ...m,
      reward: DEFAULT_MISSIONS.some((d) => d.id === m.id) ? MISSION_REWARD : Math.max(1, Math.round(m.reward / 50)),
    })),
    storeItems: state.storeItems.map((i) => DEFAULT_STORE.find((d) => d.id === i.id) ?? { ...i, price: Math.max(1, Math.round(i.price / 12)) }),
    players: state.players.map((p) => ({ ...p, dollars: whole(p.dollars / 50) })),
  };
}

/** Por que essa pessoa não pode trocar o item agora (ou null se pode). */
export function buyerBlock(item: StoreItem, p: Player): string | null {
  if (item.stock !== undefined && item.stock <= 0) return 'Esgotado';
  if (item.limit !== undefined && (p.purchases[item.id] ?? 0) >= item.limit) return `Limite de ${item.limit} por pessoa atingido`;
  if (p.dollars < item.price) return 'Dólares insuficientes';
  return null;
}

/** Pedidos de troca esperando a gestão, do mais antigo para o mais novo. */
export function pendingOrders(state: GameState, playerId?: string): StoreOrder[] {
  return state.orders.filter((o) => o.status === 'pendente' && (!playerId || o.playerId === playerId));
}

/**
 * Por que a pessoa não pode pedir o item agora (ou null). Pedidos ainda na fila já contam:
 * reservam os dólares dela, a unidade do estoque e a vez no limite por pessoa.
 */
export function orderBlock(state: GameState, item: StoreItem, p: Player): string | null {
  const waiting = pendingOrders(state);
  const mine = waiting.filter((o) => o.playerId === p.id);
  const reserved = mine.reduce((sum, o) => sum + o.price, 0);
  if (item.stock !== undefined && item.stock - waiting.filter((o) => o.itemId === item.id).length <= 0) return 'Esgotado';
  if (item.limit !== undefined && (p.purchases[item.id] ?? 0) + mine.filter((o) => o.itemId === item.id).length >= item.limit)
    return `Limite de ${item.limit} por pessoa atingido`;
  if (p.dollars - reserved < item.price) return 'Dólares insuficientes';
  return null;
}

/**
 * Armazém com os produtos da Brasal: tira chocolate, refrigerante, sobremesa, música e prioridade, atualiza os itens
 * padrão que ficaram e acrescenta os novos. Itens criados pela gestão continuam como estão.
 */
function brasalStore(state: GameState): GameState {
  const kept = state.storeItems.filter((i) => !RETIRED_STORE.includes(i.id)).map((i) => DEFAULT_STORE.find((d) => d.id === i.id) ?? i);
  const added = DEFAULT_STORE.filter((d) => !kept.some((i) => i.id === d.id));
  return { ...state, economy: ECONOMY_VERSION, storeItems: [...added, ...kept] };
}

export function normalizeState(raw: Partial<GameState>): GameState {
  const loaded = { ...initialState(), ...raw };
  const converted = (raw.economy ?? 0) < 1 && raw.players ? convertOldEconomy(loaded) : loaded;
  const base = (converted.economy ?? 0) < ECONOMY_VERSION && raw.players ? brasalStore(converted) : converted;
  // Missões antigas (atividades sem minijogo) dão lugar às missões-minijogo padrão.
  const missions = base.missions.filter((m) => m.game).map(fixOldIcon);
  return {
    ...base,
    missions: missions.length ? missions : DEFAULT_MISSIONS,
    orders: base.orders ?? [],
    storeItems: base.storeItems.map((i) => (i.cost === undefined ? { ...i, cost: DEFAULT_STORE.find((d) => d.id === i.id)?.cost } : i)),
    players: base.players.map((p) => ({
      ...p,
      cleared: (p.cleared ?? []).filter((id) => missions.some((m) => m.id === id)),
      attempts: p.attempts ?? {},
      purchases: p.purchases ?? {},
      // O cartaz de procurado saiu da lista de fundos.
      backdrop: p.backdrop === 'procurado' ? 'deserto' : p.backdrop,
      look: normalizeLook(p.look ?? AVATARS.find((a) => a.id === p.avatar)?.look ?? {}),
    })),
  };
}

export type Action =
  | { type: 'ADD_PLAYER'; player: PlayerProfile; userId?: string }
  | { type: 'UPDATE_PLAYER'; id: string; changes: Partial<PlayerProfile> }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'SET_RELEASED'; missionIds: string[]; released: boolean }
  | { type: 'WIN_MISSION'; playerId: string; missionId: string }
  | { type: 'LOSE_MISSION'; playerId: string; missionId: string }
  | { type: 'REQUEST_BADGE'; badge: Pick<Badge, 'id' | 'playerId' | 'typeId' | 'reason' | 'photoId'> }
  | { type: 'GIVE_BADGE'; badge: Pick<Badge, 'id' | 'playerId' | 'typeId' | 'reason' | 'dollars'> }
  | { type: 'REVIEW_BADGE'; badgeId: string; approve: boolean; note: string; dollars: number }
  | { type: 'COMPLETE_MISSION'; missionId: string; playerIds: string[]; bonus: number }
  | { type: 'DRAW_CARD'; playerId: string; cardId: CardId; targetId?: string }
  | { type: 'USE_SHORTCUT'; playerId: string }
  | { type: 'BUY'; playerId: string; itemId: string }
  | { type: 'REQUEST_ORDER'; order: Pick<StoreOrder, 'id' | 'playerId' | 'itemId'> }
  | { type: 'RESOLVE_ORDER'; orderId: string; approve: boolean; note: string; by?: string }
  | { type: 'ADJUST_DOLLARS'; playerId: string; amount: number; reason: string }
  | { type: 'SAVE_MISSION'; mission: Mission }
  | { type: 'REMOVE_MISSION'; id: string }
  | { type: 'SAVE_ITEM'; item: StoreItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'IMPORT'; state: GameState }
  | { type: 'RESET' };

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function isLegend(p: Player): boolean {
  return p.territory >= LAST_TERRITORY;
}

/** Missões da área: todas precisam ser concluídas para sair do território. */
export function areaMissions(state: GameState, territory: number): Mission[] {
  return state.missions.filter((m) => m.territory === territory);
}

/** Missões que aparecem num território: as da área e as extras (de qualquer lugar). */
export function missionsAt(state: GameState, territory: number): Mission[] {
  return state.missions.filter((m) => m.territory == null || m.territory === territory);
}

/** Pontos de categoria de uma vitória, conforme as derrotas antes dela. */
export function winPoints(failures: number): number {
  return WIN_POINTS[Math.min(failures, WIN_POINTS.length - 1)];
}

/** Tipos de distintivo aprovados que o jogador tem numa categoria (cada tipo conta uma vez). */
export function badgeTypesIn(state: GameState, playerId: string, category: MissionCategory): BadgeType[] {
  const owned = new Set(state.badges.filter((b) => b.playerId === playerId && b.status === 'aprovado').map((b) => b.typeId));
  return BADGE_TYPES.filter((t) => t.category === category && owned.has(t.id));
}

/** Pontos extras nas vitórias de uma categoria por ter distintivos dela. */
export function badgeBonus(state: GameState, playerId: string, category: MissionCategory): number {
  return Math.min(MAX_BADGE_WIN_BONUS, badgeTypesIn(state, playerId, category).length * BADGE_WIN_BONUS);
}

/**
 * Distintivo sugerido no fim da missão: o escolhido pela gestão, o da missão padrão
 * ou, se nenhum, um da mesma categoria que o jogador ainda não tem.
 */
export function suggestedBadge(state: GameState, mission: Mission, playerId?: string): BadgeType {
  const chosen = BADGE_TYPES.find((t) => t.id === (mission.badgeHint ?? MISSION_BADGE_HINTS[mission.id]));
  if (chosen) return chosen;
  const sameCategory = BADGE_TYPES.filter((t) => t.category === mission.category);
  const owned = playerId ? badgeTypesIn(state, playerId, mission.category) : [];
  return sameCategory.find((t) => !owned.includes(t)) ?? sameCategory[0] ?? BADGE_TYPES[0];
}

/** Cada tipo de distintivo só pode ser ganho uma vez: diz se a pessoa já tem ou já pediu (ou null). */
export function badgeTaken(state: GameState, playerId: string, typeId: string): 'aprovado' | 'pendente' | null {
  const same = state.badges.filter((b) => b.playerId === playerId && b.typeId === typeId);
  if (same.some((b) => b.status === 'aprovado')) return 'aprovado';
  if (same.some((b) => b.status === 'pendente')) return 'pendente';
  return null;
}

export function pendingBadges(state: GameState, playerId?: string): Badge[] {
  return state.badges.filter((b) => b.status === 'pendente' && (!playerId || b.playerId === playerId));
}

/** O jogador pode jogar a missão agora? Precisa estar liberada, no lugar certo e ainda não concluída. */
export function canPlay(state: GameState, p: Player, m: Mission): boolean {
  return !!m.released && missionsAt(state, p.territory).includes(m) && !p.cleared.includes(m.id);
}

/** Missões da área atual que o jogador ainda não concluiu. */
export function pendingMissions(state: GameState, p: Player): Mission[] {
  if (isLegend(p)) return [];
  return areaMissions(state, p.territory).filter((m) => !p.cleared.includes(m.id));
}

export function missionsLeft(state: GameState, p: Player): number {
  return pendingMissions(state, p).length;
}

/** Quantas missões da área atual o jogador já concluiu, de quantas. */
export function areaProgress(state: GameState, p: Player): { done: number; total: number } {
  const total = areaMissions(state, p.territory).length;
  return { done: total - missionsLeft(state, p), total };
}

/** Valor usado para ordenar a jornada: território + fração percorrida. */
export function journeyValue(state: GameState, p: Player): number {
  if (isLegend(p)) return LAST_TERRITORY + p.stars / 1000;
  const { done, total } = areaProgress(state, p);
  return p.territory + done / Math.max(1, total);
}

const PROFILE_FIELDS = ['realName', 'codename', 'avatar', 'look', 'color', 'backdrop'] as const;

/** Só os campos do perfil: quem edita o personagem não mexe em dólares, pontos ou progresso. */
function profileOnly(data: Partial<PlayerProfile>): Partial<PlayerProfile> {
  return Object.fromEntries(PROFILE_FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]]));
}

export function newPlayer(data: PlayerProfile, userId?: string): Player {
  return {
    ...(profileOnly(data) as PlayerProfile),
    id: uid(),
    userId,
    look: normalizeLook(data.look),
    territory: 0,
    cleared: [],
    dollars: 0,
    stars: 0,
    outlaw: false,
    shortcuts: 0,
    lastReward: 0,
    missionsDone: {},
    purchases: {},
    attempts: {},
    categoryPoints: { qualidade: 0, seguranca: 0, companheirismo: 0, espirito: 0 },
  };
}

function entry(icon: string, text: string): LogEntry {
  return { id: uid(), at: Date.now(), icon, text };
}

/** Segue viagem enquanto não houver missão pendente na área (áreas sem missões são atravessadas). */
function settle(state: GameState, p: Player, logs: LogEntry[]): Player {
  const next = { ...p };
  while (!isLegend(next) && pendingMissions(state, next).length === 0) {
    next.territory += 1;
    const t = TERRITORIES[next.territory];
    if (isLegend(next)) {
      logs.push(entry('🏆', `${next.codename} concluiu todas as missões e chegou ao ${t.name}: virou uma LENDA DO OESTE!`));
    } else {
      logs.push(entry(t.icon, `${next.codename} concluiu todas as missões da área e chegou a ${t.name}.`));
    }
  }
  return next;
}

/** Marca uma missão da área como concluída para o mapa e segue viagem se a área acabou. */
function clearMission(state: GameState, p: Player, missionId: string, logs: LogEntry[]): Player {
  if (p.cleared.includes(missionId)) return p;
  return settle(state, { ...p, cleared: [...p.cleared, missionId] }, logs);
}

/** Pula a próxima missão pendente da área (cartas e Comboio). Lendas ganham uma estrela. */
function skipOne(state: GameState, p: Player, reason: string, logs: LogEntry[]): Player {
  if (isLegend(p)) {
    logs.push(entry('⭐', `${p.codename} conquistou uma estrela de Lenda (total: ${p.stars + 1}).`));
    return { ...p, stars: p.stars + 1 };
  }
  const [m] = pendingMissions(state, p);
  if (!m) return p;
  logs.push(entry('🐎', `${p.codename} pulou a missão "${m.name}" (${reason}).`));
  return clearMission(state, p, m.id, logs);
}

/** Depois de mudar as missões, quem ficou sem pendências na área segue viagem. */
function settleAll(state: GameState): GameState {
  const logs: LogEntry[] = [];
  const players = state.players.map((p) => settle(state, p, logs));
  return logs.length ? withLog(state, players, logs) : state;
}

/** Paga a missão e aplica o efeito no mapa (área concluída, estrela de Lenda, Fora da Lei...). */
function rewardMission(state: GameState, p: Player, mission: Mission, reward: number, points: number, logs: LogEntry[]): Player {
  const next: Player = {
    ...p,
    dollars: p.dollars + reward,
    lastReward: reward,
    missionsDone: { ...p.missionsDone, [mission.id]: (p.missionsDone[mission.id] ?? 0) + 1 },
    categoryPoints: { ...p.categoryPoints, [mission.category]: p.categoryPoints[mission.category] + points },
  };
  logs.push(entry(mission.icon, `${p.codename} completou "${mission.name}"${reward ? ` e ganhou $${reward}` : ''}.`));
  if (next.outlaw) {
    if (mission.surprise) {
      next.outlaw = false;
      logs.push(entry('🕊️', `${p.codename} cumpriu a missão surpresa e não é mais Fora da Lei.`));
    } else {
      logs.push(entry('☠️', `${p.codename} está Fora da Lei: a missão não conta para o mapa até cumprir uma missão surpresa.`));
      return next;
    }
  }
  if (mission.territory !== next.territory) {
    // Missão coletiva sem área própria: todos os jogadores pulam uma missão pendente.
    return mission.collective && mission.territory == null ? skipOne(state, next, 'Comboio', logs) : next;
  }
  if (isLegend(next)) {
    logs.push(entry('⭐', `${p.codename} conquistou uma estrela de Lenda (total: ${next.stars + 1}).`));
    return { ...next, stars: next.stars + 1, cleared: [...next.cleared, mission.id] };
  }
  return clearMission(state, next, mission.id, logs);
}

/** Distintivo aprovado: pontos na categoria, bônus em dólares e anúncio no diário. */
function grantBadge(state: GameState, badge: Badge): GameState {
  const type = BADGE_TYPES.find((t) => t.id === badge.typeId)!;
  const logs: LogEntry[] = [];
  const players = state.players.map((p) => {
    if (p.id !== badge.playerId) return p;
    logs.push(entry('🎖️', `${p.codename} recebeu o distintivo ${type.icon} ${type.name}${badge.dollars ? ` e $${badge.dollars}` : ''}!`));
    return {
      ...p,
      dollars: p.dollars + badge.dollars,
      categoryPoints: { ...p.categoryPoints, [type.category]: p.categoryPoints[type.category] + BADGE_POINTS },
    };
  });
  return withLog(state, players, logs);
}

function withLog(state: GameState, players: Player[], logs: LogEntry[]): GameState {
  return { ...state, players, log: [...logs.reverse(), ...state.log].slice(0, 500) };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const p = newPlayer(action.player, action.userId);
      return withLog(state, [...state.players, p], [entry('🐴', `${p.codename} (${p.realName}) entrou no Acampamento.`)]);
    }
    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, ...profileOnly(action.changes), look: normalizeLook(action.changes.look ?? p.look) } : p)) };
    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        // Pedidos ainda na fila de quem saiu do jogo não têm mais para quem emitir a nota.
        orders: state.orders.filter((o) => o.playerId !== action.id || o.status !== 'pendente'),
      };

    case 'SET_RELEASED': {
      const changed = state.missions.filter((m) => action.missionIds.includes(m.id) && !!m.released !== action.released);
      if (changed.length === 0) return state;
      const missions = state.missions.map((m) => (action.missionIds.includes(m.id) ? { ...m, released: action.released } : m));
      const logs = action.released ? changed.map((m) => entry('📯', `O xerife liberou a missão "${m.name}" para todos.`)) : [];
      return withLog({ ...state, missions }, state.players, logs);
    }

    case 'WIN_MISSION': {
      const mission = state.missions.find((m) => m.id === action.missionId);
      const player = state.players.find((p) => p.id === action.playerId);
      if (!mission || !player || !canPlay(state, player, mission)) return state;
      // Dólares e pontos só na primeira vitória (extras podem ser jogados de novo, sem pagar).
      const first = !player.missionsDone[mission.id];
      const reward = first ? mission.reward : 0;
      const points = first ? winPoints(player.attempts[mission.id] ?? 0) + badgeBonus(state, player.id, mission.category) : 0;
      const logs: LogEntry[] = [];
      const players = state.players.map((p) => (p.id === player.id ? rewardMission(state, p, mission, reward, points, logs) : p));
      return withLog(state, players, logs);
    }

    case 'LOSE_MISSION': {
      const mission = state.missions.find((m) => m.id === action.missionId);
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId && mission && canPlay(state, p, mission) && !p.missionsDone[mission.id]
            ? { ...p, attempts: { ...p.attempts, [mission.id]: (p.attempts[mission.id] ?? 0) + 1 } }
            : p,
        ),
      };
    }

    case 'REQUEST_BADGE': {
      const type = BADGE_TYPES.find((t) => t.id === action.badge.typeId);
      const player = state.players.find((p) => p.id === action.badge.playerId);
      const reason = action.badge.reason.trim().slice(0, 500);
      if (!type || !player || !reason || (type.photoRequired && !action.badge.photoId)) return state;
      if (pendingBadges(state, player.id).length >= MAX_PENDING_BADGES || badgeTaken(state, player.id, type.id)) return state;
      const badge: Badge = { ...action.badge, reason, status: 'pendente', from: 'jogador', at: Date.now(), dollars: 0 };
      return withLog({ ...state, badges: [badge, ...state.badges] }, state.players, [
        entry('📨', `${player.codename} pediu o distintivo ${type.icon} ${type.name}.`),
      ]);
    }

    case 'GIVE_BADGE': {
      const type = BADGE_TYPES.find((t) => t.id === action.badge.typeId);
      const player = state.players.find((p) => p.id === action.badge.playerId);
      if (!type || !player || badgeTaken(state, player.id, type.id) === 'aprovado') return state;
      const now = Date.now();
      const badge: Badge = { ...action.badge, status: 'aprovado', from: 'gestao', at: now, reviewedAt: now, dollars: whole(action.badge.dollars) };
      return grantBadge({ ...state, badges: [badge, ...state.badges] }, badge);
    }

    case 'REVIEW_BADGE': {
      const badge = state.badges.find((b) => b.id === action.badgeId);
      if (!badge || badge.status !== 'pendente') return state;
      if (action.approve && badgeTaken(state, badge.playerId, badge.typeId) === 'aprovado') return state;
      const reviewed: Badge = {
        ...badge,
        status: action.approve ? 'aprovado' : 'recusado',
        note: action.note.trim() || undefined,
        dollars: action.approve ? whole(action.dollars) : 0,
        reviewedAt: Date.now(),
      };
      const next = { ...state, badges: state.badges.map((b) => (b.id === badge.id ? reviewed : b)) };
      return action.approve ? grantBadge(next, reviewed) : next;
    }

    case 'COMPLETE_MISSION': {
      const mission = state.missions.find((m) => m.id === action.missionId);
      if (!mission) return state;
      const logs: LogEntry[] = [];
      // Como no jogo, a missão só paga dólares e pontos na primeira vez; o bônus extra da gestão sempre vale.
      const players = state.players.map((p) => {
        if (!action.playerIds.includes(p.id)) return p;
        const first = !p.missionsDone[mission.id];
        const reward = (first ? mission.reward : 0) + whole(action.bonus);
        return rewardMission(state, p, mission, reward, first ? WIN_POINTS[WIN_POINTS.length - 1] : 0, logs);
      });
      if (mission.collective) logs.unshift(entry('🤝', `O Comboio chegou! Todos avançaram juntos.`));
      return withLog(state, players, logs);
    }

    case 'DRAW_CARD': {
      const card = SPECIAL_CARDS.find((c) => c.id === action.cardId)!;
      const logs: LogEntry[] = [];
      const owner = state.players.find((p) => p.id === action.playerId);
      if (!owner) return state;
      logs.push(entry(card.icon, `${owner.codename} tirou a carta ${card.name}.`));
      const companionBonus = Math.max(owner.lastReward, 1);
      const players = state.players.map((p) => {
        if (p.id === action.playerId) {
          switch (card.id) {
            case 'cavalo':
              if (p.outlaw) {
                logs.push(entry('☠️', `${p.codename} está Fora da Lei e não pode cavalgar.`));
                return p;
              }
              return skipOne(state, p, 'Cavalo Veloz', logs);
            case 'ouro':
              return { ...p, dollars: p.dollars + 3 };
            case 'atalho':
              return { ...p, shortcuts: p.shortcuts + 1 };
            case 'foradalei':
              return { ...p, outlaw: true };
            case 'companheiro':
              return { ...p, categoryPoints: { ...p.categoryPoints, companheirismo: p.categoryPoints.companheirismo + 1 } };
          }
        }
        if (card.id === 'companheiro' && p.id === action.targetId) {
          logs.push(entry('🤝', `${owner.codename} dividiu $${companionBonus} com o velho companheiro ${p.codename}.`));
          return { ...p, dollars: p.dollars + companionBonus };
        }
        return p;
      });
      return withLog(state, players, logs);
    }

    case 'USE_SHORTCUT': {
      const logs: LogEntry[] = [];
      const players = state.players.map((p) => {
        if (p.id !== action.playerId || p.shortcuts <= 0 || p.outlaw) return p;
        return skipOne(state, { ...p, shortcuts: p.shortcuts - 1 }, 'Atalho do Desfiladeiro', logs);
      });
      return withLog(state, players, logs);
    }

    case 'BUY': {
      const item = state.storeItems.find((i) => i.id === action.itemId);
      if (!item) return state;
      const logs: LogEntry[] = [];
      const buyer = state.players.find((p) => p.id === action.playerId);
      if (!buyer || buyerBlock(item, buyer)) return state;
      logs.push(entry('🛒', `${buyer.codename} trocou $${item.price} por "${item.name}" no Armazém do Saloon.`));
      const players = state.players.map((p) =>
        p.id === buyer.id ? { ...p, dollars: p.dollars - item.price, purchases: { ...p.purchases, [item.id]: (p.purchases[item.id] ?? 0) + 1 } } : p,
      );
      const storeItems = state.storeItems.map((i) => (i.id === item.id && i.stock !== undefined ? { ...i, stock: i.stock - 1 } : i));
      return withLog({ ...state, storeItems }, players, logs);
    }

    case 'REQUEST_ORDER': {
      const item = state.storeItems.find((i) => i.id === action.order.itemId);
      const player = state.players.find((p) => p.id === action.order.playerId);
      if (!item || !player || orderBlock(state, item, player) || state.orders.some((o) => o.id === action.order.id)) return state;
      const order: StoreOrder = { ...action.order, price: item.price, at: Date.now(), status: 'pendente' };
      return withLog({ ...state, orders: [...state.orders, order] }, state.players, [
        entry('📝', `${player.codename} pediu "${item.name}" no Armazém (${item.price}).`),
      ]);
    }

    case 'RESOLVE_ORDER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order || order.status !== 'pendente') return state;
      const resolved: StoreOrder = {
        ...order,
        status: action.approve ? 'aprovado' : 'recusado',
        resolvedAt: Date.now(),
        resolvedBy: action.by,
        note: action.note.trim() || undefined,
      };
      const orders = state.orders.map((o) => (o.id === order.id ? resolved : o));
      if (!action.approve) return { ...state, orders };
      // Aprovado: a nota foi emitida e agora o dinheiro sai de fato da carteira.
      const item = state.storeItems.find((i) => i.id === order.itemId);
      const buyer = state.players.find((p) => p.id === order.playerId);
      if (!item || !buyer || buyerBlock({ ...item, price: order.price }, buyer)) return state;
      const players = state.players.map((p) =>
        p.id === buyer.id ? { ...p, dollars: p.dollars - order.price, purchases: { ...p.purchases, [item.id]: (p.purchases[item.id] ?? 0) + 1 } } : p,
      );
      const storeItems = state.storeItems.map((i) => (i.id === item.id && i.stock !== undefined ? { ...i, stock: i.stock - 1 } : i));
      return withLog({ ...state, orders, storeItems }, players, [entry('🛒', `${buyer.codename} trocou ${order.price} por "${item.name}" no Armazém do Saloon.`)]);
    }

    case 'ADJUST_DOLLARS': {
      const logs: LogEntry[] = [];
      const players = state.players.map((p) => {
        if (p.id !== action.playerId) return p;
        const sign = action.amount >= 0 ? '+' : '-';
        logs.push(entry('💵', `${p.codename}: ${sign}$${Math.abs(action.amount)}${action.reason ? ` (${action.reason})` : ''}.`));
        return { ...p, dollars: Math.max(0, p.dollars + Math.round(action.amount)) };
      });
      return withLog(state, players, logs);
    }

    case 'SAVE_MISSION': {
      const exists = state.missions.some((m) => m.id === action.mission.id);
      return settleAll({
        ...state,
        missions: exists
          ? state.missions.map((m) => (m.id === action.mission.id ? action.mission : m))
          : [...state.missions, action.mission],
      });
    }
    case 'REMOVE_MISSION':
      return settleAll({ ...state, missions: state.missions.filter((m) => m.id !== action.id) });

    case 'SAVE_ITEM': {
      const exists = state.storeItems.some((i) => i.id === action.item.id);
      const { stock, limit } = action.item;
      const item: StoreItem = {
        ...action.item,
        price: Math.max(1, whole(action.item.price)),
        stock: stock === undefined ? undefined : whole(stock),
        limit: limit === undefined ? undefined : Math.max(1, whole(limit)),
        cost: action.item.cost === undefined ? undefined : Math.max(0, Number(action.item.cost) || 0),
      };
      return {
        ...state,
        storeItems: exists ? state.storeItems.map((i) => (i.id === action.item.id ? item : i)) : [...state.storeItems, item],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, storeItems: state.storeItems.filter((i) => i.id !== action.id) };

    case 'IMPORT':
      return normalizeState(action.state);
    case 'RESET':
      return initialState();
  }
}
