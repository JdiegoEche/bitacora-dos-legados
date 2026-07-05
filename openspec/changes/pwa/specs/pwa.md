# PWA Support Specification

## Purpose

Progressive Web App support makes Bitácora Café installable as a standalone app and partially functional offline. Users on slow or unreliable networks browse cached content and navigate SPA routes without a connection.

## Requirements

### PWA-REQ-1: Installability

The app MUST be installable via the browser's "Add to Home Screen" prompt. The install event MUST be captured; the system MUST NOT suppress the default prompt.

#### Scenario: Install prompt appears

- GIVEN a user visits the app on a supported browser
- WHEN installability criteria are met
- THEN the browser shows the "Add to Home Screen" prompt

#### Scenario: Standalone launch

- GIVEN the user has installed the app
- WHEN they open it from the home screen
- THEN the app launches in standalone mode with no browser chrome

### PWA-REQ-2: Web App Manifest

The system MUST generate `manifest.webmanifest` with `name: "Bitácora Café"`, `theme_color: "#292524"`, `display: "standalone"`, `start_url: "/"`, and icon entries at 192×192 and 512×512.

#### Scenario: Manifest served

- GIVEN the app is built
- WHEN the browser requests `/manifest.webmanifest`
- THEN the manifest JSON includes all required fields and valid icon entries

### PWA-REQ-3: Service Worker Registration

The system MUST register the service worker on app load in `main.tsx`. Registration MUST be conditional on `'serviceWorker' in navigator`.

#### Scenario: SW registers on load

- GIVEN a user visits the app
- WHEN `main.tsx` executes
- THEN the service worker is registered and the `register` promise resolves

#### Scenario: Graceful degradation

- GIVEN an older browser without SW support
- WHEN the app loads
- THEN no error is thrown; registration is silently skipped

### PWA-REQ-4: Static Asset Caching (CacheFirst)

The system MUST precache hashed static assets (JS chunks, CSS) on service worker install. These MUST be served from cache on subsequent loads without a network request.

#### Scenario: Assets cached on install

- GIVEN the SW installs
- WHEN the `install` event fires
- THEN all hashed static assets from the precache manifest are stored in the cache

#### Scenario: App shell loads offline

- GIVEN the user has visited the app at least once
- WHEN they reload while offline
- THEN the app shell (HTML, JS, CSS) loads without errors

### PWA-REQ-5: API Cache (NetworkFirst)

The system MUST apply a NetworkFirst strategy for `/api/auth/*`, `/api/beans/*`, and `/api/brews/*` with a 3-second network timeout, falling back to cache.

#### Scenario: Offline API data

- GIVEN the user previously fetched bean data while online
- WHEN they revisit `/bitacora` while offline
- THEN previously fetched responses are served from cache

### PWA-REQ-6: Recipe Cache (StaleWhileRevalidate)

The system MUST apply StaleWhileRevalidate for `/api/recipes*`, serving cached recipes immediately and updating from the network in the background.

#### Scenario: Recipes readable offline

- GIVEN the user previously loaded the recipe catalog
- WHEN they open `/recetas` while offline
- THEN cached recipe data renders on screen

### PWA-REQ-7: navigateFallback

The system MUST set `navigateFallback: "/index.html"` so all SPA routes return the app shell when offline.

#### Scenario: Offline SPA navigation

- GIVEN the user is offline
- WHEN they navigate to `/beans`, `/brews`, `/recetas`, or `/bitacora`
- THEN the app shell renders instead of a browser error page

### PWA-REQ-8: Auto-update

The service worker MUST call `self.skipWaiting()` on install and `clients.claim()` on activate. A new SW MUST take control immediately without requiring a page reload.

#### Scenario: New version activates

- GIVEN a new app version is deployed
- WHEN the user visits the app
- THEN the new SW installs, activates, and claims all clients

### PWA-REQ-9: App Icons

The system MUST generate PNG icons at 192×192 and 512×512, plus a maskable variant. Icons MUST derive from the SVG logo.

#### Scenario: Icons in manifest

- GIVEN the app is built
- WHEN the manifest is fetched
- THEN icon entries for 192×192 and 512×512 point to valid PNG files

### PWA-REQ-10: Meta Tags

`index.html` MUST include `<meta name="theme-color" content="#292524">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

#### Scenario: Tags rendered

- GIVEN the app is built
- WHEN `index.html` is served
- THEN it contains all required meta tags

### PWA-REQ-11: Logo SVG

The system MUST include a coffee cup SVG in `frontend/public/` at 512×512 resolution as the source for all icon variants.

#### Scenario: SVG exists

- GIVEN the project files
- WHEN checking `frontend/public/`
- THEN a coffee-cup SVG file exists

## API Contract

None — PWA is frontend-only. All caching strategies act on existing API routes.

## UI Component Mapping

| Area | File | Purpose |
|------|------|---------|
| SW Registration | `frontend/src/main.tsx` | Register service worker on app boot |
| PWA Config | `frontend/vite.config.ts` | vite-plugin-pwa manifest, workbox, icons |
| Logo Source | `frontend/public/` | Coffee cup SVG → generated PNG icons |
| Meta | `frontend/index.html` | theme-color, apple-mobile-web-app-capable, viewport |
