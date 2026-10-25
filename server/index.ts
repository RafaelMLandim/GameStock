import express, { type NextFunction, type Request, type Response } from 'express';
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BADGE_TYPES, initialState } from '../src/data';
import { normalizeState, reducer, uid, type Action } from '../src/game';
import type { GameState, Role, User } from '../src/types';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.DATA_DIR ?? path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT ?? 3001);

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
  /** Fotos dos pedidos de distintivo: id -> dono e formato (o arquivo fica em data/photos). */
  photos: Record<string, { userId: string; ext: string }>;
  game: GameState;
}

const PHOTO_DIR = path.join(DATA_DIR, 'photos');
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MAX_BACKUPS = 30;

/** Guarda uma cópia do banco cada vez que o servidor liga (mantém as 30 mais recentes). */
function backupDb() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, `db-${stamp}.json`));
  const old = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('db-')).sort().slice(0, -MAX_BACKUPS);
  old.forEach((f) => fs.rmSync(path.join(BACKUP_DIR, f)));
}

function loadDb(): Db {
  // Banco novo: só quando o arquivo ainda não existe.
  if (!fs.existsSync(DB_FILE)) return { users: [], roster: {}, sessions: {}, photos: {}, game: initialState() };
  backupDb();
  // Se o arquivo existe mas não carrega, o servidor para em vez de começar vazio:
  // começar vazio gravaria por cima de todos os dados na primeira ação.
  try {
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as Partial<Db>;
    return {
      users: raw.users ?? [],
      roster: raw.roster ?? {},
      sessions: raw.sessions ?? {},
      photos: raw.photos ?? {},
      game: normalizeState(raw.game ?? {}),
    };
  } catch (err) {
    console.error(`Não foi possível carregar ${DB_FILE}. Nada foi apagado; corrija o erro e ligue de novo.`);
    throw err;
  }
}

const db = loadDb();

// Versão do jogo: sobe a cada mudança. Começa no horário em que o servidor subiu,
// para que um celular aberto antes de um reinício receba o jogo de novo.
let version = Date.now();

function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
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

function newSession(userId: string): string {
  const token = randomBytes(32).toString('hex');
  db.sessions[token] = userId;
  return token;
}

function tokenOf(req: Request): string | undefined {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : undefined;
}

type AuthedRequest = Request & { user?: StoredUser };

function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = tokenOf(req);
  const user = token ? db.users.find((u) => u.id === db.sessions[token]) : undefined;
  if (!user) {
    res.status(401).json({ error: 'Faça login para continuar.' });
    return;
  }
  req.user = user;
  next();
}

/**
 * Jogadores só mexem no próprio personagem; o resto é da gestão (admin).
 * Retorna a ação a executar (com o dono preenchido) ou uma mensagem de erro.
 */
function authorize(user: StoredUser, action: Action): Action | string {
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

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/api/setup', (_req, res) => {
  res.json({ needsAdmin: db.users.length === 0 });
});

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
app.post('/api/signup/check', (req, res) => {
  const matricula = matriculaOf(req.body?.matricula);
  const entry = db.roster[matricula];
  if (!entry) {
    res.status(404).json({ error: 'Matrícula não encontrada. Confira o número ou fale com a gestão.' });
    return;
  }
  if (db.users.some((u) => u.username === matricula)) {
    res.status(409).json({ error: 'Essa matrícula já tem cadastro. Entre com sua senha ou use "Esqueci a senha".' });
    return;
  }
  res.json({ name: entry.name });
});

app.post('/api/register', (req, res) => {
  const password = String(req.body?.password ?? '');
  if (password.length < MIN_PASSWORD) {
    res.status(400).json({ error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` });
    return;
  }
  // A primeira conta do sistema é a da gestão, criada com usuário livre (ainda não há planilha).
  if (db.users.length === 0) {
    const username = matriculaOf(req.body?.username);
    const realName = String(req.body?.realName ?? '').trim();
    if (!/^[a-z0-9._-]{3,30}$/.test(username) || !realName) {
      res.status(400).json({ error: 'Informe um usuário (3 a 30 letras ou números) e seu nome.' });
      return;
    }
    const salt = randomBytes(16).toString('hex');
    const user: StoredUser = { id: uid(), username, realName, role: 'admin', salt, passwordHash: hashPassword(password, salt), createdAt: Date.now() };
    db.users.push(user);
    const token = newSession(user.id);
    saveDb();
    res.json({ token, user: publicUser(user) });
    return;
  }
  // Depois disso, só quem está na planilha de matrículas se cadastra; o nome vem da planilha.
  const matricula = matriculaOf(req.body?.username);
  const entry = db.roster[matricula];
  if (!entry) {
    res.status(404).json({ error: 'Matrícula não encontrada. Confira o número ou fale com a gestão.' });
    return;
  }
  if (db.users.some((u) => u.username === matricula)) {
    res.status(409).json({ error: 'Essa matrícula já tem cadastro. Entre com sua senha ou use "Esqueci a senha".' });
    return;
  }
  const realName = entry.name || String(req.body?.realName ?? '').trim();
  if (!realName) {
    res.status(400).json({ error: 'Informe seu nome.' });
    return;
  }
  const salt = randomBytes(16).toString('hex');
  db.users.push({ id: uid(), username: matricula, realName, role: 'player', salt, passwordHash: hashPassword(password, salt), createdAt: Date.now() });
  saveDb();
  // Sem login automático: a pessoa volta para a tela de entrar com matrícula e senha.
  res.json({ ok: true });
});

// "Esqueci a senha": a gestão gera um código e a pessoa cria uma senha nova com ele.
app.post('/api/password-reset', (req, res) => {
  const user = db.users.find((u) => u.username === matriculaOf(req.body?.matricula));
  const code = String(req.body?.code ?? '').replace(/\D/g, '');
  const password = String(req.body?.password ?? '');
  const reset = user?.reset;
  if (!user || !reset || reset.expires < Date.now() || reset.tries >= RESET_TRIES) {
    res.status(400).json({ error: 'Código inválido ou vencido. Peça um código novo para a gestão.' });
    return;
  }
  if (password.length < MIN_PASSWORD) {
    res.status(400).json({ error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` });
    return;
  }
  const a = Buffer.from(hashPassword(code, reset.salt), 'hex');
  const b = Buffer.from(reset.hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    reset.tries += 1;
    saveDb();
    res.status(400).json({ error: reset.tries >= RESET_TRIES ? 'Código errado muitas vezes. Peça um código novo para a gestão.' : 'Código errado. Confira com a gestão.' });
    return;
  }
  setPassword(user, password);
  delete user.reset;
  // Senha nova: quem estava logado com a antiga precisa entrar de novo.
  for (const [token, id] of Object.entries(db.sessions)) if (id === user.id) delete db.sessions[token];
  saveDb();
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const username = matriculaOf(req.body?.username);
  const user = db.users.find((u) => u.username === username);
  if (!user || !checkPassword(user, String(req.body?.password ?? ''))) {
    res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    return;
  }
  const token = newSession(user.id);
  saveDb();
  res.json({ token, user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  const token = tokenOf(req);
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    saveDb();
  }
  res.json({ ok: true });
});

app.get('/api/me', requireUser, (req: AuthedRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Apenas a gestão pode fazer isso.' });
    return;
  }
  next();
}

/** Matrículas da planilha e contas: quem já se cadastrou, quem é da gestão e quem tem código de senha. */
app.get('/api/accounts', requireUser, requireAdmin, (_req, res) => {
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
  res.json({ accounts: rows });
});

// Importa a planilha: cada linha com matrícula e nome. Matrícula repetida só atualiza o nome.
app.post('/api/roster', requireUser, requireAdmin, (req, res) => {
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  let added = 0;
  let updated = 0;
  for (const e of entries.slice(0, 5000)) {
    const matricula = matriculaOf(e?.matricula);
    const name = String(e?.name ?? '').trim().slice(0, 80);
    if (!/^[a-z0-9._-]{1,30}$/.test(matricula)) continue;
    if (db.roster[matricula]) {
      if (name && db.roster[matricula].name !== name) {
        db.roster[matricula].name = name;
        updated++;
      }
    } else {
      db.roster[matricula] = { name, addedAt: Date.now() };
      added++;
    }
  }
  saveDb();
  res.json({ added, updated });
});

// Tira da planilha uma matrícula que ainda não se cadastrou.
app.delete('/api/roster/:matricula', requireUser, requireAdmin, (req, res) => {
  const matricula = matriculaOf(req.params.matricula);
  if (db.users.some((u) => u.username === matricula)) {
    res.status(409).json({ error: 'Essa matrícula já tem cadastro.' });
    return;
  }
  delete db.roster[matricula];
  saveDb();
  res.json({ ok: true });
});

// Gera o código de "Esqueci a senha" (6 números, vale 24 horas). Só aparece uma vez, para a gestão passar à pessoa.
app.post('/api/accounts/:id/reset', requireUser, requireAdmin, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Conta não encontrada.' });
    return;
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const salt = randomBytes(16).toString('hex');
  const expires = Date.now() + RESET_HOURS * 3600_000;
  user.reset = { salt, hash: hashPassword(code, salt), expires, tries: 0 };
  saveDb();
  res.json({ code, expires });
});

// Tornar gestor ou voltar a jogador. Sempre fica pelo menos uma conta da gestão.
app.post('/api/accounts/:id/role', requireUser, requireAdmin, (req: AuthedRequest, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  const role: Role = req.body?.role === 'admin' ? 'admin' : 'player';
  if (!user) {
    res.status(404).json({ error: 'Conta não encontrada.' });
    return;
  }
  if (user.id === req.user!.id) {
    res.status(400).json({ error: 'Você não pode mudar o seu próprio acesso.' });
    return;
  }
  if (role === 'player' && db.users.filter((u) => u.role === 'admin').length <= 1) {
    res.status(400).json({ error: 'Precisa ficar pelo menos uma conta da gestão.' });
    return;
  }
  user.role = role;
  version += 1; // quem mudou de acesso recebe o jogo de novo (gestão vê tudo; jogador só o seu)
  saveDb();
  res.json({ ok: true });
});

/**
 * O que cada pessoa recebe do jogo. A gestão vê tudo; o jogador recebe só o próprio
 * personagem e os próprios distintivos, sem os dados dos colegas nem o Diário.
 */
function viewFor(user: StoredUser): GameState {
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

// O celular manda a versão que já tem; se nada mudou, a resposta vai vazia.
app.get('/api/state', requireUser, (req: AuthedRequest, res) => {
  if (req.query.v === String(version)) {
    res.status(204).end();
    return;
  }
  res.json({ state: viewFor(req.user!), version });
});

app.post('/api/action', requireUser, (req: AuthedRequest, res) => {
  const action = req.body?.action as Action | undefined;
  if (!action || typeof action.type !== 'string') {
    res.status(400).json({ error: 'Ação inválida.' });
    return;
  }
  const allowed = authorize(req.user!, action);
  if (typeof allowed === 'string') {
    res.status(403).json({ error: allowed });
    return;
  }
  try {
    const next = reducer(db.game, allowed);
    if (next !== db.game) {
      db.game = next;
      version += 1;
      saveDb();
    }
    res.json({ state: viewFor(req.user!), version });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Não foi possível aplicar a ação.' });
  }
});

// Foto de um pedido de distintivo (já reduzida no celular antes do envio).
app.post('/api/photos', requireUser, (req: AuthedRequest, res) => {
  const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(req.body?.data ?? ''));
  const bytes = match ? Buffer.from(match[2], 'base64') : null;
  if (!match || !bytes?.length || bytes.length > MAX_PHOTO_BYTES) {
    res.status(400).json({ error: 'Foto inválida ou grande demais.' });
    return;
  }
  const id = uid();
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  fs.writeFileSync(path.join(PHOTO_DIR, `${id}.${ext}`), bytes);
  db.photos[id] = { userId: req.user!.id, ext };
  saveDb();
  res.json({ id });
});

// Só quem enviou e a gestão podem ver a foto.
app.get('/api/photos/:id', requireUser, (req: AuthedRequest, res) => {
  const meta = db.photos[req.params.id];
  if (!meta || (req.user!.role !== 'admin' && meta.userId !== req.user!.id)) {
    res.status(404).json({ error: 'Foto não encontrada.' });
    return;
  }
  res.sendFile(path.join(PHOTO_DIR, `${req.params.id}.${meta.ext}`));
});

// Em produção o próprio servidor entrega o front-end compilado.
const DIST = path.join(ROOT, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fronteira do Estoque rodando em http://localhost:${PORT}`);
});
