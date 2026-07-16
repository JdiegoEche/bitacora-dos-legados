import { handle } from 'hono/vercel';
// @ts-expect-error — dist/app.js is compiled from src/app.ts, no declarations needed
import app from '../dist/app.js';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
