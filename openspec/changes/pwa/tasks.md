# Tasks: PWA — Progressive Web App Support

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~170–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: Yes (resolved: single-pr)
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | PWA icons, config, SW registration | PR 1 | Single PR to main; fully additive, no dependencies |

## Phase 1: Logo + Public Assets

- [x] 1.1 Create `frontend/public/` and `frontend/public/coffee-cup.svg` — coffee cup outline with steam, 512×512 viewBox, gold stroke (#A67C52)
- [x] 1.2 ~Generate PNG~ Replaced by SVG-only approach — manifest references SVG directly (image/svg+xml)
- [x] 1.3 ~Generate PNG~ Replaced by SVG-only approach — manifest references SVG directly (image/svg+xml)

## Phase 2: vite-plugin-pwa Configuration

- [x] 2.1 Install `vite-plugin-pwa`: `cd frontend && npm install -D vite-plugin-pwa`
- [x] 2.2 Add `VitePWA()` plugin to `frontend/vite.config.ts` — manifest (name, theme_color, icons), workbox runtimeCaching (NetworkFirst for user API, StaleWhileRevalidate for recipes), auto-update (`registerType: 'autoUpdate'`), navigateFallback: `/index.html`
- [x] 2.3 Add PWA meta tags to `frontend/index.html` — manifest link, theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style

## Phase 3: Service Worker Registration

- [x] 3.1 Add conditional SW registration in `frontend/src/main.tsx` — guard with `'serviceWorker' in navigator`, import `virtual:pwa-register`, call `registerSW({ immediate: true })`

## Phase 4: Verification

- [x] 4.1 Build: `cd frontend && npx vite build` — verify `dist/sw.js`, `dist/manifest.webmanifest`, and SVG icons exist
- [ ] 4.2 Browser check: DevTools → Application tab → Manifest + Service Worker loaded; run offline navigation test
