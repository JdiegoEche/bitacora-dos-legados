# Design: Rediseño UI + Landing Page for Bitácora Café

## Technical Approach

Replace raw hex/emoji styling with a CSS custom property design system (`tokens.css`). A `Layout` component wraps `<Routes>` providing nav, footer, and dark-mode toggle via React context. Landing page at `/` is static (no data fetches). BrewList moves from `/` to `/bitacora` with a `<Navigate>` redirect.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| CSS vars vs. CSS Modules | Vars propagate globally — one source of truth, no build change. Modules require refactoring all 10 component imports. | **CSS vars** — zero import changes, BEM preserved |
| CSS vars vs. Tailwind | Tailwind requires install + purge config + full rewrite. The entire CSS is 400 lines of BEM. | **CSS vars** — 1 file vs. new toolchain with no benefit for a project this size |
| `data-theme` vs. `prefers-color-scheme` only | `prefers-color-scheme` is OS-scoped, no per-session override. `data-theme` supports toggle + localStorage. | **`data-theme`** — user can choose independently of OS |
| Theme context vs. direct DOM | React context enables a hook (`useTheme`) for future components; no prop drilling. | **Context + `useTheme` hook** — minimal overhead, extensible |
| Inline SVG hero vs. external image | External image = network request. SVG = inline, 0 requests, 0 FOUT. | **Inline SVG / CSS gradient** — sub-second cold load |

## Data Flow

```
index.html (fonts + meta)
  └── main.tsx (QueryClient + BrowserRouter)
        └── App.tsx
              └── ThemeProvider
                    └── Layout (nav + dark toggle + footer)
                          └── <Routes>
                                ├── / → LandingPage (static, no query)
                                │     └── Hero + CTA grid (Bitácora → /bitacora, Recetas/Diario → placeholder)
                                └── /bitacora → BrewList (TanStack Query)
                                      └── /brews/:id → BrewDetail (TanStack Query)
```

## Component Tree

```
<ThemeProvider>
  <Layout>                          ← nav, footer, dark toggle
    <nav>                           ← Bitácora Café logo, links, dark mode ☀/☾ button
    <main>
      <Routes>
        <Route path="/" element={<LandingPage />}>
          │   └─ <Hero />           ← brand title + tagline + SVG visual
          │   └─ <CtaGrid>          ← 3-card grid
          │        ├─ <CtaCard to="/bitacora" />       ← Bitácora (active)
          │        ├─ <CtaCard placeholder />           ← Recetas (próximamente)
          │        └─ <CtaCard placeholder />           ← Diario (próximamente)
        <Route path="/bitacora" element={<BrewList />}>
        <Route path="/brews/new" element={<BrewForm />}>
        <Route path="/brews/:id" element={<BrewDetail />}>
        <Route path="/brews/:id/edit" element={<BrewEdit />}>
        <Route path="/beans" element={<BeanList />}>
        <Route path="*" element={<Navigate to="/" />}>
      </Routes>
    </main>
    <footer />                      ← brand + copyright
  </Layout>
</ThemeProvider>
```

## Dark Mode Strategy

```
ThemeProvider (context)
  ├── state: theme ('light' | 'dark')
  ├── on mount: read localStorage("bitacora-theme") || prefers-color-scheme || 'light'
  │   └── set data-theme on document.documentElement
  ├── toggle(): flip theme → set data-theme → write localStorage
  └── expose: { theme, toggleTheme }
```

- **Persistence**: `localStorage` key `bitacora-theme` — immediate write on toggle
- **Fallback chain**: localStorage → `prefers-color-scheme` media query → `'light'`
- **No flash**: inline `<script>` in `index.html` `<head>` applies stored theme before React hydrates + inline `<style>` block with critical dark color tokens so `[data-theme="dark"]` variables are available synchronously (before Vite injects `tokens.css` via JS bundle)
- **CSS scoping**: all tokens under `[data-theme="dark"]` selector in `tokens.css`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/styles/tokens.css` | **Create** | All design tokens: colors, fonts, spacing, shadows, radius — light (`:root`) + dark (`[data-theme="dark"]`) |
| `frontend/src/components/Layout.tsx` | **Create** | Nav bar (logo, links, dark toggle) + footer + `<Outlet />` for routes. Uses `useTheme()` |
| `frontend/src/components/LandingPage.tsx` | **Create** | Hero section (title, tagline, CSS-gradient visual) + 3 CTA cards. No data fetches |
| `frontend/src/contexts/ThemeContext.tsx` | **Create** | `ThemeProvider` + `useTheme()` hook — state, toggle, DOM sync, localStorage |
| `frontend/src/styles/index.css` | **Modify** | Replace every raw `#xxx` color with `var(--color-*)`. Keep BEM class names intact. Add card/landing classes |
| `frontend/index.html` | **Modify** | Google Fonts `<link>` (Playfair Display 400-700, Inter 300-700), meta description, inline theme-init script, `<html lang="es">` |
| `frontend/src/App.tsx` | **Modify** | Wrap with `<ThemeProvider>` + `<Layout>`. Add Landing route at `/`. Move BrewList to `/bitacora`. Catch-all `*` route redirects to `/` (landing page). **No** `<Navigate>` at `/` — that would make LandingPage unreachable |
| `frontend/src/main.tsx` | **Modify** | Import `tokens.css` before `index.css` (token definitions must load first) |
| `frontend/src/components/BrewList.tsx` | **Modify** | Emoji `★` → inline CSS star rendering (numeric text). No functional changes |
| `frontend/src/components/BrewDetail.tsx` | **Modify** | Navigate `/` → `/bitacora`. Emoji cleanup |
| `frontend/src/components/BrewEdit.tsx` | **Modify** | Link `/` → `/bitacora` |
| `frontend/src/components/BrewForm.tsx` | **Modify** | Emoji `★` → CSS-only star rendering |
| `frontend/src/components/BeanList.tsx` | **Modify** | Class tweaks only — no logic changes |
| `frontend/src/components/BeanForm.tsx` | **Modify** | Class tweaks only — no logic changes |
| `frontend/src/components/BeanSelect.tsx` | **Modify** | Class tweaks only — no logic changes |
| `frontend/src/components/TastingNoteCard.tsx` | **Modify** | Emoji `★☆` → CSS-only rendering |
| `frontend/src/components/TastingNoteForm.tsx` | **Modify** | Emoji `★☆` → CSS-only rendering |
| `frontend/src/components/TastingNotesList.tsx` | **Modify** | Class tweaks only |

## Interfaces / Contracts

```ts
// ThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Layout.tsx
// Wraps <Outlet /> — no props. Reads theme from context.
// Nav links: /bitacora, /brews/new, /beans

// LandingPage.tsx
// No props. No API calls. Renders hero + 3 CTA cards.
// <CtaCard to="/bitacora" icon title description />
// <CtaCard comingSoon icon title description />
```

## Responsive Breakpoints

| Breakpoint | Landing Page | Nav |
|------------|-------------|-----|
| < 640px | Single column, stacked CTAs | Compact, vertical menu if needed |
| 640px - 1024px | 2-column grid CTAs | Horizontal nav |
| ≥ 1024px | 3-column grid, larger hero | Full nav |

## Migration Order

1. **tokens.css** — create and import BEFORE `index.css` in `main.tsx`. Verify build passes (no visual change yet). Validate: `rg "#[0-9a-fA-F]" --include="*.css" frontend/src/styles/` should only match `tokens.css`
2. **ThemeContext** — create context + provider. Wire into App. Add inline init script in `index.html`
3. **index.html** — fonts, meta, theme-init script
4. **Layout** — create nav + footer. Wrap `<Routes>` in App. Dark toggle in nav
5. **index.css** — replace all raw values with `var()` tokens. Add missing token-driven classes (hero, card, grid)
6. **App.tsx** — restructure routes: `/` → Landing, `/bitacora` → BrewList, add redirect
7. **LandingPage** — create hero + CTA cards
8. **Per-component restyle** — emoji removal + class tweaks in all 10 components. Note: BrewList stays as a table (not cards per-proposal TBD) — card migration deferred to a future change to keep scope contained
9. **Route fix** — BrewDetail `navigate('/')` → `navigate('/bitacora')`, BrewEdit Link `/` → `/bitacora`

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Build | TypeScript + Vite | `npx tsc --noEmit && npx vite build` — must pass with 0 errors |
| Token audit | All `.css` files | `rg "#[0-9a-fA-F]" --include="*.css" frontend/src/styles/` — only `tokens.css` should match. Run after migration step 5 |
| Dark mode | All routes | Manual: toggle once per route, verify no light-bleed |
| Responsive | Landing page | Manual: resize to 375px (stacked) and 1280px (3-column) |
| Routes | `/` → Landing, `/bitacora` → BrewList | Manual navigation + verify `/` link in BrewError/BrewEdit |
| Lighthouse | Cold load | Target Performance ≥ 90 |

## Open Questions

- None — all specs are self-consistent and the API surface is unchanged.
