// Step 1: test importing hono/hono at module top-level
import { Hono } from 'hono';

const t1 = Date.now();
const _honocheck = typeof Hono; // force module load
console.log('[cold-start] hono loaded in', Date.now() - t1, 'ms');

export const config = { runtime: 'nodejs' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(_req: any, res: any) {
  const app = new Hono();
  app.get('/api/health', (c) => c.json({ status: 'ok-from-hono' }));
  app.get('/api/test', (c) => c.json({ hono_loaded: true, mode: typeof hono }));

  const url = new URL(_req.url ?? '/', `https://${_req.headers.host ?? 'localhost'}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(_req.headers)) {
    if (!value) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.set(key, v as string));
    else headers.set(key, value as string);
  }

  const request = new Request(url.toString(), {
    method: _req.method ?? 'GET',
    headers,
    body: _req.method && !['GET', 'HEAD'].includes(_req.method)
      ? (_req.body ? (typeof _req.body === 'string' ? _req.body : JSON.stringify(_req.body)) : undefined)
      : undefined,
  });

  try {
    const response = await app.fetch(request);
    const body = await response.text();
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(body);
  } catch (err) {
    console.error('[handler] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  }
}
