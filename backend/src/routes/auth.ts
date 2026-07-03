import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authService } from '../services/auth-service';
import { signJWT } from '../lib/auth';
import { authMiddleware } from '../middleware/auth';

const authRouter = new Hono();

// ─── Login (passwordless, direct) ───────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Accepts an email, upserts the user, and returns a signed JWT.
 * No magic link, no email — the user is authenticated immediately.
 * This is intentional for a personal app where email ownership is implicit.
 */
authRouter.post(
  '/login',
  zValidator('json', z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid('json');
    const user = await authService.upsertUser(email);
    const token = await signJWT({ userId: user.id, email: user.email });

    return c.json({ ok: true, token });
  },
);

// ─── Get Current User ────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 *
 * Protected endpoint. Requires a valid JWT in the Authorization header.
 * Returns the authenticated user's profile (id, email, createdAt).
 */
authRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await authService.getUser(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json(user);
});

export default authRouter;
