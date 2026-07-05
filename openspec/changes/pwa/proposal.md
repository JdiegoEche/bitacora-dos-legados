# Proposal: PWA — Progressive Web App Support

## Intent

Make Bitácora Café installable as a standalone app and partially functional offline. Users on slow or unreliable networks should still be able to browse the app, view cached content, and navigate SPA routes without a network connection.

## Scope

### In Scope
- Service worker via `vite-plugin-pwa` (generateSW mode)
- Web app manifest with theme color (#292524), display mode (standalone), and SVG icons
- SVG logo (coffee cup icon or "BC" text mark)
- Auto-update strategy (`self.skipWaiting()` + `clients.claim()`)
- Offline caching: CacheFirst for hashed static assets, NetworkFirst for `/api/auth/*`, `/api/beans/*`, `/api/brews/*`, StaleWhileRevalidate for `/api/recipes*`
- `navigateFallback: /index.html` for SPA client-side routing

### Out of Scope
- TanStack Query offline persistence (deferred to v2)
- Full offline mutation support (deferred to v2)
- Push notifications
- Background sync
- Custom install prompt UI

## Capabilities

### New Capabilities
- `pwa-support`: Service worker registration, web app manifest, installability, and workbox-based runtime caching for offline resilience.

### Modified Capabilities
None — PWA is a new concern with no existing spec coverage.

## Approach

1. Install `vite-plugin-pwa` in the frontend package.
2. Create `frontend/public/` directory with SVG logo icons (192×192, 512×512).
3. Configure `vite-plugin-pwa` in `vite.config.ts` with generateSW mode, `self.skipWaiting()`, `clients.claim()`, workbox `runtimeCaching` rules per API route group, and `navigateFallback: /index.html`.
4. Register the service worker in `frontend/src/main.tsx`.
5. Verify build produces service worker and manifest links in the HTML output.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/public/pwa-192x192.png` | New | PWA icon (192×192) |
| `frontend/public/pwa-512x512.png` | New | PWA icon (512×512) |
| `frontend/vite.config.ts` | Modified | Add vite-plugin-pwa configuration |
| `frontend/src/main.tsx` | Modified | Register service worker |
| `frontend/package.json` | Modified | Add vite-plugin-pwa dependency |
| `frontend/index.html` | Modified | Manifest and meta tags injected by plugin |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Google Fonts not available offline | High | Fallback to system fonts; consider self-hosting font subset |
| Auth routes fail when offline | Med | NetworkFirst with reasonable timeout; show cached auth UI |
| No `frontend/public/` dir exists yet | Low | The plugin works with or without it; create on setup |
| SW cache invalidation on deploy | Low | Auto-update strategy handles new SW activation |

## Rollback Plan

Revert `vite.config.ts` changes, remove `vite-plugin-pwa` from `package.json`, delete `frontend/public/pwa-*` icons, unregister SW in browser devtools (`navigator.serviceWorker.getRegistrations()`).

## Dependencies

- `vite-plugin-pwa` (latest)
- SVG logo source file (to be generated)

## Success Criteria

- [ ] Lighthouse PWA audit passes installability checks
- [ ] App installs as standalone window with correct name, icons, theme color
- [ ] App loads and navigates offline after initial visit
- [ ] `/api/beans/*` responses served from cache when offline
- [ ] Static JS/CSS chunks served from cache (CacheFirst)
- [ ] SPA routes (`/beans`, `/brews`, `/recipes`) work offline via navigateFallback
- [ ] Service worker auto-updates on new deploy
