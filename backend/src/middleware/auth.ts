import type { Context, Next } from 'hono';
import { verifyJWT } from '../lib/auth.js';

/**
 * Auth middleware for Hono.
 * Extracts Bearer token from Authorization header, verifies the JWT,
 * and injects the userId into the request context.
 *
 * Returns 401 Unauthorized if:
 * - Authorization header is missing or doesn't start with "Bearer "
 * - Token is invalid, expired, or tampered
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verifyJWT(token);
    c.set('userId', payload.userId);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
}
