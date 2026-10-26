// Envia um banco em arquivo (db.json + pasta photos ao lado) para o Postgres.
// Uso: DATABASE_URL=... npx tsx server/seed.ts caminho/do/db.json [--substituir]
// Sem --substituir, não grava por cima de um banco que já tem contas.
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const [file, flag] = process.argv.slice(2);
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!file || !url) {
  console.error('Uso: DATABASE_URL=... npx tsx server/seed.ts caminho/do/db.json [--substituir]');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(file, 'utf8'));
const photoDir = path.join(path.dirname(file), 'photos');
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('create table if not exists fronteira_db (id int primary key, data jsonb not null, version bigint not null)');
  await client.query('create table if not exists fronteira_photos (id text primary key, bytes bytea not null, created_at timestamptz not null default now())');
  const { rows } = await client.query("select jsonb_array_length(data->'users') as users from fronteira_db where id = 1");
  if (rows[0]?.users > 0 && flag !== '--substituir') {
    console.error(`O banco já tem ${rows[0].users} conta(s). Nada foi alterado. Use --substituir para gravar por cima.`);
    process.exit(1);
  }
  await client.query('begin');
  await client.query(
    'insert into fronteira_db (id, data, version) values (1, $1, $2) on conflict (id) do update set data = excluded.data, version = excluded.version',
    [JSON.stringify(db), Date.now()],
  );
  let photos = 0;
  for (const [id, meta] of Object.entries(db.photos ?? {}) as [string, { ext: string }][]) {
    const p = path.join(photoDir, `${id}.${meta.ext}`);
    if (!fs.existsSync(p)) continue;
    await client.query('insert into fronteira_photos (id, bytes) values ($1, $2) on conflict (id) do update set bytes = excluded.bytes', [id, fs.readFileSync(p)]);
    photos++;
  }
  await client.query('commit');
  console.log(`Banco enviado: ${db.users?.length ?? 0} conta(s), ${db.game?.players?.length ?? 0} personagem(ns), ${photos} foto(s).`);
} finally {
  await client.end();
}
