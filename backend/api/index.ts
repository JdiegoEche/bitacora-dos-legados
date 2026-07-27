import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../src/app.js';

export const config = { runtime: 'nodejs' };

type VercelRequest = IncomingMessage & {
  body?: unknown;
  rawBody?: Buffer;
};

function toFetchHeaders(incoming: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(incoming.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.append(key, value);
    }
  }
  // Vercel may re-serialize the body (see below), so the original
  // content-length no longer applies — let Request compute its own.
  headers.delete('content-length');
  return headers;
}

// Vercel's Node.js runtime pre-parses JSON/urlencoded bodies into `req.body`
// (and may expose the raw bytes as `req.rawBody`), draining the underlying
// stream before it reaches us. Reading `req` as a stream a second time hangs
// forever, so we rebuild the body from what Vercel already parsed instead.
export default async function handler(req: VercelRequest, res: ServerResponse) {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  const url = new URL(req.url ?? '/', `${proto}://${host}`);

  let body: Buffer | string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (Buffer.isBuffer(req.rawBody)) {
      body = req.rawBody;
    } else if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
  }

  const request = new Request(url, {
    method: req.method,
    headers: toFetchHeaders(req),
    body,
  });

  const response = await app.fetch(request);
  const buf = Buffer.from(await response.arrayBuffer());
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(buf);
}
