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

/** Try multiple strategies to get the request body. */
async function getBody(req: any): Promise<string | undefined> {
  // Strategy 1: Vercel's body parser already ran
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString();
    return JSON.stringify(req.body);
  }
  // Strategy 2: Read raw from stream
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length) return Buffer.concat(chunks).toString();
  // Strategy 3: Readable already consumed — check rawBody
  if (req.rawBody) return req.rawBody.toString();
  return undefined;
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
      body = await getBody(_req);
    }

    // Debug: log body info
    console.log('[handler] body length:', body?.length ?? 0, 'body exists:', !!body);

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
