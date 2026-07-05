# Design: PWA — Progressive Web App Support

## Technical Approach

Add offline resilience and installability to the existing Vite 6 + React 18 SPA using `vite-plugin-pwa` in `generateSW` mode. The plugin wraps Workbox to produce a service worker that precaches hashed static assets on install, applies runtime caching strategies per API route group, and serves `/index.html` as SPA fallback for all navigation requests. No backend changes — the service worker intercepts existing `/api/*` routes on the client side. This maps to proposal §Approach and satisfies all PWA-REQ-* specs.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| **generateSW** vs injectManifest | generateSW: zero custom SW code, workbox config-driven. injectManifest: full control, but manual caching logic and more maintenance. | **generateSW** — no custom SW behavior needed; config covers all caching strategies. |
| **Auto-update** vs update prompt | Auto-update: immediate activation via `skipWaiting()`+`clients.claim()`. Prompt: user chooses when, but more UX complexity. | **Auto-update** — per PWA-REQ-8; small app, fast deploys, no data loss risk. |
| **CacheFirst** for static assets | Hashed filenames guarantee immutability → CacheFirst is safe; StaleWhileRevalidate would add unnecessary network checks. | **CacheFirst** — per PWA-REQ-4; hash in filename is the invariant. |
| **NetworkFirst** for user API data | NetworkFirst with 3s timeout: fresh data when online, cached data when offline. CacheOnly would serve stale data even when online. | **NetworkFirst** — per PWA-REQ-5; auth, beans, brews are user-critical. |
| **StaleWhileRevalidate** for recipes | Recipes are public catalog data — instant cache response + background refresh is ideal. NetworkFirst would add latency. | **StaleWhileRevalidate** — per PWA-REQ-6; recipes are read-heavy, low-churn. |
| **Inline SVG in plugin** vs manual PNG generation | Plugin can auto-generate PNGs from SVG via `pwa-asset-generator`. Manual: more control over output quality. | **Manual SVG + PNG** — single SVG source in `public/`, convert to PNGs; the plugin only consumes PNGs. Simple, reproducible. |

## Service Worker Lifecycle

```
Browser loads app
       │
       ▼
main.tsx registers SW ──► SW install event
       │                        │
       │              ┌─────────▼──────────┐
       │              │  Precache manifest  │
       │              │  (JS/CSS/HTML/SVG)  │
       │              └─────────┬──────────┘
       │                        │
       │              ┌─────────▼──────────┐
       │              │ self.skipWaiting()  │
       │              └─────────┬──────────┘
       │                        │
       ▼              ┌─────────▼──────────┐
SW activate event     │  clients.claim()    │
       │              │  cleanup old caches │
       │              └─────────┬──────────┘
       ▼                        ▼
Fetch events routed by workbox strategies:
  ┌─ CacheFirst:      *.js, *.css, *.png, *.woff2
  ├─ NetworkFirst:    /api/auth/*, /api/beans/*, /api/brews/*
  ├─ StaleWhileReval: /api/recipes*
  └─ navigateFallback: all other navigations → /index.html
```

## Vite Config Structure

```ts
// frontend/vite.config.ts — ADD vite-plugin-pwa block
plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',              // skipWaiting + clients.claim
    includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
    manifest: {
      name: 'Bitácora Café',
      short_name: 'Bitácora',
      description: 'Tu diario de catación de café',
      theme_color: '#292524',                // stone-800
      background_color: '#1C1917',           // stone-900
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/(auth|beans|brews)\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-data',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 50, maxAgeSeconds: 604800 }, // 7d
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^\/api\/recipes.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-recipes',
            expiration: { maxEntries: 20, maxAgeSeconds: 604800 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
    },
  }),
],
```

HTML meta tags (`theme-color`, `apple-mobile-web-app-capable`, `viewport`) and the manifest `<link>` are injected automatically by the plugin. No manual edits to `index.html` needed.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/package.json` | Modify | Add `vite-plugin-pwa` as dependency |
| `frontend/vite.config.ts` | Modify | Add `VitePWA()` plugin with manifest and workbox config |
| `frontend/src/main.tsx` | Modify | Register service worker on mount (conditional SW check) |
| `frontend/public/coffee-cup.svg` | Create | SVG logo source (coffee cup, 512×512 viewBox) |
| `frontend/public/pwa-192x192.png` | Create | 192×192 PNG icon (converted from SVG) |
| `frontend/public/pwa-512x512.png` | Create | 512×512 PNG icon (converted from SVG) |

## Interfaces / Contracts

No new TypeScript interfaces. The plugin types (`import { VitePWA } from 'vite-plugin-pwa'`) are self-contained. The SW registration in `main.tsx` uses the standard `navigator.serviceWorker.register()` API.

```ts
// Registration pattern (main.tsx)
if ('serviceWorker' in navigator) {
  const { registerSW } = await import('virtual:pwa-register');
  registerSW({ immediate: true });
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `main.tsx` SW registration | Spy on `navigator.serviceWorker.register`; verify called on mount, skipped when absent |
| Build | Manifest + SW generated | After `vite build`, assert `dist/manifest.webmanifest` and `dist/sw.js` exist |
| E2E | Lighthouse PWA audit | Run `lighthouse` CLI against production build; verify installability + offline pass |
| Manual | Offline navigation | DevTools → Network → Offline; verify app shell + cached API routes render |
| Manual | Install prompt | Chrome → Install icon appears in address bar; standalone window launches with correct theme |

## Migration / Rollout

No migration required. PWA is fully additive — existing users continue without service worker. New users get installability on next deploy. Rollback: revert config, remove dependency, delete public/ icons, unregister SW in browser.

## Open Questions

None — all decisions are resolved by specs and this design.
