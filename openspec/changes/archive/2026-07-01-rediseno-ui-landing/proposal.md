# Proposal: Rediseño UI + Landing para Bitácora Café

## Intent

MVP UI is purely functional — generic fonts, blue links, no brand. This change gives it a warm coffee visual identity, a landing page, and a design system.

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Landing at `/` — hero + 3 CTAs | Recetas/Diario backend — placeholder cards |
| Layout — nav, footer, dark toggle | Mobile app — deferred |
| CSS tokens + dark mode | Charts, photos, auth, backend changes |
| Route: BrewList → `/bitacora`, `/` → Landing | Over-polishing beyond token restyle |
| Restyle all 10 components (BEM preserved) | |

## Capabilities

### New
- `landing-page`: Hero, messaging, CTA cards (2 placeholder)
- `design-system`: CSS tokens, dark mode, Layout, typography

### Modified
- `brew-sessions`: BrewList route `/` → `/bitacora` — delta spec needed

## Approach

1. `tokens.css` — CSS custom properties for colors, fonts, spacing, shadows
2. `[data-theme]` + `prefers-color-scheme` — dual token definitions
3. Google Fonts (Playfair + Inter) with `font-display: swap`
4. `Layout.tsx` wraps `<Routes>` — nav + footer + dark toggle
5. Landing: static hero, no data fetch
6. Route: `<Navigate from="/" to="/bitacora">` for compatibility
7. Restyle: BEM preserved in components, only `index.css` values → vars

## Affected Areas

| Area | Impact |
|------|--------|
| `App.tsx` | Modified — Layout wraps Routes, new paths |
| `styles/index.css` | Modified — all values → var() |
| `styles/tokens.css` | New — tokens + dark mode |
| `components/Layout.tsx` | New |
| `components/LandingPage.tsx` | New |
| `components/BrewList.tsx` | Modified — table → cards (TBD) |
| `index.html` | Modified — fonts, SVG favicon |
| `components/*.tsx` (9 files) | Modified — emoji removal, class tweaks |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Route change breaks bookmarks | Low | `<Navigate>` redirect |
| FOUT on font load | Low | `font-display: swap` + fallback |
| Dark mode missed on component | Med | Manual audit + snapshot tests |
| Scope creep | Med | Strict in/out; design gates decisions |

## Rollback

`git revert` the merge commit. Route change is frontend-only — no data migration.

## Dependencies

- Google Fonts (Playfair + Inter)

## Success Criteria

- [ ] Landing at `/` renders hero + CTAs in `< 1s` cold load
- [ ] All components use token palette — no raw hex outside `tokens.css`
- [ ] Dark toggle switches all surfaces — no light bleed
- [ ] `/bitacora` shows BrewList; `/` redirects to `/bitacora`
- [ ] `npm run build` passes with zero errors
- [ ] Visual before/after diff approved
