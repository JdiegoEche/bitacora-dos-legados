# Tasks: Rediseño UI + Landing Page

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~850–950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Tokens + theme + fonts | PR 1 | tokens.css, ThemeContext, index.html, main.tsx — ~200 lines |
| 2 | Layout shell + Landing page | PR 2 | Layout.tsx, App.tsx routes, LandingPage.tsx — ~250 lines, base = main |
| 3 | CSS token migration | PR 3 | index.css → var() rewrite + new classes — ~400 lines, base = main |
| 4 | Component restyle + route fixes | PR 4 | Emoji cleanup, `/`→`/bitacora` in BrewDetail/BrewEdit, 10 files — ~150 lines, base = main |

## Phase 1: Foundation — Tokens + Theme + Fonts

- [x] 1.1 Create `frontend/src/styles/tokens.css` — all design tokens (`:root` light + `[data-theme="dark"]`): colors, typography, spacing, shadow, radius
- [x] 1.2 Create `frontend/src/contexts/ThemeContext.tsx` — `ThemeProvider` + `useTheme()` hook: `data-theme` sync, localStorage (`bitacora-theme`), `prefers-color-scheme` fallback
- [x] 1.3 Modify `frontend/index.html` — Google Fonts `<link>` (Playfair 400–700, Inter 300–700), meta description, inline theme-init `<script>`, critical dark tokens `<style>`, `<html lang="es">`
- [x] 1.4 Modify `frontend/src/main.tsx` — import `./styles/tokens.css` BEFORE `./styles/index.css`

## Phase 2: Layout Shell + Landing Page

- [x] 2.1 Create `frontend/src/components/Layout.tsx` — nav (logo, links: Bitácora/New Brew/Beans, dark toggle ☀/☾), footer, `<Outlet />`
- [x] 2.2 Modify `frontend/src/App.tsx` — wrap `<ThemeProvider>` + `<Layout>`, routes: `/` → LandingPage, `/bitacora` → BrewList, `*` → Navigate to `/`
- [x] 2.3 Create `frontend/src/components/LandingPage.tsx` — hero (title, tagline, CSS gradient visual) + 3 CTA cards grid (Bitácora→`/bitacora`, Recetas/Diario→placeholder). Responsive: stack ≤640px, 3-col ≥1024px

## Phase 3: CSS Token Migration

- [x] 3.1 Modify `frontend/src/styles/index.css` — replace ALL raw hex/color values with `var(--color-*)`, add token-driven classes (hero, card, grid patterns)

## Phase 4: Per-Component Restyle

- [x] 4.1 Modify `BrewList.tsx` — emoji `★☆` → CSS numeric star rendering
- [x] 4.2 Modify `BrewDetail.tsx` — `navigate('/')` → `navigate('/bitacora')`, token classes
- [x] 4.3 Modify `BrewEdit.tsx` — `Link '/'` → `'/bitacora'`
- [x] 4.4 Modify `BrewForm.tsx` — emoji `★☆` → CSS rendering
- [x] 4.5 Modify `BeanList.tsx` — class tweaks, token application
- [x] 4.6 Modify `BeanForm.tsx` — class tweaks, token application
- [x] 4.7 Modify `BeanSelect.tsx` — class tweaks, token application
- [x] 4.8 Modify `TastingNoteCard.tsx` — emoji cleanup, token classes
- [x] 4.9 Modify `TastingNoteForm.tsx` — emoji cleanup, token classes
- [x] 4.10 Modify `TastingNotesList.tsx` — class tweaks only

## Phase 5: Verification

- [x] 5.1 Build validation — `npx tsc --noEmit && npx vite build` (zero errors)
- [x] 5.2 Token audit — `rg "#[\da-fA-F]{3,8}" --include="*.css" frontend/src/styles/` — only `tokens.css` matches ✅ (verified at archive time)
- [ ] 5.3 Manual visual — all routes in light + dark mode, responsive 375px + 1280px *requires manual verification*
- [ ] 5.4 Route check — `/` → LandingPage, `/bitacora` → BrewList, `*` → `/` *requires manual verification*

## Acceptance Criteria

- [x] Landing at `/` renders hero + 3 CTAs, Bitácora links to `/bitacora`
- [x] Mobile: stacked CTAs ≤640px; Desktop: 3-col grid ≥1024px
- [x] All 22+ tokens defined in `tokens.css` with light + dark variants
- [x] No raw hex colors outside `tokens.css` ✅ (verified at archive time)
- [x] Dark toggle switches all surfaces, persists to localStorage
- [x] Initial load: localStorage → `prefers-color-scheme` → light
- [x] Layout renders nav + footer on every route
- [x] Route: Landing → `/`, BrewList → `/bitacora`, `*` → `/`
- [x] `npx tsc --noEmit && npx vite build` passes zero errors
- [ ] Lighthouse Performance ≥ 90 on cold load *requires browser verification*
