import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

app.get('/api/health', (c) => c.json({ status: 'ok', runtime: 'edge' }));

app.post('/api/test', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json({ echo: true, body, method: c.req.method });
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json({ login: 'edge-test', received: body });
});

export const config = { runtime: 'edge' };

export default app.fetch;