# Landing Page Specification

## Purpose

The landing page at `/` introduces the Bitácora Café brand with a hero section and three CTA cards. It is a static page — no data fetches, no backend calls — optimized for sub-second cold load.

## Requirements

### Requirement: LPG-REQ-1 — Render hero section

The landing page MUST display a hero section with brand title, tagline subtitle, and a warm coffee visual (inline SVG or CSS gradient — no external images).

#### Scenario: Hero renders on load

- GIVEN a user visits `/`
- WHEN the page renders
- THEN the hero section is visible with title, subtitle, and brand visual

### Requirement: LPG-REQ-2 — Three CTA cards

The landing page MUST display exactly three CTA cards below the hero. The Bitácora card MUST link to `/bitacora`. The Recetas and Diario cards MUST show a "Próximamente" placeholder state without navigation.

| Card | Route | Behavior |
|------|-------|----------|
| Bitácora | `/bitacora` | Navigate to brew sessions |
| Recetas | — | "Próximamente" indicator |
| Diario | — | "Próximamente" indicator |

#### Scenario: Bitácora card navigates to /bitacora

- GIVEN a user is on the landing page
- WHEN they click the Bitácora card
- THEN the app navigates to `/bitacora`

#### Scenario: Placeholder cards show upcoming state

- GIVEN a user clicks the Recetas or Diario card
- WHEN the card is in placeholder mode
- THEN a "Próximamente" visual indicator appears and no navigation occurs

### Requirement: LPG-REQ-3 — Responsive layout

The landing page MUST be mobile-first: stacked cards on small screens, horizontal grid on desktop.

| Breakpoint | Layout |
|------------|--------|
| ≤ 640px | Single column, stacked |
| ≥ 1024px | Three-column grid |

#### Scenario: Mobile stacks cards

- GIVEN a viewport ≤ 640px
- WHEN the landing page renders
- THEN the three CTA cards are stacked vertically

#### Scenario: Desktop grid layout

- GIVEN a viewport ≥ 1024px
- WHEN the landing page renders
- THEN the three CTA cards display in a single row

### Requirement: LPG-REQ-4 — Cold load under 1s

The landing page MUST reach Time to Interactive under 1000ms on cold cache with simulated 3G throttling.

#### Scenario: Sub-second initial render

- GIVEN a cold browser cache
- WHEN the page loads over simulated 3G
- THEN Time to Interactive < 1000ms

## Acceptance Criteria

- [ ] Hero renders at `/` with title, subtitle, and visual
- [ ] Bitácora card links to `/bitacora`; Recetas/Diario show "Próximamente"
- [ ] Mobile: stacked cards at ≤ 640px
- [ ] Desktop: 3-column grid at ≥ 1024px
- [ ] Lighthouse Performance ≥ 90 on cold load
