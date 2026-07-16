import app from '../src/app.js';

export const config = { runtime: 'nodejs' };

/**
 * Convierte headers de Node.js IncomingMessage a Headers estándar.
 */
function toHeaders(src: Record<string, string | string[] | undefined>): Headers {
  const dst = new Headers();
  for (const [key, value] of Object.entries(src)) {
    if (!value) continue;
    if (Array.isArray(value)) value.forEach((v) => dst.append(key, v));
    else dst.set(key, value);
  }
  return dst;
}

/**
 * Lee el body completo de un IncomingMessage.
 */
function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    if ((req as any).body) {
      resolve(typeof (req as any).body === 'string' ? (req as any).body : JSON.stringify((req as any).body));
      return;
    }
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(_req: any, res: any) {
  const timeout = setTimeout(() => {
    res.writeHead(504, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Function timed out' }));
  }, 10_000);

  try {
    const url = new URL(_req.url ?? '/', `https://${_req.headers.host ?? 'localhost'}`);
    const headers = toHeaders(_req.headers);

    let body: string | undefined;
    if (_req.method && !['GET', 'HEAD'].includes(_req.method)) {
      body = await readBody(_req);
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
