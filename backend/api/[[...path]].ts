import { handle } from 'hono/vercel';
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.get('/api/ping', (c) => c.json({ message: 'pong' }));

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
