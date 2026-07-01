import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { beanService } from '../services/bean-service';
import { createBeanSchema, updateBeanSchema, idParamSchema } from '../lib/validators';

const beanRouter = new Hono();

// GET /api/beans — list all beans alphabetically
beanRouter.get('/', async (c) => {
  const beans = await beanService.list();
  return c.json(beans);
});

// GET /api/beans/:id — get single bean with aggregate stats
beanRouter.get('/:id', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const bean = await beanService.getByIdWithStats(id);
  if (!bean) return c.json({ error: 'Coffee bean not found' }, 404);
  return c.json(bean);
});

// GET /api/beans/:id/brews — get brew history for a bean, newest-first with tasting notes summary
beanRouter.get('/:id/brews', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const bean = await beanService.getById(id);
  if (!bean) return c.json({ error: 'Coffee bean not found' }, 404);

  const brews = await beanService.getBrewsByBeanId(id);
  return c.json(brews);
});

// POST /api/beans — create a new bean
beanRouter.post('/', zValidator('json', createBeanSchema), async (c) => {
  const data = c.req.valid('json');
  const bean = await beanService.create(data);
  return c.json(bean, 201);
});

// PUT /api/beans/:id — update a bean
beanRouter.put(
  '/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateBeanSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const bean = await beanService.update(id, data);
    if (!bean) return c.json({ error: 'Coffee bean not found' }, 404);
    return c.json(bean);
  }
);

// DELETE /api/beans/:id — delete a bean (SET NULL on references)
beanRouter.delete('/:id', zValidator('param', idParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const deleted = await beanService.delete(id);
  if (!deleted) return c.json({ error: 'Coffee bean not found' }, 404);
  return c.body(null, 204);
});

export default beanRouter;
