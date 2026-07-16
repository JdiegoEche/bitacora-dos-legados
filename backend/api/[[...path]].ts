import { handle } from 'hono/vercel';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync } from 'fs';
import { join } from 'path';
// @ts-expect-error — dist/app.js is compiled from src/app.ts, no declarations needed
import app from '../dist/app.js';

// ─── Static frontend ────────────────────────────────────────────────────────
// With catch-all rewrite (/* → /api/$1), ALL requests arrive as /api/* paths.
// serveStatic strips the /api prefix and resolves from frontend-dist/.

const frontendDist = join(process.cwd(), 'frontend-dist');

app.use('/api/*', serveStatic({ root: frontendDist }));

// ─── SPA fallback — serve index.html for unmatched client-side routes ──────
app.get('/api/*', async (c) => {
  const html = readFileSync(join(frontendDist, 'index.html'), 'utf-8');
  return c.html(html);
});

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
