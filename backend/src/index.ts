import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import app from './app.js';

// ─── Static frontend (production only) ──────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(
    '/*',
    serveStatic({
      root: './frontend-dist',
    })
  );
}

// ─── Start server ───────────────────────────────────────────────────────────

const port = Number(process.env.PORT) || 3001;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`☕ Bitácora Café API running on http://localhost:${info.port}`);
  }
);
