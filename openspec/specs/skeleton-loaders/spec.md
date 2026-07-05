# Skeleton Loaders Specification

## Purpose

Skeleton loaders provide shape-matching placeholder content while data loads, reducing perceived latency and preventing layout shift. Animations respect user motion preferences.

## Requirements

### Requirement: SLR-REQ-1 — Skeleton Primitive

The system MUST export a `Skeleton` primitive component with `width`, `height`, and `rounded` props accepting Tailwind-compatible values. It MUST use a CSS `@keyframes shimmer` animation — a moving gradient sweep across a gray base (`bg-gray-200`).

#### Scenario: Default skeleton renders

- GIVEN the Skeleton component is used with `width="w-full"` and `height="h-4"`
- WHEN it renders
- THEN a gray rectangle with the shimmer animation appears at the specified dimensions

#### Scenario: Rounded skeleton

- GIVEN the Skeleton component is used with `rounded="rounded-full"`
- WHEN it renders
- THEN the placeholder renders as a circle

### Requirement: SLR-REQ-2 — Domain Skeleton Variants

The system MUST provide domain-specific skeleton components that match the shape of their corresponding content layout:
- `BitacoraHomeSkeleton` — Grid of card-shaped placeholders (3-column on desktop, 1-column on mobile)
- `BeanDetailSkeleton` — Left panel (info skeleton) + right panel (stats skeleton)
- `BrewDetailSkeleton` — Single-column layout with recipe fields and tasting notes skeleton

#### Scenario: BitacoraHome skeleton matches card grid

- GIVEN the user navigates to `/bitacora`
- WHEN data is loading
- THEN `BitacoraHomeSkeleton` renders a grid of card-shaped placeholders matching bean card dimensions

#### Scenario: BeanDetail skeleton shows two-column layout

- GIVEN the user navigates to `/bitacora/3`
- WHEN data is loading
- THEN `BeanDetailSkeleton` renders a left panel with name, roaster, origin placeholders, and a right panel with stat bar placeholders

### Requirement: SLR-REQ-3 — Respect Reduced Motion

The shimmer animation MUST be disabled when `prefers-reduced-motion: reduce` is active. The skeleton MUST render as a static gray placeholder without animation.

#### Scenario: Reduced motion disables shimmer

- GIVEN the user has `prefers-reduced-motion: reduce` set
- WHEN a skeleton renders
- THEN the skeleton shows a static gray placeholder with no shimmer animation
