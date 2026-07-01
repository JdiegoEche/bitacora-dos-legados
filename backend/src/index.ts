import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { Hono } from 'hono';

import brewRouter from './routes/brews';
import beanRouter from './routes/beans';
import noteRouter from './routes/notes';

const app = new Hono();

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use('/api/*', cors());

// ─── API Routes ─────────────────────────────────────────────────────────────

app.route('/api/brews', brewRouter);
app.route('/api/beans', beanRouter);
app.route('/api', noteRouter);

// ─── Static frontend (production only) ──────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(
    '/*',
    serveStatic({
      root: '../frontend/dist',
    })
  );
}

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
