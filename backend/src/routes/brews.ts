import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth';
import { brewService } from '../services/brew-service';
import { createBrewSchema, updateBrewSchema, idParamSchema } from '../lib/validators';

const brewRouter = new Hono();

// All brew routes require authentication
brewRouter.use('*', authMiddleware);

// GET /api/brews — list current user's brews newest-first
brewRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const brews = await brewService.list(userId);
  return c.json(brews);
});

// GET /api/brews/:id — get single brew with relations (scoped to user)
brewRouter.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const brew = await brewService.getById(id, userId);
  if (!brew) return c.json({ error: 'Brew session not found' }, 404);
  return c.json(brew);
});

// POST /api/brews — create a new brew (userId set from auth context)
brewRouter.post('/', zValidator('json', createBrewSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const brew = await brewService.create(
    { ...data, brewTime: Number(data.brewTime) },
    userId,
  );
  return c.json(brew, 201);
});

// PUT /api/brews/:id — update a brew (only if owned)
brewRouter.put(
  '/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateBrewSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const brew = await brewService.update(
      id,
      {
        ...data,
        brewTime: data.brewTime ? Number(data.brewTime) : undefined,
      },
      userId,
    );
    if (!brew) return c.json({ error: 'Brew session not found' }, 404);
    return c.json(brew);
  },
);

// DELETE /api/brews/:id — delete a brew (only if owned; cascades to notes)
brewRouter.delete('/:id', zValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const deleted = await brewService.delete(id, userId);
  if (!deleted) return c.json({ error: 'Brew session not found' }, 404);
  return c.body(null, 204);
});

export default brewRouter;
