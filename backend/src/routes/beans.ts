import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '../middleware/auth.js';
import { beanService } from '../services/bean-service.js';
import { createBeanSchema, updateBeanSchema, idParamSchema } from '../lib/validators.js';

const beanRouter = new Hono();

// All bean routes require authentication
beanRouter.use('*', authMiddleware);

// GET /api/beans — list current user's beans alphabetically
beanRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const beans = await beanService.list(userId);
  return c.json(beans);
});

// GET /api/beans/:id — get single bean with aggregate stats (scoped to user)
beanRouter.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const bean = await beanService.getByIdWithStats(id, userId);
  if (!bean) return c.json({ error: 'Coffee bean not found' }, 404);
  return c.json(bean);
});

// GET /api/beans/:id/brews — get brew history for a bean, newest-first (scoped to user)
beanRouter.get('/:id/brews', zValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const bean = await beanService.getById(id, userId);
  if (!bean) return c.json({ error: 'Coffee bean not found' }, 404);

  const brews = await beanService.getBrewsByBeanId(id, userId);
  return c.json(brews);
});

// POST /api/beans — create a new bean (userId set from auth context)
beanRouter.post('/', zValidator('json', createBeanSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const bean = await beanService.create(data, userId);
  return c.json(bean, 201);
});

// PUT /api/beans/:id — update a bean (only if owned)
beanRouter.put(
  '/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateBeanSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const bean = await beanService.update(id, data, userId);
    if (!bean) return c.json({ error: 'Coffee bean not found' }, 404);
    return c.json(bean);
  },
);

// DELETE /api/beans/:id — delete a bean (only if owned; SET NULL on references)
beanRouter.delete('/:id', zValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.valid('param');
  const deleted = await beanService.delete(id, userId);
  if (!deleted) return c.json({ error: 'Coffee bean not found' }, 404);
  return c.body(null, 204);
});

export default beanRouter;
