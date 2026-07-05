import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getTastingWords } from '../services/stats-service';

const statsRouter = new Hono();

// All stats routes require authentication
statsRouter.use('*', authMiddleware);

// GET /api/stats/tasting-words — top-5 words per tasting category
statsRouter.get('/tasting-words', async (c) => {
  const userId = c.get('userId');
  const result = await getTastingWords(userId);
  return c.json(result);
});

export default statsRouter;
