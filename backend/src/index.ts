import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { Hono } from 'hono';

import authRouter from './routes/auth';
import brewRouter from './routes/brews';
import beanRouter from './routes/beans';
import noteRouter from './routes/notes';
import recipeRouter from './routes/recipes';

const app = new Hono();

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use('/api/*', cors());

// ─── API Routes ─────────────────────────────────────────────────────────────

app.route('/api/auth', authRouter);
app.route('/api/brews', brewRouter);
app.route('/api/beans', beanRouter);
app.route('/api', noteRouter);
app.route('/api/recipes', recipeRouter);

// ─── Static frontend (production only) ──────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(
    '/*',
    serveStatic({
      root: '../frontend/dist',
    })
  );
}

// ─── Global error handler ──────────────────────────────────────────────────
// Returns JSON for all unhandled errors so the frontend never gets text/plain.

app.onError((err, c) => {
  console.error('[error]', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// ─── Start server ───────────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3001;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`☕ Bitácora Café API running on http://localhost:${info.port}`);
  }
);
