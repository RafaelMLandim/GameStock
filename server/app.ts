import express, { type NextFunction, type Request, type Response } from 'express';
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BADGE_TYPES, initialState } from '../src/data.js';
import { normalizeState, reducer, uid, type Action } from '../src/game.js';
import type { GameState, Role, User } from '../src/types';
import { fileStore, postgresStore, type Snapshot } from './store.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.DATA_DIR ?? path.join(ROOT, 'data');
const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

interface StoredUser extends User {
  salt: string;
  passwordHash: string;
  createdAt: number;
  /** Código de recuperação gerado pela gestão ("Esqueci a senha"). */
  reset?: { salt: string; hash: string; expires: number; tries: number };
}

/** Matrícula liberada pela gestão (vem da planilha); a pessoa se cadastra com ela. */
interface RosterEntry {
  name: string;
  addedAt: number;
}

interface Db {
  users: StoredUser[];
  /** matrícula -> dados da planilha */
  roster: Record<string, RosterEntry>;
  /** token -> userId */
  sessions: Record<string, string>;
  /** Fotos dos pedidos de distintivo: id -> dono e formato (o conteúdo fica no armazenamento). */
  photos: Record<string, { userId: string; ext: string }>;
  game: GameState;
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function loadDb(raw: Partial<Db> | null): Db {
  return {
    users: raw?.users ?? [],
    roster: raw?.roster ?? {},
    sessions: raw?.sessions ?? {},
    photos: raw?.photos ?? {},
    game: raw ? normalizeState(raw.game ?? {}) : initialState(),
  };
}

// Na Vercel o banco fica no Postgres; no PC (ou com disco permanente), no arquivo data/db.json.
const store = DATABASE_URL ? postgresStore(DATABASE_URL, loadDb) : fileStore(DATA_DIR, loadDb);

type Ctx = Snapshot<Db>;

/** Marca o banco para ser gravado no fim da rota. */
function saveDb(s: Ctx) {
  s.changed = true;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function checkPassword(user: StoredUser, password: string): boolean {
  const a = Buffer.from(hashPassword(password, user.salt), 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function publicUser(u: StoredUser): User {
  return { id: u.id, username: u.username, realName: u.realName, role: u.role };
}

function newSession(s: Ctx, userId: string): string {
  const token = randomBytes(32).toString('hex');
  s.data.sessions[token] = userId;
  return token;
}

function tokenOf(req: Request): string | undefined {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

function userOf(s: Ctx, req: Request): StoredUser | undefined {
  const token = tokenOf(req);
  return token ? s.data.users.find((u) => u.id === s.data.sessions[token]) : undefined;
}

/**
 * Jogadores só mexem no próprio personagem; o resto é da gestão (admin).
 * Retorna a ação a executar (com o dono preenchido) ou uma mensagem de erro.
 */
function authorize(db: Db, user: StoredUser, action: Action): Action | string {
  // Criar personagem é sempre para a própria conta, e só jogadores têm personagem.
  if (action.type === 'ADD_PLAYER') {
    if (user.role === 'admin') return 'A gestão não cria personagem.';
    if (db.game.players.some((p) => p.userId === user.id)) return 'Você já tem um personagem.';
    return { ...action, userId: user.id };
  }
  // Quem da gestão aprovou ou recusou o pedido fica registrado.
  if (user.role === 'admin') return action.type === 'RESOLVE_ORDER' ? { ...action, by: user.realName } : action;
  const own = (playerId: string) => db.game.players.some((p) => p.id === playerId && p.userId === user.id);
  switch (action.type) {
    case 'UPDATE_PLAYER':
      return own(action.id) ? action : 'Você só pode editar o seu personagem.';
    case 'USE_SHORTCUT':
      return own(action.playerId) ? action : 'Você só pode usar os seus atalhos.';
    case 'WIN_MISSION':
    case 'LOSE_MISSION':
      return own(action.playerId) ? action : 'Você só pode jogar as suas missões.';
    case 'REQUEST_ORDER':
      return own(action.order.playerId) ? action : 'Você só pode pedir trocas para você.';
    case 'REQUEST_BADGE': {
      const { playerId, photoId } = action.badge;
      if (!own(playerId)) return 'Você só pode pedir distintivos para você.';
      if (photoId && db.photos[photoId]?.userId !== user.id) return 'Foto inválida.';
      if (!photoId && BADGE_TYPES.find((t) => t.id === action.badge.typeId)?.photoRequired) return 'Esse distintivo precisa de uma foto como comprovação.';
      return action;
    }
    default:
      return 'Apenas a gestão pode fazer isso.';
  }
}

/** Resposta de uma rota: só é enviada depois que o banco foi gravado. */
interface Reply {
  status?: number;
  body?: unknown;
}

const fail = (status: number, error: string): Reply => ({ status, body: { error } });
const NEED_LOGIN = fail(401, 'Faça login para continuar.');
const ADMIN_ONLY = fail(403, 'Apenas a gestão pode fazer isso.');

type Handler = (s: Ctx, req: Request) => Reply;

function send(res: Response, reply: Reply) {
  if (reply.body === undefined) res.status(reply.status ?? 204).end();
  else res.status(reply.status ?? 200).json(reply.body);
}

/** Rota que só lê o banco. */
const reading = (fn: Handler) => (req: Request, res: Response, next: NextFunction) =>
  store
    .read()
    .then((s) => send(res, fn(s, req)))
    .catch(next);

/** Rota que pode mudar o banco: roda com o banco travado e grava no fim, se algo mudou. */
const writing = (fn: Handler) => (req: Request, res: Response, next: NextFunction) =>
  store
    .write((s) => fn(s, req))
    .then((reply) => send(res, reply))
    .catch(next);

/** Exige login (e, com `admin`, que seja da gestão). */
function signedIn(fn: (s: Ctx, req: Request, user: StoredUser) => Reply, admin = false): Handler {
  return (s, req) => {
    const user = userOf(s, req);
    if (!user) return NEED_LOGIN;
    if (admin && user.role !== 'admin') return ADMIN_ONLY;
    return fn(s, req, user);
  };
}

export const app = express();
app.use(express.json({ limit: '5mb' }));

app.get(
  '/api/setup',
  reading((s) => ({ body: { needsAdmin: s.data.users.length === 0 } })),
);

/** A matrícula é o usuário de login: sem espaços e sem diferença de maiúsculas. */
function matriculaOf(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

const MIN_PASSWORD = 4;
const RESET_HOURS = 24;
const RESET_TRIES = 5;

function setPassword(user: StoredUser, password: string) {
  user.salt = randomBytes(16).toString('hex');
  user.passwordHash = hashPassword(password, user.salt);
}

// Primeiro passo do cadastro: a matrícula precisa estar na planilha e ainda não ter conta.
app.post(
  '/api/signup/check',
  reading((s, req) => {
    const matricula = matriculaOf(req.body?.matricula);
    const entry = s.data.roster[matricula];
    if (!entry) return fail(404, 'Matrícula não encontrada. Confira o número ou fale com a gestão.');
    if (s.data.users.some((u) => u.username === matricula)) return fail(409, 'Essa matrícula já tem cadastro. Entre com sua senha ou use "Esqueci a senha".');
    return { body: { name: entry.name } };
  }),
);

app.post(
  '/api/register',
  writing((s, req) => {
    const db = s.data;
    const password = String(req.body?.password ?? '');
    if (password.length < MIN_PASSWORD) return fail(400, `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
    // A primeira conta do sistema é a da gestão, criada com usuário livre (ainda não há planilha).
    if (db.users.length === 0) {
      const username = matriculaOf(req.body?.username);
      const realName = String(req.body?.realName ?? '').trim();
      if (!/^[a-z0-9._-]{3,30}$/.test(username) || !realName) return fail(400, 'Informe um usuário (3 a 30 letras ou números) e seu nome.');
      const salt = randomBytes(16).toString('hex');
      const user: StoredUser = { id: uid(), username, realName, role: 'admin', salt, passwordHash: hashPassword(password, salt), createdAt: Date.now() };
      db.users.push(user);
      const token = newSession(s, user.id);
      saveDb(s);
      return { body: { token, user: publicUser(user) } };
    }
    // Depois disso, só quem está na planilha de matrículas se cadastra; o nome vem da planilha.
    const matricula = matriculaOf(req.body?.username);
    const entry = db.roster[matricula];
    if (!entry) return fail(404, 'Matrícula não encontrada. Confira o número ou fale com a gestão.');
    if (db.users.some((u) => u.username === matricula)) return fail(409, 'Essa matrícula já tem cadastro. Entre com sua senha ou use "Esqueci a senha".');
    const realName = entry.name || String(req.body?.realName ?? '').trim();
    if (!realName) return fail(400, 'Informe seu nome.');
    const salt = randomBytes(16).toString('hex');
    db.users.push({ id: uid(), username: matricula, realName, role: 'player', salt, passwordHash: hashPassword(password, salt), createdAt: Date.now() });
    saveDb(s);
    // Sem login automático: a pessoa volta para a tela de entrar com matrícula e senha.
    return { body: { ok: true } };
  }),
);

// "Esqueci a senha": a gestão gera um código e a pessoa cria uma senha nova com ele.
app.post(
  '/api/password-reset',
  writing((s, req) => {
    const user = s.data.users.find((u) => u.username === matriculaOf(req.body?.matricula));
    const code = String(req.body?.code ?? '').replace(/\D/g, '');
    const password = String(req.body?.password ?? '');
    const reset = user?.reset;
    if (!user || !reset || reset.expires < Date.now() || reset.tries >= RESET_TRIES) return fail(400, 'Código inválido ou vencido. Peça um código novo para a gestão.');
    if (password.length < MIN_PASSWORD) return fail(400, `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
    const a = Buffer.from(hashPassword(code, reset.salt), 'hex');
    const b = Buffer.from(reset.hash, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      reset.tries += 1;
      saveDb(s);
      return fail(400, reset.tries >= RESET_TRIES ? 'Código errado muitas vezes. Peça um código novo para a gestão.' : 'Código errado. Confira com a gestão.');
    }
    setPassword(user, password);
    delete user.reset;
    // Senha nova: quem estava logado com a antiga precisa entrar de novo.
    for (const [token, id] of Object.entries(s.data.sessions)) if (id === user.id) delete s.data.sessions[token];
    saveDb(s);
    return { body: { ok: true } };
  }),
);

app.post(
  '/api/login',
  writing((s, req) => {
    const username = matriculaOf(req.body?.username);
    const user = s.data.users.find((u) => u.username === username);
    if (!user || !checkPassword(user, String(req.body?.password ?? ''))) return fail(401, 'Usuário ou senha incorretos.');
    const token = newSession(s, user.id);
    saveDb(s);
    return { body: { token, user: publicUser(user) } };
  }),
);

app.post(
  '/api/logout',
  writing((s, req) => {
    const token = tokenOf(req);
    if (token && s.data.sessions[token]) {
      delete s.data.sessions[token];
      saveDb(s);
    }
    return { body: { ok: true } };
  }),
);

app.get(
  '/api/me',
  reading(signedIn((_s, _req, user) => ({ body: { user: publicUser(user) } }))),
);

/** Matrículas da planilha e contas: quem já se cadastrou, quem é da gestão e quem tem código de senha. */
app.get(
  '/api/accounts',
  reading(
    signedIn(({ data: db }) => {
      const byUser = new Map(db.users.map((u) => [u.username, u]));
      const character = (userId: string) => db.game.players.find((p) => p.userId === userId)?.codename;
      const rows = Object.entries(db.roster).map(([matricula, entry]) => {
        const u = byUser.get(matricula);
        return { matricula, name: u?.realName ?? entry.name, inRoster: true, user: u && { id: u.id, role: u.role, character: character(u.id) } };
      });
      // Contas fora da planilha (a primeira da gestão, contas de teste).
      for (const u of db.users) {
        if (!db.roster[u.username]) rows.push({ matricula: u.username, name: u.realName, inRoster: false, user: { id: u.id, role: u.role, character: character(u.id) } });
      }
      rows.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      return { body: { accounts: rows } };
    }, true),
  ),
);

// Importa a planilha: cada linha com matrícula e nome. Matrícula repetida só atualiza o nome.
app.post(
  '/api/roster',
  writing(
    signedIn((s, req) => {
      const roster = s.data.roster;
      const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
      let added = 0;
      let updated = 0;
      for (const e of entries.slice(0, 5000)) {
        const matricula = matriculaOf(e?.matricula);
        const name = String(e?.name ?? '').trim().slice(0, 80);
        if (!/^[a-z0-9._-]{1,30}$/.test(matricula)) continue;
        if (roster[matricula]) {
          if (name && roster[matricula].name !== name) {
            roster[matricula].name = name;
            updated++;
          }
        } else {
          roster[matricula] = { name, addedAt: Date.now() };
          added++;
        }
      }
      saveDb(s);
      return { body: { added, updated } };
    }, true),
  ),
);

// Tira da planilha uma matrícula que ainda não se cadastrou.
app.delete(
  '/api/roster/:matricula',
  writing(
    signedIn((s, req) => {
      const matricula = matriculaOf(req.params.matricula);
      if (s.data.users.some((u) => u.username === matricula)) return fail(409, 'Essa matrícula já tem cadastro.');
      delete s.data.roster[matricula];
      saveDb(s);
      return { body: { ok: true } };
    }, true),
  ),
);

// Gera o código de "Esqueci a senha" (6 números, vale 24 horas). Só aparece uma vez, para a gestão passar à pessoa.
app.post(
  '/api/accounts/:id/reset',
  writing(
    signedIn((s, req) => {
      const user = s.data.users.find((u) => u.id === req.params.id);
      if (!user) return fail(404, 'Conta não encontrada.');
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const salt = randomBytes(16).toString('hex');
      const expires = Date.now() + RESET_HOURS * 3600_000;
      user.reset = { salt, hash: hashPassword(code, salt), expires, tries: 0 };
      saveDb(s);
      return { body: { code, expires } };
    }, true),
  ),
);

// Tornar gestor ou voltar a jogador. Sempre fica pelo menos uma conta da gestão.
app.post(
  '/api/accounts/:id/role',
  writing(
    signedIn((s, req, me) => {
      const user = s.data.users.find((u) => u.id === req.params.id);
      const role: Role = req.body?.role === 'admin' ? 'admin' : 'player';
      if (!user) return fail(404, 'Conta não encontrada.');
      if (user.id === me.id) return fail(400, 'Você não pode mudar o seu próprio acesso.');
      if (role === 'player' && s.data.users.filter((u) => u.role === 'admin').length <= 1) return fail(400, 'Precisa ficar pelo menos uma conta da gestão.');
      user.role = role;
      s.version += 1; // quem mudou de acesso recebe o jogo de novo (gestão vê tudo; jogador só o seu)
      saveDb(s);
      return { body: { ok: true } };
    }, true),
  ),
);

/**
 * O que cada pessoa recebe do jogo. A gestão vê tudo; o jogador recebe só o próprio
 * personagem e os próprios distintivos, sem os dados dos colegas nem o Diário.
 */
function viewFor(db: Db, user: StoredUser): GameState {
  if (user.role === 'admin') return db.game;
  const mine = db.game.players.filter((p) => p.userId === user.id);
  const ids = new Set(mine.map((p) => p.id));
  return {
    ...db.game,
    players: mine,
    badges: db.game.badges.filter((b) => ids.has(b.playerId)),
    orders: db.game.orders.filter((o) => ids.has(o.playerId)),
    log: [],
  };
}

// O celular manda a versão que já tem; se nada mudou, a resposta vai vazia
// (e o banco inteiro nem chega a ser carregado).
const stateRoute = reading(signedIn((s, _req, user) => ({ body: { state: viewFor(s.data, user), version: s.version } })));
app.get('/api/state', (req, res, next) => {
  const token = tokenOf(req);
  if (!token || req.query.v === undefined) return stateRoute(req, res, next);
  store
    .peek(token)
    .then(({ version, session }) => {
      if (session && req.query.v === String(version)) res.status(204).end();
      else return stateRoute(req, res, next);
    })
    .catch(next);
});

app.post(
  '/api/action',
  writing(
    signedIn((s, req, user) => {
      const action = req.body?.action as Action | undefined;
      if (!action || typeof action.type !== 'string') return fail(400, 'Ação inválida.');
      const allowed = authorize(s.data, user, action);
      if (typeof allowed === 'string') return fail(403, allowed);
      let next: GameState;
      try {
        next = reducer(s.data.game, allowed);
      } catch (err) {
        console.error(err);
        return fail(400, 'Não foi possível aplicar a ação.');
      }
      if (next !== s.data.game) {
        s.data.game = next;
        s.version += 1;
        saveDb(s);
      }
      return { body: { state: viewFor(s.data, user), version: s.version } };
    }),
  ),
);

// Foto de um pedido de distintivo (já reduzida no celular antes do envio).
app.post('/api/photos', async (req, res, next) => {
  try {
    const user = userOf(await store.read(), req);
    if (!user) return send(res, NEED_LOGIN);
    const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(req.body?.data ?? ''));
    const bytes = match ? Buffer.from(match[2], 'base64') : null;
    if (!match || !bytes?.length || bytes.length > MAX_PHOTO_BYTES) return send(res, fail(400, 'Foto inválida ou grande demais.'));
    const id = uid();
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    await store.savePhoto(id, ext, bytes);
    await store.write((s) => {
      s.data.photos[id] = { userId: user.id, ext };
      saveDb(s);
    });
    send(res, { body: { id } });
  } catch (err) {
    next(err);
  }
});

// Só quem enviou e a gestão podem ver a foto.
app.get('/api/photos/:id', async (req, res, next) => {
  try {
    const s = await store.read();
    const user = userOf(s, req);
    if (!user) return send(res, NEED_LOGIN);
    const meta = s.data.photos[req.params.id];
    const bytes = meta && (user.role === 'admin' || meta.userId === user.id) ? await store.photo(req.params.id, meta.ext) : null;
    if (!meta || !bytes) return send(res, fail(404, 'Foto não encontrada.'));
    res.type(meta.ext).send(bytes);
  } catch (err) {
    next(err);
  }
});

// Erro inesperado (ex.: banco fora do ar): avisa o celular em vez de deixar a requisição pendurada.
app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (!res.headersSent) send(res, fail(500, 'O servidor não respondeu direito. Tente de novo em instantes.'));
});
