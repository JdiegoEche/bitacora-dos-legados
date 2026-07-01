import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { brewService } from '../services/brew-service';
import { createBrewSchema, updateBrewSchema, idParamSchema } from '../lib/validators';

const brewRouter = new Hono();

// GET /api/brews — list all brews newest-first
brewRouter.get('/', async (c) => {
  const brews = await brewService.list();
  return c.json(brews);
});

// GET /api/brews/:id — get single brew with relations
brewRouter.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const brew = await brewService.getById(id);
  if (!brew) return c.json({ error: 'Brew session not found' }, 404);
  return c.json(brew);
});

// POST /api/brews — create a new brew
brewRouter.post('/', zValidator('json', createBrewSchema), async (c) => {
  const data = c.req.valid('json');
  const brew = await brewService.create(data);
  return c.json(brew, 201);
});

// PUT /api/brews/:id — update a brew
brewRouter.put(
  '/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateBrewSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const brew = await brewService.update(id, data);
    if (!brew) return c.json({ error: 'Brew session not found' }, 404);
    return c.json(brew);
  }
);

// DELETE /api/brews/:id — delete a brew (cascades to notes)
brewRouter.delete('/:id', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const deleted = await brewService.delete(id);
  if (!deleted) return c.json({ error: 'Brew session not found' }, 404);
  return c.body(null, 204);
});

export default brewRouter;
