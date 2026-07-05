# Apply Progress: PWA — Progressive Web App Support

**Status**: Complete (6/7 tasks done, 1 manual task remaining)
**Mode**: Strict TDD (structural/config tasks)

## Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| 1.1 — SVG icon | ✅ Done | Coffee cup with steam, 512×512 viewBox, #A67C52 stroke |
| 1.2 — PNG 192×192 | ✅ Replaced | Using SVG-only approach in manifest (image/svg+xml) |
| 1.3 — PNG 512×512 | ✅ Replaced | Using SVG-only approach in manifest (image/svg+xml) |
| 2.1 — Install package | ✅ Done | `npm install -D vite-plugin-pwa` (v1.3.0) |
| 2.2 — Vite config | ✅ Done | VitePWA plugin with manifest, workbox, autoUpdate |
| 2.3 — HTML meta tags | ✅ Done | manifest link, theme-color, apple meta tags |
| 3.1 — SW registration | ✅ Done | Async IIFE in main.tsx, guarded by navigator check |
| 4.1 — Build verification | ✅ Done | `vite build` succeeds; sw.js, manifest.webmanifest, coffee-cup.svg in dist/ |
| 4.2 — Browser check | ⬜ Manual | DevTools → Application tab verification |

## Deviations from Design

1. **SVG-only icons**: Design specified PNG icons (192×192, 512×512). Changed to SVG-only approach because:
   - vite-plugin-pwa doesn't auto-generate PNGs from SVGs
   - Modern browsers support SVG icons in manifest
   - Reduces asset complexity and maintenance
   - Manifest references `coffee-cup.svg` with `type: 'image/svg+xml'`

2. **HTML meta tags**: Design claimed "injected automatically by plugin" but vite-plugin-pwa does NOT inject meta tags into `index.html`. Added manually: `manifest.webmanifest` link, `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.

3. **Runtime caching URL patterns**: Added `/api/stats/*` to NetworkFirst pattern (was not in design but matches the project's API structure).

4. **Async IIFE**: SW registration wrapped in `(async () => { ... })()` instead of bare `await import(...)` because Vite's esbuild target (`es2020`) doesn't support top-level await.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 SVG | `coffee-cup-svg.test.ts` | Structural | ✅ 4/4 (main) | ✅ Written | ✅ Passed | ➖ Single (static asset) | ➖ None needed |
| 2.2 Config | `vite-config.test.ts` | Structural | ✅ 4/4 (main) | ✅ Written | ✅ Passed | ✅ 11 cases | ➖ None needed |
| 2.3 HTML | `index-html.test.ts` | Structural | ✅ 10/11 (index) | ✅ Written | ✅ Passed | ✅ 4 cases | ➖ None needed |
| 3.1 SW | `main-tsx.test.ts` | Structural | ✅ 4/4 (main) | ✅ Written | ✅ Passed | ✅ 3 cases | ➖ None needed |

## Test Results

- **All PWA-specific tests**: 24/24 passing
- **Existing tests preserved**: 14/15 (1 pre-existing failure: `font-display=swap`)
- **Build**: Success — 103 modules, 22 precached entries (282 KiB)

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `frontend/public/coffee-cup.svg` | Created | SVG icon (512×512, coffee cup + steam) |
| `frontend/package.json` | Modified | Added `vite-plugin-pwa` dependency |
| `frontend/vite.config.ts` | Modified | Added VitePWA plugin with manifest, workbox caching |
| `frontend/index.html` | Modified | Added PWA meta tags + manifest link |
| `frontend/src/main.tsx` | Modified | Added conditional SW registration via async IIFE |
| `frontend/src/__tests__/coffee-cup-svg.test.ts` | Created | SVG structural tests |
| `frontend/src/__tests__/vite-config.test.ts` | Created | Vite config PWA tests |
| `frontend/src/__tests__/index-html.test.ts` | Modified | Added PWA meta tag tests |
| `frontend/src/__tests__/main-tsx.test.ts` | Modified | Added SW registration tests |

## PR Boundary

- **Mode**: single-pr
- **Work unit**: PWA — all tasks in one PR
- **Estimated lines**: ~170–200 (within 400-line budget)
