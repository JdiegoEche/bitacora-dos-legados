import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { brewService } from '../services/brew-service';
import { shareTokenParamSchema } from '../lib/validators';

const publicBrewRouter = new Hono();

// GET /api/public/brews/:shareToken — view a shared brew without auth
publicBrewRouter.get('/:shareToken', zValidator('param', shareTokenParamSchema), async (c) => {
  const { shareToken } = c.req.valid('param');
  const brew = await brewService.getByShareToken(shareToken);
  if (!brew) return c.json({ error: 'Brew not found or not shared' }, 404);
  return c.json(brew);
});

export default publicBrewRouter;
