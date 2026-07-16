import { cors } from 'hono/cors';
import { Hono } from 'hono';

import authRouter from './routes/auth.js';
import brewRouter from './routes/brews.js';
import beanRouter from './routes/beans.js';
import noteRouter from './routes/notes.js';
import recipeRouter from './routes/recipes.js';
import publicBrewRouter from './routes/public.js';

const app = new Hono();

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use('/api/*', cors());

// ─── API Routes ─────────────────────────────────────────────────────────────

app.route('/api/auth', authRouter);
app.route('/api/brews', brewRouter);
app.route('/api/beans', beanRouter);
app.route('/api', noteRouter);
app.route('/api/recipes', recipeRouter);
app.route('/api/public/brews', publicBrewRouter);

// ─── Global error handler ──────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[error]', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/api/health', (c) => c.json({ status: 'ok' }));

// ─── Debug: echo without reading body ───────────────────────────────────────

app.all('/api/echo', (c) => {
  return c.json({
    echo: true,
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    contentType: c.req.header('content-type'),
    hasBody: !!c.req.header('content-length'),
  });
});

export default app;
