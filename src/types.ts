export type MissionCategory = 'qualidade' | 'seguranca' | 'companheirismo' | 'espirito';

export type HairStyle =
  | 'curto'
  | 'longo'
  | 'rabo'
  | 'trancas'
  | 'cacheado'
  | 'careca'
  | 'coque'
  | 'moicano'
  | 'chanel'
  | 'blackpower'
  | 'topete'
  | 'chiquinha'
  | 'raspado'
  | 'repartido'
  | 'mullet'
  | 'ondulado';
export type EyeStyle = 'normal' | 'feliz' | 'piscando' | 'raivoso';
export type MouthStyle = 'sorriso' | 'normal' | 'dentes' | 'bravo';
export type FacialHair = 'nenhum' | 'bigode' | 'barba' | 'cavanhaque' | 'ferradura' | 'bigodao' | 'costeletas' | 'rala' | 'barbaLonga';

/** Estilo do personagem: libera as opções de cada estilo; "livre" libera todas. */
export type LookStyle = 'masculino' | 'feminino' | 'livre';

export type Makeup = 'cilios' | 'batom' | 'blush' | 'sombra' | 'delineado' | 'pinta';
export type HatStyle =
  | 'nenhum'
  | 'cowboy'
  | 'xerife'
  | 'coco'
  | 'ferroviario'
  | 'sombrero'
  | 'cartola'
  | 'palha'
  | 'boina'
  | 'capacete'
  | 'lenco'
  | 'gaucho';
export type TopStyle = 'camisa' | 'colete' | 'poncho' | 'casaco' | 'vestido' | 'saia' | 'xadrez' | 'suspensorio' | 'franjas' | 'avental' | 'macacao';
export type Accessory =
  | 'bandana'
  | 'estrela'
  | 'oculos'
  | 'gravata'
  | 'coldre'
  | 'laco'
  | 'tapaolho'
  | 'brincos'
  | 'colar'
  | 'relogio'
  | 'corda'
  | 'sardas'
  | 'esporas'
  | 'cartucheira'
  | 'luvas'
  | 'flor';

/** Visual do bonequinho, montado em camadas no AvatarFigure. */
export interface AvatarLook {
  style: LookStyle;
  makeup: Makeup[];
  mouth: MouthStyle;
  skin: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyes: EyeStyle;
  facialHair: FacialHair;
  hat: HatStyle;
  hatColor: string;
  top: TopStyle;
  topColor: string;
  accentColor: string;
  pantsColor: string;
  bootsColor: string;
  accessories: Accessory[];
}

export interface Avatar {
  id: string;
  name: string;
  icon: string;
  look: AvatarLook;
}

export interface Territory {
  id: number;
  name: string;
  icon: string;
  x: number;
  y: number;
}

export interface WordClue {
  word: string;
  hint: string;
}

/** Minijogo jogado para cumprir a missão, com o conteúdo cadastrado pela gestão. */
export type MissionGame =
  | { kind: 'forca'; words: WordClue[] }
  | { kind: 'memoria'; pairs: [string, string][] }
  | { kind: 'quiz'; questions: { question: string; options: string[]; answer: number }[]; minCorrect: number }
  | { kind: 'embaralhada'; words: WordClue[]; seconds: number }
  | { kind: 'ordem'; steps: string[] }
  | { kind: 'vf'; statements: { text: string; answer: boolean }[]; minCorrect: number; seconds: number }
  | { kind: 'tiro'; target: number; seconds: number }
  | { kind: 'duelo'; rounds: number; banditMs: number }
  | { kind: 'cacto'; count: number; seconds: number }
  | { kind: 'corrida'; rivals: number; speed: number };

export type GameKind = MissionGame['kind'];

export interface Mission {
  id: string;
  icon: string;
  name: string;
  description: string;
  reward: number;
  category: MissionCategory;
  game: MissionGame;
  /** Distintivo sugerido no fim da missão (sem valor = sugestão automática pela categoria). */
  badgeHint?: string;
  /** A gestão libera a missão para todos jogarem. */
  released?: boolean;
  /** Missão coletiva: concluída por todos os jogadores de uma vez. */
  collective?: boolean;
  /** Missão surpresa: liberta quem está "Fora da Lei". */
  surprise?: boolean;
  /** Território da missão (obrigatória para sair dele). Sem valor = extra, em qualquer lugar. */
  territory?: number;
}

export type CardId = 'cavalo' | 'ouro' | 'companheiro' | 'atalho' | 'foradalei';

export interface SpecialCard {
  id: CardId;
  icon: string;
  name: string;
  effect: string;
  needsTarget?: boolean;
}

export interface Player {
  id: string;
  /** Conta dona deste personagem (cada pessoa cuida só do seu). */
  userId?: string;
  realName: string;
  codename: string;
  /** Personagem (xerife, cowboy...), usado como título. */
  avatar: string;
  look: AvatarLook;
  /** Cor do personagem: marcador no mapa e fundo liso. */
  color: string;
  /** Cenário atrás do boneco (ver BACKDROPS). Sem valor = cor lisa. */
  backdrop?: string;
  territory: number;
  /** Missões de área já concluídas para o mapa (só sai do território com todas as da área). */
  cleared: string[];
  dollars: number;
  stars: number;
  outlaw: boolean;
  shortcuts: number;
  lastReward: number;
  missionsDone: Record<string, number>;
  /** Derrotas em cada missão antes de vencer (vencer de primeira vale mais pontos). */
  attempts: Record<string, number>;
  /** Quantas unidades de cada item do armazém a pessoa já trocou no ciclo. */
  purchases: Record<string, number>;
  /** Pontos para a premiação: vitórias nos minijogos + distintivos da gestão. */
  categoryPoints: Record<MissionCategory, number>;
}

/** Tipo de distintivo: uma atitude real no estoque que a gestão reconhece. */
export interface BadgeType {
  id: string;
  icon: string;
  name: string;
  description: string;
  /** O que mandar para a gestão conseguir confirmar (foto, nome de testemunha...). */
  proof: string;
  /** O pedido só pode ser enviado com foto. */
  photoRequired?: boolean;
  category: MissionCategory;
}

export type BadgeStatus = 'pendente' | 'aprovado' | 'recusado';

/** Distintivo pedido pelo jogador (com relato e foto opcional) ou dado direto pela gestão. */
export interface Badge {
  id: string;
  playerId: string;
  typeId: string;
  /** O que a pessoa fez. */
  reason: string;
  /** Foto enviada pelo jogador (fica no servidor; só a pessoa e a gestão veem). */
  photoId?: string;
  status: BadgeStatus;
  /** Quem iniciou: pedido do jogador ou entrega direta da gestão. */
  from: 'jogador' | 'gestao';
  at: number;
  reviewedAt?: number;
  /** Comentário da gestão ao aprovar ou recusar. */
  note?: string;
  /** Bônus em dólares dado junto com o distintivo. */
  dollars: number;
}

export interface StoreItem {
  id: string;
  icon: string;
  name: string;
  price: number;
  /** Unidades que ainda podem ser trocadas no ciclo. Sem valor = sem limite (prêmio sem custo). */
  stock?: number;
  /** Máximo que cada pessoa pode trocar deste item no ciclo. Sem valor = sem limite. */
  limit?: number;
  /** Quanto cada unidade custa para a empresa, em reais (para caber no orçamento do ciclo). */
  cost?: number;
}

export interface LogEntry {
  id: string;
  at: number;
  icon: string;
  text: string;
}

export type Role = 'admin' | 'player';

/** Dados públicos da conta logada (sem senha). */
export interface User {
  id: string;
  username: string;
  realName: string;
  role: Role;
}

/** Pedido de troca no Armazém: o jogador pede, a gestão emite a nota de consumo e aprova (só então o dinheiro sai). */
export interface StoreOrder {
  id: string;
  playerId: string;
  itemId: string;
  /** Preço no momento do pedido (é o que sai da carteira na aprovação). */
  price: number;
  at: number;
  status: 'pendente' | 'aprovado' | 'recusado';
  resolvedAt?: number;
  /** Quem da gestão resolveu. */
  resolvedBy?: string;
  note?: string;
}

export interface GameState {
  /** Versão da economia (valores em dólares); saves antigos são convertidos uma vez. */
  economy?: number;
  players: Player[];
  missions: Mission[];
  storeItems: StoreItem[];
  badges: Badge[];
  /** Pedidos de troca no Armazém, do mais antigo para o mais novo. */
  orders: StoreOrder[];
  log: LogEntry[];
}
