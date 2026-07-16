import { handle } from 'hono/vercel';
import app from '../dist/app.js';

export const config = {
  runtime: 'nodejs20.x',
};

export default handle(app);
