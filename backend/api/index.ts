import app from '../src/app.js';

export const config = { runtime: 'nodejs' };

function toHeaders(src: Record<string, string | string[] | undefined>): Headers {
  const dst = new Headers();
  for (const [key, value] of Object.entries(src)) {
    if (!value) continue;
    if (Array.isArray(value)) value.forEach((v) => dst.append(key, v));
    else dst.set(key, value);
  }
  return dst;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(_req: any, res: any) {
  const timeout = setTimeout(() => {
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Function timed out' }));
  }, 12_000);

  try {
    const host = _req.headers['x-forwarded-host'] ?? _req.headers['host'] ?? 'bitacora-dos-legados-7m9r.vercel.app';
    const url = new URL(_req.url ?? '/', `https://${host}`);
    const headers = toHeaders(_req.headers);

    // Vercel Node.js runtime auto-parses JSON/urlencoded body into _req.body
    let body: string | undefined;
    if (_req.method && !['GET', 'HEAD'].includes(_req.method)) {
      if (_req.body !== undefined) {
        body = typeof _req.body === 'object' ? JSON.stringify(_req.body) : String(_req.body);
      }
    }

    const request = new Request(url.toString(), {
      method: _req.method ?? 'GET',
      headers,
      body: body?.length ? body : undefined,
    });

    const response = await app.fetch(request);
    const responseBody = await response.text();
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(responseBody);
  } catch (err) {
    console.error('[handler] error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  } finally {
    clearTimeout(timeout);
  }
}