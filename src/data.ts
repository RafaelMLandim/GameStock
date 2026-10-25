import { makeLook } from './avatar';
import type { Avatar, BadgeType, GameState, Mission, MissionCategory, MissionGame, SpecialCard, StoreItem, Territory, WordClue } from './types';

/** Personagens: cada um traz um visual inicial que o jogador pode personalizar. */
export const AVATARS: Avatar[] = [
  { id: 'xerife', name: 'Xerife', icon: '⭐', look: makeLook({ hat: 'xerife', hatColor: '#a87a4a', top: 'colete', topColor: '#e8e0cc', accentColor: '#6b3e1e', facialHair: 'bigode', accessories: ['estrela', 'coldre'] }) },
  { id: 'cacadora', name: 'Caçadora de Recompensas', icon: '🎯', look: makeLook({ style: 'feminino', makeup: ['cilios', 'batom'], hairStyle: 'longo', hairColor: '#1f1410', hat: 'cowboy', hatColor: '#2b2b2b', top: 'casaco', topColor: '#6b3e1e', accentColor: '#b5442c', pantsColor: '#2b2b2b', accessories: ['coldre'] }) },
  { id: 'cowboy', name: 'Cowboy', icon: '🤠', look: makeLook({}) },
  { id: 'pistoleira', name: 'Pistoleira', icon: '🔫', look: makeLook({ style: 'feminino', makeup: ['cilios', 'batom'], hairStyle: 'rabo', hairColor: '#a83a1e', eyes: 'piscando', hat: 'cowboy', hatColor: '#3b220f', top: 'colete', topColor: '#e8e0cc', accentColor: '#2b2b2b', accessories: ['bandana', 'coldre'] }) },
  { id: 'explorador', name: 'Explorador', icon: '🧭', look: makeLook({ hairColor: '#b5722f', facialHair: 'barba', hat: 'cowboy', hatColor: '#a87a4a', top: 'camisa', topColor: '#3d7a2b', pantsColor: '#8b5a2b', accessories: ['bandana'] }) },
  { id: 'comerciante', name: 'Comerciante', icon: '💰', look: makeLook({ hat: 'coco', hatColor: '#2b2b2b', top: 'colete', topColor: '#e8e0cc', accentColor: '#6b3e8b', facialHair: 'bigode', accessories: ['gravata', 'oculos'] }) },
  { id: 'ferroviario', name: 'Ferroviário', icon: '🚂', look: makeLook({ hat: 'ferroviario', hatColor: '#2c5fa8', top: 'camisa', topColor: '#2c5fa8', pantsColor: '#2c5fa8', accentColor: '#b5442c', accessories: ['bandana'] }) },
  { id: 'minerador', name: 'Minerador', icon: '⛏️', look: makeLook({ hairStyle: 'careca', facialHair: 'barba', hairColor: '#1f1410', hat: 'nenhum', top: 'camisa', topColor: '#c9971c', pantsColor: '#6b3e1e', accessories: [] }) },
  { id: 'ferreiro', name: 'Ferreiro', icon: '🔨', look: makeLook({ skin: '#9a6238', hairStyle: 'cacheado', hairColor: '#1f1410', hat: 'nenhum', top: 'colete', topColor: '#e8e0cc', accentColor: '#3b220f', pantsColor: '#2b2b2b', accessories: [] }) },
  { id: 'cozinheira', name: 'Cozinheira do Rancho', icon: '🍳', look: makeLook({ style: 'feminino', makeup: ['cilios', 'batom'], skin: '#c68654', hairStyle: 'trancas', eyes: 'feliz', hat: 'nenhum', top: 'vestido', topColor: '#c43d6e', accentColor: '#e8e0cc', accessories: ['laco'] }) },
  { id: 'telegrafista', name: 'Telegrafista', icon: '📡', look: makeLook({ hairStyle: 'curto', hat: 'nenhum', top: 'camisa', topColor: '#e8e0cc', accentColor: '#2b2b2b', pantsColor: '#2b2b2b', accessories: ['oculos', 'gravata'] }) },
  { id: 'domador', name: 'Domador de Cavalos', icon: '🐎', look: makeLook({ skin: '#e0a87a', hairStyle: 'longo', hat: 'sombrero', hatColor: '#c9971c', top: 'poncho', topColor: '#b5442c', accentColor: '#c9971c', accessories: [] }) },
];

export const PLAYER_COLORS = ['#b5442c', '#2c6fb5', '#3d8b3d', '#8b3d8b', '#c48a1c', '#1c8b8b', '#6b4a2b', '#c43d6e', '#4a4a8b', '#5b7a1c'];

export const TERRITORIES: Territory[] = [
  { id: 0, name: 'Acampamento', icon: '🔥', x: 90, y: 500 },
  { id: 1, name: 'Vila dos Pioneiros', icon: '🏘️', x: 250, y: 420 },
  { id: 2, name: 'Estação Ferroviária', icon: '🚉', x: 200, y: 250 },
  { id: 3, name: 'Mina de Ouro', icon: '⛏️', x: 380, y: 140 },
  { id: 4, name: 'Desfiladeiro', icon: '🏜️', x: 540, y: 290 },
  { id: 5, name: 'Forte da Companhia', icon: '🏰', x: 700, y: 450 },
  { id: 6, name: 'Cidade do Oeste', icon: '🌆', x: 820, y: 280 },
  { id: 7, name: 'Saloon dos Campeões', icon: '🏆', x: 900, y: 110 },
];

export const LAST_TERRITORY = TERRITORIES.length - 1;

export const CATEGORY_LABELS: Record<MissionCategory, string> = {
  qualidade: 'Qualidade',
  seguranca: 'Segurança',
  companheirismo: 'Companheirismo',
  espirito: 'Espírito do Oeste',
};

const words = (...list: [string, string][]): WordClue[] => list.map(([word, hint]) => ({ word, hint }));
/** Pergunta de quiz: a primeira alternativa é a certa (o jogo embaralha na hora). */
const q = (question: string, answer: string, ...wrong: string[]) => ({ question, options: [answer, ...wrong], answer: 0 });
const vf = (answer: boolean, text: string) => ({ text, answer });

/** Dólares por missão vencida (só na primeira vitória). */
export const MISSION_REWARD = 1;

function mission(
  territory: number | undefined,
  id: string,
  icon: string,
  name: string,
  description: string,
  reward: number,
  category: MissionCategory,
  game: MissionGame,
  extra: Partial<Mission> = {},
): Mission {
  return { id, icon, name, description, reward, category, game, territory, released: false, ...extra };
}

/** 4 minijogos por território (obrigatórios para seguir viagem) + extras em qualquer lugar. */
export const DEFAULT_MISSIONS: Mission[] = [
  // 1. Acampamento
  mission(0, 'acamp-forca', '💀', 'A Forca do Acampamento', 'Descubra a palavra do estoque antes que a corda aperte.', MISSION_REWARD, 'qualidade', {
    kind: 'forca',
    words: words(
      ['ESTOQUE', 'Onde guardamos tudo que chega'],
      ['PALETE', 'Base de madeira para empilhar a carga'],
      ['FEFO', 'Primeiro que vence, primeiro que sai'],
      ['ETIQUETA', 'Identifica o produto na prateleira'],
    ),
  }),
  mission(0, 'acamp-memoria', '🃏', 'Memória do Pioneiro', 'Encontre os pares de figuras do Velho Oeste.', MISSION_REWARD, 'espirito', {
    kind: 'memoria',
    pairs: [
      ['🤠', '🤠'],
      ['🐎', '🐎'],
      ['🌵', '🌵'],
      ['⭐', '⭐'],
      ['💰', '💰'],
      ['🔥', '🔥'],
    ],
  }),
  mission(0, 'acamp-quiz', '⭐', 'O Código do Oeste', 'Responda às perguntas básicas do nosso estoque. Acerte 3 de 4.', MISSION_REWARD, 'qualidade', {
    kind: 'quiz',
    minCorrect: 3,
    questions: [
      q('O que significa FEFO?', 'Primeiro que vence, primeiro que sai', 'Primeiro que entra, primeiro que sai', 'Último que chega, primeiro que sai'),
      q('O que é EPI?', 'Equipamento de Proteção Individual', 'Estoque de Peças Importadas', 'Etiqueta de Produto Identificado'),
      q('Encontrou um produto avariado. O que fazer?', 'Separar e avisar o responsável', 'Guardar no meio dos outros', 'Jogar fora sem avisar'),
      q('Para que serve o endereçamento no estoque?', 'Saber exatamente onde cada produto está', 'Enfeitar as prateleiras', 'Contar quantas pessoas trabalham no setor'),
    ],
  }),
  mission(0, 'acamp-duelo', '🔫', 'Duelo ao Meio-Dia', 'Espere o sino e saque mais rápido que o bandido. Vença 2 de 3.', MISSION_REWARD, 'espirito', {
    kind: 'duelo',
    rounds: 3,
    banditMs: 650,
  }),

  // 2. Vila dos Pioneiros
  mission(1, 'vila-embaralhada', '🔤', 'Letras Fora da Lei', 'Desembaralhe as palavras antes que o sol se ponha.', MISSION_REWARD, 'qualidade', {
    kind: 'embaralhada',
    seconds: 90,
    words: words(['CAIXA', 'Embalagem de papelão'], ['CONFERIR', 'Verificar se está tudo certo'], ['VALIDADE', 'Data limite do produto']),
  }),
  mission(1, 'vila-tiro', '🎯', 'Tiro ao Alvo na Vila', 'Acerte as garrafas na cerca: 12 acertos em 30 segundos.', MISSION_REWARD, 'espirito', {
    kind: 'tiro',
    target: 12,
    seconds: 30,
  }),
  mission(1, 'vila-vf', '⚖️', 'Verdade ou Mentira, Forasteiro?', 'Responda V ou F antes do relógio acabar. Acerte 4 de 5.', MISSION_REWARD, 'seguranca', {
    kind: 'vf',
    seconds: 8,
    minCorrect: 4,
    statements: [
      vf(true, 'Corredores devem ficar livres de caixas e obstáculos.'),
      vf(false, 'Pode passar por baixo de uma carga suspensa se for rápido.'),
      vf(true, 'O produto com validade mais próxima deve sair primeiro.'),
      vf(false, 'Usar EPI é opcional quando o serviço é rápido.'),
      vf(true, 'Pisos molhados devem ser sinalizados.'),
    ],
  }),
  mission(1, 'vila-memoria', '🧩', 'Pares da Segurança', 'Ligue cada EPI à parte do corpo que ele protege.', MISSION_REWARD, 'seguranca', {
    kind: 'memoria',
    pairs: [
      ['⛑️ Capacete', 'Cabeça'],
      ['🧤 Luva', 'Mãos'],
      ['🥾 Bota de segurança', 'Pés'],
      ['🥽 Óculos de proteção', 'Olhos'],
      ['🎧 Protetor auricular', 'Ouvidos'],
    ],
  }),

  // 3. Estação Ferroviária
  mission(2, 'estacao-ordem', '🚂', 'O Trem do Recebimento', 'Coloque as etapas do recebimento na ordem certa.', MISSION_REWARD, 'qualidade', {
    kind: 'ordem',
    steps: ['Conferir a nota fiscal', 'Descarregar a mercadoria', 'Conferir quantidade e validade', 'Registrar no sistema', 'Guardar no endereço certo'],
  }),
  mission(2, 'estacao-corrida', '🐎', 'Corrida até a Estação', 'Galope alternando os botões e chegue antes dos rivais.', MISSION_REWARD, 'espirito', {
    kind: 'corrida',
    rivals: 3,
    speed: 1,
  }),
  mission(2, 'estacao-forca', '💀', 'Forca da Ferrovia', 'Descubra a palavra antes que o trem passe.', MISSION_REWARD, 'qualidade', {
    kind: 'forca',
    words: words(
      ['INVENTÁRIO', 'Contagem de tudo que tem no estoque'],
      ['EMPILHADEIRA', 'Máquina que levanta paletes'],
      ['DOCA', 'Onde o caminhão encosta para carregar'],
      ['PEDIDO', 'O que o cliente quer receber'],
    ),
  }),
  mission(2, 'estacao-quiz', '🎫', 'Quiz do Bilheteiro', 'Perguntas sobre separação e expedição. Acerte 3 de 4.', MISSION_REWARD, 'qualidade', {
    kind: 'quiz',
    minCorrect: 3,
    questions: [
      q('Como se chama a separação dos itens de um pedido?', 'Picking', 'Pedágio', 'Pintura'),
      q('Antes de carregar o caminhão, o pedido deve ser...', 'Conferido', 'Escondido', 'Desmontado'),
      q('O que fazer ao achar diferença no inventário?', 'Registrar e avisar para investigar', 'Ignorar', 'Ajustar sem contar a ninguém'),
      q('Qual a forma correta de levantar uma caixa pesada?', 'Dobrar os joelhos e manter a coluna reta', 'Curvar a coluna e puxar rápido', 'Levantar com um braço só'),
    ],
  }),

  // 4. Mina de Ouro
  mission(3, 'mina-cacto', '🌵', 'Caça ao Cacto na Mina', 'Encontre os 5 cactos escondidos antes do tempo acabar.', MISSION_REWARD, 'espirito', {
    kind: 'cacto',
    count: 5,
    seconds: 40,
  }),
  mission(3, 'mina-memoria', '💰', 'Memória do Garimpeiro', 'Ligue cada termo do estoque ao seu significado.', MISSION_REWARD, 'qualidade', {
    kind: 'memoria',
    pairs: [
      ['FEFO', 'Vence primeiro, sai primeiro'],
      ['FIFO', 'Entra primeiro, sai primeiro'],
      ['Inventário', 'Contagem do estoque'],
      ['Picking', 'Separação de pedidos'],
      ['Avaria', 'Produto danificado'],
      ['Endereço', 'Local do produto no estoque'],
    ],
  }),
  mission(3, 'mina-embaralhada', '⛏️', 'Pepitas Embaralhadas', 'Desembaralhe as palavras antes que o lampião apague.', MISSION_REWARD, 'seguranca', {
    kind: 'embaralhada',
    seconds: 90,
    words: words(['SEGURANÇA', 'Vem sempre em primeiro lugar'], ['LOTE', 'Grupo de produtos fabricados juntos'], ['AVARIA', 'Produto danificado']),
  }),
  mission(3, 'mina-vf', '🥇', 'Ouro ou Pedra?', 'Verdadeiro (ouro) ou falso (pedra)? Acerte 4 de 5.', MISSION_REWARD, 'seguranca', {
    kind: 'vf',
    seconds: 8,
    minCorrect: 4,
    statements: [
      vf(true, 'O número do lote ajuda a rastrear um produto.'),
      vf(false, 'Empilhar paletes acima do limite indicado não tem problema.'),
      vf(true, 'Etiqueta ilegível deve ser trocada.'),
      vf(false, 'FIFO e FEFO são exatamente a mesma coisa.'),
      vf(true, 'Extintores devem ficar sempre desobstruídos.'),
    ],
  }),

  // 5. Desfiladeiro
  mission(4, 'desf-duelo', '🔫', 'Duelo no Desfiladeiro', 'O bandido daqui é mais rápido. Vença 2 de 3.', MISSION_REWARD, 'espirito', {
    kind: 'duelo',
    rounds: 3,
    banditMs: 500,
  }),
  mission(4, 'desf-ordem', '🧹', 'A Trilha do 5S', 'Coloque os 5 sensos na ordem certa.', MISSION_REWARD, 'qualidade', {
    kind: 'ordem',
    steps: ['Seleção (Seiri)', 'Ordenação (Seiton)', 'Limpeza (Seiso)', 'Padronização (Seiketsu)', 'Disciplina (Shitsuke)'],
  }),
  mission(4, 'desf-quiz', '🦅', 'Quiz do Desfiladeiro', 'Perguntas sobre empilhadeira e riscos. Acerte 3 de 4.', MISSION_REWARD, 'seguranca', {
    kind: 'quiz',
    minCorrect: 3,
    questions: [
      q('Qual a velocidade certa da empilhadeira perto de pedestres?', 'Reduzida, com atenção', 'A máxima, para terminar logo', 'Tanto faz'),
      q('Como transportar a carga na empilhadeira?', 'Com os garfos baixos', 'Com os garfos bem altos', 'Com a carga inclinada para a frente'),
      q('Quem pode operar a empilhadeira?', 'Somente operador treinado e autorizado', 'Qualquer pessoa', 'Quem chegar primeiro'),
      q('O que fazer ao ver um risco no setor?', 'Avisar e sinalizar o local', 'Fingir que não viu', 'Deixar para o próximo turno'),
    ],
  }),
  mission(4, 'desf-tiro', '🎯', 'Tiro no Cânion', 'Acerte 16 garrafas em 30 segundos.', MISSION_REWARD, 'espirito', {
    kind: 'tiro',
    target: 16,
    seconds: 30,
  }),

  // 6. Forte da Companhia
  mission(5, 'forte-forca', '💀', 'Forca do Forte', 'Palavras da segurança do forte.', MISSION_REWARD, 'seguranca', {
    kind: 'forca',
    words: words(
      ['EXTINTOR', 'Combate o princípio de incêndio'],
      ['SINALIZAÇÃO', 'Placas e faixas que orientam'],
      ['ROTA DE FUGA', 'Caminho para sair numa emergência'],
      ['CONE', 'Usado para isolar uma área'],
    ),
  }),
  mission(5, 'forte-vf', '🛡️', 'Sentinela do Forte', 'V ou F, mais rápido agora. Acerte 4 de 5.', MISSION_REWARD, 'seguranca', {
    kind: 'vf',
    seconds: 7,
    minCorrect: 4,
    statements: [
      vf(true, 'Saídas de emergência nunca devem ser bloqueadas.'),
      vf(false, 'Pode usar o celular enquanto dirige a empilhadeira.'),
      vf(true, 'Todo acidente ou quase acidente deve ser comunicado.'),
      vf(true, 'Ferramentas devem voltar ao lugar depois do uso.'),
      vf(false, 'Produtos químicos podem ficar junto com alimentos.'),
    ],
  }),
  mission(5, 'forte-corrida', '🐎', 'Cavalaria do Forte', 'Os cavalos da cavalaria são mais rápidos. Vença a corrida!', MISSION_REWARD, 'espirito', {
    kind: 'corrida',
    rivals: 3,
    speed: 1.3,
  }),
  mission(5, 'forte-memoria', '🚧', 'Memória das Placas', 'Ligue cada placa ao seu significado.', MISSION_REWARD, 'seguranca', {
    kind: 'memoria',
    pairs: [
      ['🧯', 'Extintor'],
      ['🚑', 'Primeiros socorros'],
      ['🚷', 'Proibida a passagem'],
      ['⚠️', 'Atenção, risco'],
      ['🚪', 'Saída de emergência'],
      ['👷', 'Use o EPI'],
    ],
  }),

  // 7. Cidade do Oeste
  mission(6, 'cidade-embaralhada', '📰', 'Jornal da Cidade', 'Desembaralhe as manchetes antes do jornal sair.', MISSION_REWARD, 'companheirismo', {
    kind: 'embaralhada',
    seconds: 80,
    words: words(
      ['CLIENTE', 'Para quem fazemos tudo isso'],
      ['EXPEDIÇÃO', 'Setor que envia os pedidos'],
      ['QUALIDADE', 'Fazer certo da primeira vez'],
      ['EQUIPE', 'Ninguém vence sozinho'],
    ),
  }),
  mission(6, 'cidade-cacto', '🌵', 'Caça ao Cacto na Cidade', 'Agora são 7 cactos escondidos. Ache todos!', MISSION_REWARD, 'espirito', {
    kind: 'cacto',
    count: 7,
    seconds: 40,
  }),
  mission(6, 'cidade-quiz', '🏦', 'Quiz do Banco', 'Perguntas para quem quer virar lenda. Acerte 3 de 4.', MISSION_REWARD, 'companheirismo', {
    kind: 'quiz',
    minCorrect: 3,
    questions: [
      q('O que é a curva ABC no estoque?', 'Classificar os itens pela importância e giro', 'Um tipo de corredor curvo', 'O alfabeto da etiqueta'),
      q('Por que manter o estoque organizado?', 'Achar rápido e evitar erros e perdas', 'Só para ficar bonito', 'Não faz diferença'),
      q('O que é um quase acidente?', 'Situação que poderia ter causado um acidente', 'Um acidente sem importância', 'Um acidente fora do trabalho'),
      q('Qual atitude é de um bom companheiro de trabalho?', 'Ajudar o colega e compartilhar o que sabe', 'Esconder informação', 'Deixar o problema para o próximo turno'),
    ],
  }),
  mission(6, 'cidade-ordem', '📦', 'A Rota do Pedido', 'Ordene o caminho de um pedido até o cliente.', MISSION_REWARD, 'qualidade', {
    kind: 'ordem',
    steps: ['Receber o pedido', 'Separar os itens (picking)', 'Conferir os itens', 'Embalar e identificar', 'Carregar e expedir'],
  }),

  // 8. Saloon dos Campeões (desafios das Lendas: cada vitória vale uma estrela)
  mission(7, 'saloon-duelo', '🔫', 'O Duelo Final', 'O bandido mais rápido do Oeste. Vença 3 de 5.', MISSION_REWARD, 'espirito', {
    kind: 'duelo',
    rounds: 5,
    banditMs: 420,
  }),
  mission(7, 'saloon-tiro', '🎯', 'Tiro de Campeão', 'Acerte 20 garrafas em 30 segundos.', MISSION_REWARD, 'espirito', {
    kind: 'tiro',
    target: 20,
    seconds: 30,
  }),
  mission(7, 'saloon-forca', '💀', 'A Forca da Lenda', 'As palavras mais difíceis do Oeste.', MISSION_REWARD, 'companheirismo', {
    kind: 'forca',
    words: words(
      ['LENDA', 'Quem chega ao Saloon dos Campeões'],
      ['XERIFE', 'Guardião da lei na cidade'],
      ['COMPANHEIRISMO', 'Espírito de quem ajuda os colegas'],
      ['DILIGÊNCIA', 'Carruagem do Velho Oeste'],
    ),
  }),
  mission(7, 'saloon-vf', '🍻', 'Rodada no Saloon', 'Seis afirmações, 6 segundos cada. Acerte 5.', MISSION_REWARD, 'seguranca', {
    kind: 'vf',
    seconds: 6,
    minCorrect: 5,
    statements: [
      vf(true, 'FEFO prioriza a data de validade.'),
      vf(false, 'O extintor pode ficar atrás dos paletes.'),
      vf(true, 'O 5S começa pela Seleção (Seiri).'),
      vf(false, 'Inventário só precisa ser feito quando sobra tempo.'),
      vf(true, 'A carga na empilhadeira deve ir com os garfos baixos.'),
      vf(true, 'Comunicar um quase acidente ajuda a evitar acidentes.'),
    ],
  }),

  // Extra: missão surpresa, vale em qualquer lugar e liberta quem está Fora da Lei.
  mission(
    undefined,
    'procurado',
    '🔥',
    'Procurado!',
    'Cartaz surpresa: acerte as 3 perguntas para ganhar a recompensa.',
    MISSION_REWARD,
    'qualidade',
    {
      kind: 'quiz',
      minCorrect: 3,
      questions: [
        q('Qual é a primeira etapa do 5S?', 'Seleção (Seiri)', 'Limpeza (Seiso)', 'Disciplina (Shitsuke)'),
        q('O que FIFO significa?', 'Primeiro que entra, primeiro que sai', 'Primeiro que vence, primeiro que sai', 'Fila de itens fora de ordem'),
        q('Onde o extintor deve ficar?', 'Sinalizado e desobstruído', 'Escondido atrás das caixas', 'Trancado no escritório'),
      ],
    },
    { surprise: true },
  ),
];

export const SPECIAL_CARDS: SpecialCard[] = [
  { id: 'cavalo', icon: '🐎', name: 'Cavalo Veloz', effect: 'Pule a próxima missão pendente da sua área.' },
  { id: 'ouro', icon: '💰', name: 'Ouro Encontrado', effect: 'Ganhe $100.' },
  { id: 'companheiro', icon: '🤝', name: 'Velho Companheiro', effect: 'Escolha alguém para receber o mesmo bônus que você.', needsTarget: true },
  { id: 'atalho', icon: '🗺️', name: 'Atalho do Desfiladeiro', effect: 'Pule uma missão comum (guarde e use quando quiser).' },
  { id: 'foradalei', icon: '☠️', name: 'Fora da Lei', effect: 'Complete uma missão surpresa para continuar sua jornada.' },
];

/**
 * Armazém da Brasal com preços da época (quem tinha $100 era rei). Cada missão paga $1 e cada área tem 4:
 * o item mais barato custa $8, então só dá para trocar depois de vencer as duas primeiras áreas.
 * Quem vence as 33 missões junta $33 (o brinde). O estoque soma uns R$ 5.000 para 200 pessoas no ciclo de
 * 3 meses (lata R$ 4, energético R$ 8, 2 litros R$ 9, brinde R$ 25).
 */
export const DEFAULT_STORE: StoreItem[] = [
  { id: 'refri-lata', icon: '🥫', name: 'Refrigerante lata', price: 8, stock: 300, limit: 3, cost: 4 },
  { id: 'energetico', icon: '⚡', name: 'Energético', price: 14, stock: 150, limit: 2, cost: 8 },
  { id: 'refri-2l', icon: '🥤', name: 'Refrigerante 2 litros', price: 16, stock: 160, limit: 2, cost: 9 },
  { id: 'brinde', icon: '🎁', name: 'Brinde personalizado', price: 33, stock: 46, limit: 1, cost: 25 },
];

/** Quanto a empresa pode gastar com o armazém em cada ciclo de 3 meses (R$ 25 por pessoa, 200 pessoas). */
export const CYCLE_BUDGET = 5000;

/** Menor e maior preço que fazem sentido: $8 = duas áreas vencidas; $33 = a jornada inteira. */
export const MIN_ITEM_PRICE = 8;
export const MAX_ITEM_PRICE = 33;

/** Preço sugerido para um item novo a partir do custo em reais, na mesma escala dos itens padrão. */
export function suggestPrice(cost: number): number {
  return Math.min(MAX_ITEM_PRICE, Math.max(MIN_ITEM_PRICE, Math.round(cost * 1.6 + 2)));
}

/** Ícones para escolher ao criar um item (só emojis que aparecem bem em qualquer celular). */
export const ITEM_ICONS = [
  '🥫', '🥤', '🧃', '☕', '🍵', '🥛', '🍫', '🍬', '🍭', '🍪', '🍩', '🍰', '🧁', '🍦', '🍿', '🥨',
  '🍕', '🍔', '🌭', '🥪', '🍎', '🍉', '🍽️', '🎁', '🎟️', '🎫', '👕', '🧢', '🧦', '🎒', '☂️', '⌚',
  '🎧', '🔋', '🖊️', '📒', '🏆', '🥇', '⭐', '🎉', '🎈', '🧸', '⚽', '🎮', '🛒', '⛽', '🚗', '💈',
];

/** Itens padrão que saíram do armazém quando ele passou a ter os produtos da Brasal. */
export const RETIRED_STORE = ['chocolate', 'refri', 'sobremesa', 'musica', 'prioridade', 'cerveja'];

/** Pontos de categoria por vitória num minijogo: de primeira vale mais. */
export const WIN_POINTS = [3, 2, 1];
/** Um distintivo vale mais que um minijogo: é atitude de verdade no estoque. */
export const BADGE_POINTS = 5;
/** Cada tipo de distintivo de uma categoria dá pontos extras nas vitórias daquela categoria, até o limite. */
export const BADGE_WIN_BONUS = 1;
export const MAX_BADGE_WIN_BONUS = 2;
/** Quantos pedidos de distintivo um jogador pode ter esperando a gestão. */
export const MAX_PENDING_BADGES = 3;

/** Cada distintivo diz como comprovar, para a gestão ter algo concreto para aprovar. */
export const BADGE_TYPES: BadgeType[] = [
  {
    id: 'olho-de-aguia',
    icon: '🦅',
    name: 'Olho de Águia',
    description: 'Viu um risco ou quase acidente e avisou.',
    proof: 'Foto do risco (de preferência antes e depois) e a quem você avisou.',
    photoRequired: true,
    category: 'seguranca',
  },
  {
    id: 'guardiao-epi',
    icon: '👷',
    name: 'Guardião do EPI',
    description: 'Usou e cobrou o uso do EPI certo.',
    proof: 'Foto usando o EPI na operação ou o nome do líder que viu.',
    category: 'seguranca',
  },
  {
    id: 'cacador-de-erros',
    icon: '🔍',
    name: 'Caçador de Erros',
    description: 'Achou e corrigiu um erro (FEFO, endereço, etiqueta, conferência).',
    proof: 'Foto do erro encontrado e de como ficou depois de corrigido.',
    photoRequired: true,
    category: 'qualidade',
  },
  {
    id: 'estoque-impecavel',
    icon: '📦',
    name: 'Estoque Impecável',
    description: 'Deixou sua área organizada de dar inveja.',
    proof: 'Foto da área organizada (e, se tiver, de como estava antes).',
    photoRequired: true,
    category: 'qualidade',
  },
  {
    id: 'ideia-de-ouro',
    icon: '💡',
    name: 'Ideia de Ouro',
    description: 'Sugeriu uma melhoria para o setor.',
    proof: 'Descreva a ideia com detalhes; se já foi aplicada, mande foto do resultado.',
    category: 'qualidade',
  },
  {
    id: 'mao-amiga',
    icon: '🤝',
    name: 'Mão Amiga',
    description: 'Ajudou um colega a terminar o serviço.',
    proof: 'Nome do colega que você ajudou e em quê (a gestão confirma com ele).',
    category: 'companheirismo',
  },
  {
    id: 'mestre-do-bando',
    icon: '🎓',
    name: 'Mestre da Fronteira',
    description: 'Ensinou algo a um colega novo ou com dúvida.',
    proof: 'Nome de quem você ensinou e o que ensinou (a gestão confirma com ele).',
    category: 'companheirismo',
  },
  {
    id: 'alma-do-oeste',
    icon: '🌵',
    name: 'Alma do Oeste',
    description: 'Veio caracterizado ou decorou o setor no tema Velho Oeste.',
    proof: 'Foto da caracterização ou da decoração no setor.',
    photoRequired: true,
    category: 'espirito',
  },
  {
    id: 'animador-do-saloon',
    icon: '🎉',
    name: 'Animador do Saloon',
    description: 'Organizou uma brincadeira ou momento de integração com os colegas (desafio, pausa temática, aniversário).',
    proof: 'Foto do momento e o nome de pelo menos 2 colegas que participaram.',
    photoRequired: true,
    category: 'espirito',
  },
];

/** Distintivo que cada missão padrão sugere no fim: o assunto do jogo levado para a prática. */
export const MISSION_BADGE_HINTS: Record<string, string> = {
  'acamp-forca': 'cacador-de-erros',
  'acamp-memoria': 'alma-do-oeste',
  'acamp-quiz': 'cacador-de-erros',
  'acamp-duelo': 'animador-do-saloon',
  'vila-embaralhada': 'cacador-de-erros',
  'vila-tiro': 'animador-do-saloon',
  'vila-vf': 'olho-de-aguia',
  'vila-memoria': 'guardiao-epi',
  'estacao-ordem': 'cacador-de-erros',
  'estacao-corrida': 'animador-do-saloon',
  'estacao-forca': 'estoque-impecavel',
  'estacao-quiz': 'cacador-de-erros',
  'mina-cacto': 'alma-do-oeste',
  'mina-memoria': 'estoque-impecavel',
  'mina-embaralhada': 'olho-de-aguia',
  'mina-vf': 'olho-de-aguia',
  'desf-duelo': 'animador-do-saloon',
  'desf-ordem': 'estoque-impecavel',
  'desf-quiz': 'olho-de-aguia',
  'desf-tiro': 'alma-do-oeste',
  'forte-forca': 'olho-de-aguia',
  'forte-vf': 'olho-de-aguia',
  'forte-corrida': 'animador-do-saloon',
  'forte-memoria': 'guardiao-epi',
  'cidade-embaralhada': 'mao-amiga',
  'cidade-cacto': 'alma-do-oeste',
  'cidade-quiz': 'mestre-do-bando',
  'cidade-ordem': 'cacador-de-erros',
  'saloon-duelo': 'animador-do-saloon',
  'saloon-tiro': 'alma-do-oeste',
  'saloon-forca': 'mao-amiga',
  'saloon-vf': 'olho-de-aguia',
  procurado: 'ideia-de-ouro',
};

/** Sobe quando os valores da economia mudam de escala (ver normalizeState). */
export const ECONOMY_VERSION = 4;

export function initialState(): GameState {
  return {
    economy: ECONOMY_VERSION,
    players: [],
    missions: DEFAULT_MISSIONS,
    storeItems: DEFAULT_STORE,
    badges: [],
    orders: [],
    log: [],
  };
}
