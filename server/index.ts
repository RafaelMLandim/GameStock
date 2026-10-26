import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, app } from './app.js';

// Servidor de verdade (PC, Fly.io...). Na Vercel quem chama o app é api/index.ts.
const PORT = Number(process.env.PORT ?? 3001);

// Em produção o próprio servidor entrega o front-end compilado.
const DIST = path.join(ROOT, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fronteira do Estoque rodando em http://localhost:${PORT}`);
});
