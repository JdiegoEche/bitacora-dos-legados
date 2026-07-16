import app from '../src/app.js';

export const config = { runtime: 'nodejs' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(_req: any, res: any) {
  // Timeout so the function never hangs indefinitely
  const timeout = setTimeout(() => {
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Function timed out' }));
  }, 10_000);

  try {
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
        ? (_req.body
            ? (typeof _req.body === 'string' ? _req.body : JSON.stringify(_req.body))
            : undefined)
        : undefined,
    });

    const response = await app.fetch(request);
    const body = await response.text();
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(body);
  } catch (err) {
    console.error('[handler] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  } finally {
    clearTimeout(timeout);
  }
}
