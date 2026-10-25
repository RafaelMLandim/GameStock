import type { Accessory, AvatarLook, EyeStyle, FacialHair, HairStyle, HatStyle, LookStyle, Makeup, MouthStyle, TopStyle } from './types';

/** Opção de personalização; `only` deixa a opção só no estilo masculino ou feminino (no livre, vale tudo). */
export interface LookOption<T extends string> {
  id: T;
  label: string;
  only?: Exclude<LookStyle, 'livre'>;
}

export const LOOK_STYLES: { id: LookStyle; label: string }[] = [
  { id: 'masculino', label: 'Masculino' },
  { id: 'feminino', label: 'Feminino' },
  { id: 'livre', label: 'Livre (todas as opções)' },
];

export const SKIN_TONES = ['#ffe0c4', '#f5c9a0', '#e0a87a', '#c68654', '#9a6238', '#6e4223'];
export const HAIR_COLORS = ['#1f1410', '#4a2c17', '#7b4a24', '#b5722f', '#e3b65c', '#a83a1e', '#9a9a9a', '#f2f0ea'];
export const CLOTH_COLORS = ['#b5442c', '#2c5fa8', '#3d7a2b', '#6b3e8b', '#c9971c', '#1c7a7a', '#6b3e1e', '#2b2b2b', '#e8e0cc', '#c43d6e'];
export const LEATHER_COLORS = ['#3b220f', '#6b3e1e', '#8b5a2b', '#2b2b2b', '#a87a4a', '#e8e0cc'];

export const HAIR_STYLES: LookOption<HairStyle>[] = [
  { id: 'curto', label: 'Curto' },
  { id: 'longo', label: 'Longo' },
  { id: 'rabo', label: 'Rabo de cavalo' },
  { id: 'trancas', label: 'Tranças', only: 'feminino' },
  { id: 'cacheado', label: 'Cacheado' },
  { id: 'careca', label: 'Careca', only: 'masculino' },
  { id: 'coque', label: 'Coque', only: 'feminino' },
  { id: 'moicano', label: 'Moicano', only: 'masculino' },
  { id: 'chanel', label: 'Chanel com franja', only: 'feminino' },
  { id: 'blackpower', label: 'Black power' },
  { id: 'topete', label: 'Topete', only: 'masculino' },
  { id: 'chiquinha', label: 'Maria-chiquinha', only: 'feminino' },
  { id: 'raspado', label: 'Raspado', only: 'masculino' },
  { id: 'repartido', label: 'Repartido de lado', only: 'masculino' },
  { id: 'mullet', label: 'Mullet', only: 'masculino' },
  { id: 'ondulado', label: 'Ondulado', only: 'feminino' },
];

export const EYE_STYLES: LookOption<EyeStyle>[] = [
  { id: 'normal', label: 'Atento' },
  { id: 'feliz', label: 'Feliz' },
  { id: 'piscando', label: 'Piscando' },
  { id: 'raivoso', label: 'Raivoso' },
];

export const MOUTHS: LookOption<MouthStyle>[] = [
  { id: 'sorriso', label: 'Sorrindo' },
  { id: 'normal', label: 'Normal' },
  { id: 'dentes', label: 'Mostrando os dentes' },
  { id: 'bravo', label: 'Bravo' },
];

export const FACIAL_HAIR: LookOption<FacialHair>[] = [
  { id: 'nenhum', label: 'Nenhum' },
  { id: 'bigode', label: 'Bigode', only: 'masculino' },
  { id: 'bigodao', label: 'Bigodão', only: 'masculino' },
  { id: 'ferradura', label: 'Bigode ferradura', only: 'masculino' },
  { id: 'cavanhaque', label: 'Cavanhaque', only: 'masculino' },
  { id: 'costeletas', label: 'Costeletas', only: 'masculino' },
  { id: 'rala', label: 'Barba rala', only: 'masculino' },
  { id: 'barba', label: 'Barba', only: 'masculino' },
  { id: 'barbaLonga', label: 'Barba longa', only: 'masculino' },
];

export const MAKEUP: LookOption<Makeup>[] = [
  { id: 'cilios', label: 'Cílios', only: 'feminino' },
  { id: 'batom', label: 'Batom', only: 'feminino' },
  { id: 'blush', label: 'Blush', only: 'feminino' },
  { id: 'sombra', label: 'Sombra', only: 'feminino' },
  { id: 'delineado', label: 'Delineado', only: 'feminino' },
  { id: 'pinta', label: 'Pinta', only: 'feminino' },
];

export const HATS: LookOption<HatStyle>[] = [
  { id: 'nenhum', label: 'Sem chapéu' },
  { id: 'cowboy', label: 'Cowboy' },
  { id: 'xerife', label: 'Xerife' },
  { id: 'coco', label: 'Chapéu-coco' },
  { id: 'ferroviario', label: 'Boné ferroviário' },
  { id: 'sombrero', label: 'Sombrero' },
  { id: 'cartola', label: 'Cartola' },
  { id: 'palha', label: 'Chapéu de palha' },
  { id: 'boina', label: 'Boina' },
  { id: 'capacete', label: 'Capacete de minerador' },
  { id: 'lenco', label: 'Lenço na cabeça' },
  { id: 'gaucho', label: 'Chapéu gaúcho' },
];

export const TOPS: LookOption<TopStyle>[] = [
  { id: 'camisa', label: 'Camisa' },
  { id: 'colete', label: 'Colete' },
  { id: 'poncho', label: 'Poncho' },
  { id: 'casaco', label: 'Casaco longo' },
  { id: 'vestido', label: 'Vestido', only: 'feminino' },
  { id: 'saia', label: 'Blusa e saia', only: 'feminino' },
  { id: 'xadrez', label: 'Camisa xadrez' },
  { id: 'suspensorio', label: 'Suspensório' },
  { id: 'franjas', label: 'Jaqueta de franjas' },
  { id: 'avental', label: 'Avental' },
  { id: 'macacao', label: 'Jardineira' },
];

export const ACCESSORIES: LookOption<Accessory>[] = [
  { id: 'bandana', label: 'Bandana' },
  { id: 'estrela', label: 'Estrela de xerife' },
  { id: 'oculos', label: 'Óculos' },
  { id: 'gravata', label: 'Gravata-borboleta' },
  { id: 'coldre', label: 'Coldre' },
  { id: 'laco', label: 'Laço no cabelo', only: 'feminino' },
  { id: 'flor', label: 'Flor no cabelo', only: 'feminino' },
  { id: 'tapaolho', label: 'Tapa-olho' },
  { id: 'brincos', label: 'Brincos' },
  { id: 'colar', label: 'Colar' },
  { id: 'sardas', label: 'Sardas' },
  { id: 'cartucheira', label: 'Cartucheira' },
  { id: 'relogio', label: 'Relógio de bolso' },
  { id: 'corda', label: 'Corda de laçar' },
  { id: 'luvas', label: 'Luvas' },
  { id: 'esporas', label: 'Esporas' },
];

/** Acessórios presos no cabelo: só aparecem sem chapéu. */
export const HAIR_ACCESSORIES: readonly string[] = ['laco', 'flor'];

export const DEFAULT_LOOK: AvatarLook = {
  style: 'livre',
  makeup: [],
  mouth: 'sorriso',
  skin: SKIN_TONES[1],
  hairStyle: 'curto',
  hairColor: HAIR_COLORS[1],
  eyes: 'normal',
  facialHair: 'nenhum',
  hat: 'cowboy',
  hatColor: LEATHER_COLORS[2],
  top: 'camisa',
  topColor: CLOTH_COLORS[0],
  accentColor: CLOTH_COLORS[8],
  pantsColor: CLOTH_COLORS[1],
  bootsColor: LEATHER_COLORS[0],
  accessories: ['bandana'],
};

/** Opções que o estilo libera (no livre, todas). */
export function optionsFor<T extends string>(options: LookOption<T>[], style: LookStyle): LookOption<T>[] {
  return style === 'livre' ? options : options.filter((o) => !o.only || o.only === style);
}

function allowed<T extends string>(options: LookOption<T>[], id: T, style: LookStyle): boolean {
  return optionsFor(options, style).some((o) => o.id === id);
}

/** Tira do visual o que o estilo não oferece (ex.: barba no feminino, maquiagem no masculino). */
export function fitLook(look: AvatarLook): AvatarLook {
  const { style } = look;
  return {
    ...look,
    hairStyle: allowed(HAIR_STYLES, look.hairStyle, style) ? look.hairStyle : style === 'feminino' ? 'longo' : 'curto',
    facialHair: allowed(FACIAL_HAIR, look.facialHair, style) ? look.facialHair : 'nenhum',
    top: allowed(TOPS, look.top, style) ? look.top : 'camisa',
    accessories: look.accessories.filter((a) => allowed(ACCESSORIES, a, style)),
    makeup: look.makeup.filter((m) => allowed(MAKEUP, m, style)),
  };
}

type SavedLook = Partial<AvatarLook> & { sex?: string; lashes?: boolean; lipstick?: boolean };

/**
 * Completa um visual salvo por versões antigas: "sexo" vira o estilo, cílios viram maquiagem
 * e o batom antigo saiu; quem tinha olhos raivosos antes da escolha de boca fica com a boca brava.
 */
export function normalizeLook(look: SavedLook): AvatarLook {
  const { sex, lashes, lipstick: _lipstick, ...rest } = look;
  const style: LookStyle = rest.style ?? (sex === 'feminino' ? 'feminino' : sex === 'masculino' ? 'masculino' : 'livre');
  const makeup: Makeup[] = rest.makeup ?? (lashes || sex === 'feminino' ? ['cilios'] : []);
  const mouth = rest.mouth ?? (rest.eyes === 'raivoso' ? 'bravo' : 'sorriso');
  return fitLook({ ...DEFAULT_LOOK, ...rest, style, makeup, mouth });
}

export function makeLook(overrides: Partial<AvatarLook>): AvatarLook {
  return normalizeLook({ ...DEFAULT_LOOK, ...overrides });
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomLook(style: LookStyle): AvatarLook {
  const some = <T extends string>(options: LookOption<T>[], chance: number) =>
    optionsFor(options, style)
      .map((o) => o.id)
      .filter(() => Math.random() < chance);
  const beards = optionsFor(FACIAL_HAIR, style).filter((f) => f.id !== 'nenhum');
  return {
    style,
    makeup: some(MAKEUP, 0.4),
    mouth: pick(MOUTHS.filter((m) => m.id !== 'bravo')).id,
    skin: pick(SKIN_TONES),
    hairStyle: pick(optionsFor(HAIR_STYLES, style)).id,
    hairColor: pick(HAIR_COLORS),
    eyes: pick(EYE_STYLES).id,
    facialHair: beards.length && Math.random() < 0.5 ? pick(beards).id : 'nenhum',
    hat: pick(HATS).id,
    hatColor: pick(LEATHER_COLORS),
    top: pick(optionsFor(TOPS, style)).id,
    topColor: pick(CLOTH_COLORS),
    accentColor: pick(CLOTH_COLORS),
    pantsColor: pick(CLOTH_COLORS),
    bootsColor: pick(LEATHER_COLORS),
    accessories: some(ACCESSORIES, 0.3),
  };
}
