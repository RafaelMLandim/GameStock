import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

/**
 * Onde o banco do jogo fica guardado. O servidor sempre trabalha com o banco inteiro
 * (um objeto só); o armazenamento só sabe ler, gravar com trava e guardar as fotos.
 *
 * - Arquivo (data/db.json): no PC ou num servidor com disco permanente.
 * - Postgres (DATABASE_URL): na Vercel, onde cada acesso pode cair numa cópia diferente
 *   do servidor e nada fica gravado em disco.
 */
export interface Snapshot<T> {
  data: T;
  /** Sobe a cada mudança no jogo; o celular só recebe o jogo de novo quando ela muda. */
  version: number;
  /** Marcado por quem mexeu no banco: só aí ele é gravado. */
  changed: boolean;
}

export interface Store<T> {
  /** Versão atual e se o token é de uma sessão aberta, sem carregar o banco inteiro. */
  peek(token: string): Promise<{ version: number; session: boolean }>;
  read(): Promise<Snapshot<T>>;
  /** Carrega o banco travado (ninguém mais grava ao mesmo tempo), roda `fn` e grava se mudou. */
  write<R>(fn: (s: Snapshot<T>) => R): Promise<R>;
  savePhoto(id: string, ext: string, bytes: Buffer): Promise<void>;
  photo(id: string, ext: string): Promise<Buffer | null>;
}

const MAX_BACKUPS = 30;

export function fileStore<T extends { sessions: Record<string, string> }>(dir: string, load: (raw: Partial<T> | null) => T): Store<T> {
  const file = path.join(dir, 'db.json');
  const photoDir = path.join(dir, 'photos');
  const backupDir = path.join(dir, 'backups');

  /** Guarda uma cópia do banco cada vez que o servidor liga (mantém as 30 mais recentes). */
  function backup() {
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.copyFileSync(file, path.join(backupDir, `db-${stamp}.json`));
    const old = fs.readdirSync(backupDir).filter((f) => f.startsWith('db-')).sort().slice(0, -MAX_BACKUPS);
    old.forEach((f) => fs.rmSync(path.join(backupDir, f)));
  }

  function open(): T {
    // Banco novo: só quando o arquivo ainda não existe.
    if (!fs.existsSync(file)) return load(null);
    backup();
    // Se o arquivo existe mas não carrega, o servidor para em vez de começar vazio:
    // começar vazio gravaria por cima de todos os dados na primeira ação.
    try {
      return load(JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (err) {
      console.error(`Não foi possível carregar ${file}. Nada foi apagado; corrija o erro e ligue de novo.`);
      throw err;
    }
  }

  // Um processo só: o banco fica na memória. A versão começa no horário em que o servidor
  // subiu, para que um celular aberto antes de um reinício receba o jogo de novo.
  const current: Snapshot<T> = { data: open(), version: Date.now(), changed: false };

  return {
    async peek(token) {
      return { version: current.version, session: token in current.data.sessions };
    },
    async read() {
      return current;
    },
    async write(fn) {
      current.changed = false;
      const result = fn(current);
      if (current.changed) {
        fs.mkdirSync(dir, { recursive: true });
        const tmp = `${file}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(current.data, null, 2));
        fs.renameSync(tmp, file);
      }
      return result;
    },
    async savePhoto(id, ext, bytes) {
      fs.mkdirSync(photoDir, { recursive: true });
      fs.writeFileSync(path.join(photoDir, `${id}.${ext}`), bytes);
    },
    async photo(id, ext) {
      const p = path.join(photoDir, `${id}.${ext}`);
      return fs.existsSync(p) ? fs.readFileSync(p) : null;
    },
  };
}

/** Banco inteiro numa linha (jsonb) e as fotos numa tabela à parte. */
const SCHEMA = `
  create table if not exists fronteira_db (
    id int primary key,
    data jsonb not null,
    version bigint not null
  );
  create table if not exists fronteira_photos (
    id text primary key,
    bytes bytea not null,
    created_at timestamptz not null default now()
  );
`;

export function postgresStore<T>(url: string, load: (raw: Partial<T> | null) => T): Store<T> {
  const pool = new pg.Pool({ connectionString: url, max: 3 });
  // bigint volta como texto no pg; a versão cabe com folga num number.
  const toSnapshot = (row: { data: Partial<T>; version: string }): Snapshot<T> => ({ data: load(row.data), version: Number(row.version), changed: false });

  // Cria as tabelas e a linha do banco na primeira vez (uma vez por cópia do servidor).
  let ready: Promise<void> | null = null;
  const init = () =>
    (ready ??= (async () => {
      await pool.query(SCHEMA);
      await pool.query('insert into fronteira_db (id, data, version) values (1, $1, $2) on conflict (id) do nothing', [JSON.stringify(load(null)), Date.now()]);
    })().catch((err) => {
      ready = null;
      throw err;
    }));

  return {
    async peek(token) {
      await init();
      const { rows } = await pool.query("select version, (data->'sessions') ? $1 as session from fronteira_db where id = 1", [token]);
      return { version: Number(rows[0].version), session: rows[0].session };
    },
    async read() {
      await init();
      const { rows } = await pool.query('select data, version from fronteira_db where id = 1');
      return toSnapshot(rows[0]);
    },
    async write(fn) {
      await init();
      const client = await pool.connect();
      try {
        await client.query('begin');
        const { rows } = await client.query('select data, version from fronteira_db where id = 1 for update');
        const s = toSnapshot(rows[0]);
        const result = fn(s);
        if (s.changed) await client.query('update fronteira_db set data = $1, version = $2 where id = 1', [JSON.stringify(s.data), s.version]);
        await client.query('commit');
        return result;
      } catch (err) {
        await client.query('rollback').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
    async savePhoto(id, _ext, bytes) {
      await init();
      await pool.query('insert into fronteira_photos (id, bytes) values ($1, $2)', [id, bytes]);
    },
    async photo(id) {
      await init();
      const { rows } = await pool.query('select bytes from fronteira_photos where id = $1', [id]);
      return rows[0]?.bytes ?? null;
    },
  };
}
