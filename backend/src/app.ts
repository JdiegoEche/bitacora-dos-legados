import { cors } from 'hono/cors';
import { Hono } from 'hono';

import authRouter from './routes/auth';
import brewRouter from './routes/brews';
import beanRouter from './routes/beans';
import noteRouter from './routes/notes';
import recipeRouter from './routes/recipes';
import publicBrewRouter from './routes/public';

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

export default app;
