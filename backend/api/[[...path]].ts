import app from '../src/app.js';

export const config = { runtime: 'nodejs' };

/**
 * Vercel Node.js runtime calls the handler with Express-style (req, res).
 * Hono's app.fetch() expects a standard Request object.
 * This adapter converts between the two.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // 1. Build the URL from the Vercel request
  const proto = req.headers['x-forwarded-proto'] ?? 'https';
  const host = req.headers['x-forwarded-host'] ?? req.headers['host'] ?? 'localhost';
  const url = new URL(req.url ?? '/', `${proto}://${host}`);

  // 2. Convert headers to the standard Headers API
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v as string));
    } else {
      headers.set(key, value as string);
    }
  }

  // 3. Read body for methods that support it
  let body: string | undefined;
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    if (req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else {
      body = await new Promise<string>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks).toString()));
      });
    }
  }

  // 4. Create a standard Request and let Hono handle it
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: body ?? undefined,
  });

  const response = await app.fetch(request);

  // 5. Send the Hono response back through Vercel's ServerResponse
  const responseBody = await response.text();
  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(responseBody);
}
