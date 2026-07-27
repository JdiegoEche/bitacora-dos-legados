import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['coffee-cup.svg'],
      manifest: {
        name: 'Bitácora Café',
        short_name: 'Bitácora',
        description: 'Coffee brewing journal',
        theme_color: '#292524',
        background_color: '#1C1917',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'coffee-cup.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/(beans|brews|stats)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-user',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /^\/api\/recipes\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-recipes',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\/.*/],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
