import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { recipeService } from '../services/recipe-service';
import { recipeQuerySchema, recipeIdParamSchema } from '../lib/validators';

const recipeRouter = new Hono();

// GET /api/recipes — list all recipes, optional ?method= filter
recipeRouter.get('/', zValidator('query', recipeQuerySchema), async (c) => {
  const { method } = c.req.valid('query');
  const recipes = await recipeService.list(method);
  // Strip steps from list response — steps only in detail
  const result = recipes.map(({ steps: _steps, ...rest }) => rest);
  return c.json(result);
});

// GET /api/recipes/:id — get single recipe with parsed steps
recipeRouter.get('/:id', zValidator('param', recipeIdParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  const recipe = await recipeService.getById(id);
  if (!recipe) return c.json({ error: 'Recipe not found' }, 404);
  return c.json(recipe);
});

export default recipeRouter;
