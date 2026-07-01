# Design System Specification

## Purpose

Defines the visual design system: CSS custom property tokens for colors, typography, spacing, and shadows — plus the Layout component, dark mode, and Google Fonts integration. All component CSS references tokens via `var()`; no raw color values outside `tokens.css`. Light mode uses the Dos Legados brand palette (offwhite, gold, black, espresso); dark mode is unchanged.

## Requirements

### Requirement: DSG-REQ-1 — CSS token definitions

All visual tokens MUST be defined in `styles/tokens.css` as custom properties on `:root` (light) and `[data-theme="dark"]` (dark). Every component CSS file MUST reference tokens exclusively via `var()`.

In light mode (`:root`), token values use the Dos Legados brand palette. Shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) are removed from `:root` but preserved in `[data-theme="dark"]`.

#### Scenario: Light mode with Dos Legados palette

- GIVEN no `data-theme` attribute on `<html>`
- WHEN the browser renders
- THEN all elements use Dos Legados palette values from `:root`
- AND `box-shadow` is not present on cards, tables, forms, or detail-grid

#### Scenario: Dark mode unchanged

- GIVEN `<html>` has `data-theme="dark"`
- WHEN the browser renders
- THEN all elements use the original dark-mode token values
- AND shadows remain present in dark mode

### Requirement: DSG-REQ-2 — Token categories

The token file MUST define values for these categories:

| Category | Tokens (light) |
|----------|----------------|
| Colors | `--color-offwhite`, `--color-black`, `--color-gold`, `--color-gold-light`, `--color-gold-dark`, `--color-gray`, `--color-gray-light`, `--color-espresso`, `--color-surface`, `--color-destructive` |
| Typography | `--font-heading` (Playfair Display), `--font-body` (Inter), `--font-accent` (Cormorant Garamond), `--text-xs` through `--text-4xl` |
| Spacing | `--space-1` through `--space-8` (4px increments) |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` — only in dark mode |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` |

Legacy token names (`--color-primary`, `--color-accent`, `--color-background`, `--color-foreground`, `--color-muted`, `--color-muted-fg`, `--color-border`) are preserved in `:root` with updated Dos Legados values for backward compatibility with 55+ CSS `var()` references.

#### Scenario: Dos Legados tokens present

- GIVEN `tokens.css` is loaded
- WHEN inspecting `getComputedStyle(document.documentElement)`
- THEN all Dos Legados color tokens (`--color-offwhite`, `--color-black`, `--color-gold`, `--color-gold-light`, `--color-gold-dark`, `--color-gray`, `--color-gray-light`, `--color-espresso`) are defined in `:root`
- AND `--font-accent` is defined in `:root`
- AND `--shadow-*` are NOT defined in `:root`

#### Scenario: Token `--font-accent` available

- GIVEN `tokens.css` defines `--font-accent`
- WHEN used in CSS via `var(--font-accent)`
- THEN it resolves to `"Cormorant Garamond", "Playfair Display", Georgia, serif`

### Requirement: DSG-REQ-3 — Google Fonts integration

`index.html` MUST load Playfair Display (400–700), Inter (300–700), and Cormorant Garamond (400, 400i, 500, 500i, 600, 600i, 700, 700i) via `<link>` with `font-display: swap`.

#### Scenario: Complete font loading

- GIVEN `index.html` includes the `<link>` to Google Fonts
- WHEN inspecting loaded fonts via `document.fonts`
- THEN Playfair Display, Inter, and Cormorant Garamond are available

#### Scenario: Font swap on slow connection

- GIVEN a slow network
- WHEN the page loads
- THEN system fallback fonts render immediately
- AND fonts swap to Google Fonts once loaded

### Requirement: DSG-REQ-4 — Layout component

A `<Layout>` component MUST wrap the router, rendering a top nav bar and bottom footer on every route.

#### Scenario: Nav and footer visible

- GIVEN any route in the app
- WHEN the page renders
- THEN the nav bar is at the top and the footer at the bottom

### Requirement: DSG-REQ-5 — Dark mode toggle

The nav bar MUST include a dark mode toggle button. On click, it MUST toggle `data-theme` on `<html>` and persist in `localStorage`. On initial load: check `localStorage` first, fall back to `prefers-color-scheme`.

#### Scenario: Toggle persists preference

- GIVEN the page is in light mode
- WHEN the user clicks the toggle
- THEN the page switches to dark mode and `localStorage` stores `"dark"`

#### Scenario: Initial load uses saved preference

- GIVEN the user previously selected dark mode
- WHEN they revisit the page
- THEN `data-theme="dark"` is applied from `localStorage`

#### Scenario: No saved preference uses OS setting

- GIVEN no `localStorage` key exists and the OS is in dark mode
- WHEN the page loads
- THEN `data-theme="dark"` is applied via `prefers-color-scheme`

### Requirement: DSG-REQ-6 — New Dos Legados color tokens

`tokens.css` MUST define the following new tokens in `:root` (light mode) for the Dos Legados brand palette:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-offwhite` | `#f8f7f4` | Main layout background |
| `--color-black` | `#111` | Primary text, primary actions, logo |
| `--color-gold` | `#b08d57` | Decorative accents, primary borders |
| `--color-gold-light` | `#c9a96e` | Hover borders, light accent variant |
| `--color-gold-dark` | `#8b6a3d` | Eyebrow text, decorative titles |
| `--color-gray` | `#6e6e6e` | Secondary text, metadata |
| `--color-gray-light` | `#a8a6a0` | Placeholders, disabled text |
| `--color-espresso` | `#3a2a22` | Hero section background, localized dark backgrounds |

#### Scenario: New tokens present in `:root`

- GIVEN `tokens.css` is loaded in the browser
- WHEN inspecting `getComputedStyle(document.documentElement)`
- THEN all eight new tokens are defined in `:root`
- AND the tokens are NOT defined in `[data-theme="dark"]` (unless explicitly added)

#### Scenario: Missing tokens break layout

- GIVEN a Dos Legados token is not defined
- WHEN the component referencing it renders
- THEN the `var()` default (if any) is used as fallback
- AND `tokens.css` is not considered valid until all tokens are defined

### Requirement: DSG-REQ-7 — Cormorant Garamond font loading

`index.html` MUST load Cormorant Garamond via Google Fonts with weights 400, 400i, 500, 500i, 600, 600i, 700, 700i and `font-display: swap`.

#### Scenario: Font loads correctly

- GIVEN `index.html` includes the `<link>` to Google Fonts with Cormorant Garamond
- WHEN the page loads in a browser
- THEN Cormorant Garamond is available for CSS use
- AND weights 400, 400i, 500, 500i, 600, 600i, 700, 700i are downloaded

#### Scenario: Fallback on slow connection

- GIVEN a slow network
- WHEN the page renders before Cormorant Garamond finishes loading
- THEN the system uses `Georgia`, `serif` as immediate fallback
- AND text swaps to Cormorant Garamond once loaded

### Requirement: DSG-REQ-8 — Editorial utility classes

`index.css` MUST define the following utility classes under a `/* Dos Legados editorial */` block:

| Class | Properties | Context |
|-------|------------|---------|
| `.editorial-title` | `font-family: var(--font-heading)`, `font-weight: 600`, `line-height: 1.1`, `letter-spacing: 0.02em` | Landing titles, editorial section headers |
| `.editorial-body` | `font-family: var(--font-accent)`, `font-style: italic`, `color: var(--color-gray)`, `line-height: 1.7` | Editorial body text, quotes, descriptions |
| `.eyebrow` | `text-transform: uppercase`, `color: var(--color-gold-dark)`, `letter-spacing: 0.25em`, `font-size: 0.75rem`, `font-weight: 600` | Decorative label above titles |
| `.accent-line` | `width: 48px`, `height: 1px`, `background: var(--color-gold)`, `border: none` | Horizontal decorative accent line |
| `.divider-botanical` | `height: 1px`, `background: linear-gradient(90deg, transparent, var(--color-gold), transparent)`, `border: none` | Decorative section divider |
| `.hover-gold` | `transition: color 0.2s ease`, on hover `color: var(--color-gold)` | Links, icons, interactive elements |

#### Scenario: Editorial classes applied correctly

- GIVEN an element with `.editorial-title` class
- WHEN the browser renders
- THEN it uses Playfair Display (via `--font-heading`), weight 600, line-height 1.1, letter-spacing 0.02em

#### Scenario: Divider botanical visible

- GIVEN an `<hr>` element with `.divider-botanical` class
- WHEN the browser renders
- THEN a horizontal line with transparent → gold → transparent gradient is displayed

## Acceptance Criteria

- [ ] All tokens defined in `tokens.css` with light and dark variants
- [ ] Light mode uses Dos Legados palette (offwhite, gold, black, espresso)
- [ ] `--font-accent` (Cormorant Garamond) defined in `tokens.css`
- [ ] Editorial utility classes present in `index.css`
- [ ] No raw hex/color values outside `tokens.css`
- [ ] Google Fonts load Playfair Display, Inter, and Cormorant Garamond with `font-display: swap`
- [ ] Layout renders nav + footer on every route
- [ ] Dark toggle switches theme and persists to `localStorage`
- [ ] Initial load: localStorage → prefers-color-scheme → light fallback
