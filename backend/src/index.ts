import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import app from './app';

// ─── Static frontend (production only) ──────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  app.use(
    '/*',
    serveStatic({
      root: join(__dirname, '../frontend-dist'),
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
