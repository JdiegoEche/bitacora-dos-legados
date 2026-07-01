# Design System Specification

## Purpose

Defines the visual design system: CSS custom property tokens for colors, typography, spacing, and shadows — plus the Layout component, dark mode, and Google Fonts integration. All component CSS references tokens via `var()`; no raw color values outside `tokens.css`.

## Requirements

### Requirement: DSG-REQ-1 — CSS token definitions

All visual tokens MUST be defined in `styles/tokens.css` as custom properties on `:root` (light) and `[data-theme="dark"]` (dark). Every component CSS file MUST reference tokens exclusively via `var()`.

#### Scenario: Light mode tokens active

- GIVEN no `data-theme` attribute on `<html>`
- WHEN the browser renders
- THEN all elements use light-mode token values from `:root`

#### Scenario: Dark mode tokens active

- GIVEN `<html>` has `data-theme="dark"`
- WHEN the browser renders
- THEN all elements use dark-mode token values

### Requirement: DSG-REQ-2 — Token categories

The token file MUST define values for these categories:

| Category | Tokens |
|----------|--------|
| Colors | `--color-primary`, `--color-primary-hover`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`, `--color-foreground`, `--color-muted`, `--color-muted-fg`, `--color-border`, `--color-destructive` |
| Typography | `--font-heading` (Playfair Display), `--font-body` (Inter), `--text-sm` through `--text-3xl` |
| Spacing | `--space-1` through `--space-8` (4px increments) |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` |

#### Scenario: All tokens present

- GIVEN `tokens.css` is loaded
- WHEN inspecting `getComputedStyle(document.documentElement)`
- THEN all required tokens are defined in both light and dark variants

### Requirement: DSG-REQ-3 — Google Fonts integration

The `index.html` MUST load Playfair Display (400–700) and Inter (300–700) via `<link>` with `font-display: swap`.

#### Scenario: Font swap on slow connection

- GIVEN a slow network
- WHEN the page loads
- THEN system fallback fonts render immediately, swapped to Google Fonts once loaded

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

## Acceptance Criteria

- [ ] All tokens defined in `tokens.css` with light and dark variants
- [ ] No raw hex/color values outside `tokens.css`
- [ ] Google Fonts load with `font-display: swap`
- [ ] Layout renders nav + footer on every route
- [ ] Dark toggle switches theme and persists to `localStorage`
- [ ] Initial load: localStorage → prefers-color-scheme → light fallback
