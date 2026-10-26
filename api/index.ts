// Vercel: toda chamada /api/* cai aqui (ver vercel.json) e vai para o mesmo servidor Express.
// O banco fica no Postgres (variável DATABASE_URL, criada ao ligar o Neon no painel da Vercel).
import { app } from '../server/app.js';

export default app;
