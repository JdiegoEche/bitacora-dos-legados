# Design: Alineación Visual con Dos Legados

## Enfoque Técnico

Reemplazo de la paleta light mode en `tokens.css` (valores ámbar/cálido → paleta Dos Legados) conservando intacto `[data-theme="dark"]`. Se mantienen los nombres de tokens antiguos (`--color-foreground`, `--color-primary`, etc.) en `:root` con nuevos valores para que las 55 referencias CSS en `index.css` sigan funcionando en ambos modos sin cambios. Se eliminan solo sombras y `--color-secondary`/`--color-primary-hover` de `:root`. Los componentes reciben actualizaciones visuales vía CSS classes, no JSX.

## Decisiones Arquitectónicas

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Eliminar tokens antiguos de `:root` y renombrar en todo `index.css` | Oscuro modo se rompe porque `[data-theme="dark"]` no define los nuevos tokens | **RECHAZADO**: viola dark-mode intacto |
| Mantener nombres antiguos en `:root` con valores nuevos | Crea duplicación semántica (old name + new token apuntan a lo mismo) | **ELEGIDO**: única forma segura de no tocar dark mode |
| Agregar tokens nuevos a `[data-theme="dark"]` | Modifica el bloque dark mode expresamente | **RECHAZADO**: viola restricción explícita |
| Migrar componentes vía JSX (cambiar className) | Sin dependencia de tokens en TSX — solo se actualizan CSS classes | **ELEGIDO**: zero changes en archivos .tsx |

## Arquitectura de Tokens

Solo se eliminan de `:root`: `--color-primary-hover`, `--color-secondary`, `--shadow-*`. El resto mantiene su nombre con valores Dos Legados. Esto preserva las 55 referencias `var()` en ambos modos.

```css
:root {
  /* Colores base (nombres existentes — nuevos valores) */
  --color-background: #f8f7f4;      /* offwhite    | was: #FFFBEB */
  --color-foreground: #111;          /* black       | was: #0F172A */
  --color-primary: #111;             /* black       | was: #92400E */
  --color-accent: #b08d57;           /* gold        | was: #D97706 */
  --color-surface: #FFFFFF;          /* igual */
  --color-destructive: #DC2626;      /* igual */

  /* Semántica editorial (nombres existentes — nuevos valores) */
  --color-muted: #f8f7f4;            /* = offwhite  | was: #F5F0EB */
  --color-muted-fg: #6e6e6e;         /* = gray      | was: #78716C */
  --color-border: color-mix(in srgb, var(--color-gold-light) 30%, transparent);

  /* Sombra: ELIMINADAS de :root (solo dark mode las conserva) */
  /* --shadow-sm: removed — no se declara */
  /* --shadow-md: removed — no se declara */
  /* --shadow-lg: removed — no se declara */

  /* Eliminados de :root */
  /* --color-primary-hover: removed */
  /* --color-secondary: removed */

  /* NUEVOS — Paleta Dos Legados */
  --color-offwhite: #f8f7f4;
  --color-black: #111;
  --color-gold: #b08d57;
  --color-gold-light: #c9a96e;
  --color-gold-dark: #8b6a3d;
  --color-gray: #6e6e6e;
  --color-gray-light: #a8a6a0;
  --color-espresso: #3a2a22;

  /* NUEVO — tipografía editorial */
  --font-accent: "Cormorant Garamond", "Playfair Display", Georgia, serif;

  /* Se conservan: --color-on-primary, --font-heading, --font-body,
     --text-xs..4xl, --space-1..8, --radius-sm..lg */
}
```

## Carga Tipográfica

Agregar al `<link>` existente en `index.html`:

```
&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700
```

URL completa:
```
https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=Playfair+Display:wght@400..700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap
```

## Utilidades Editoriales

Se agregan en `index.css` bajo `/* Dos Legados editorial */` (6 clases, ~30 líneas):

```css
.editorial-title { font-family: var(--font-heading); font-weight: 600; line-height: 1.1; letter-spacing: 0.02em; }
.editorial-body  { font-family: var(--font-accent); font-style: italic; color: var(--color-gray); line-height: 1.7; }
.eyebrow         { text-transform: uppercase; color: var(--color-gold-dark); letter-spacing: 0.25em; font-size: 0.75rem; font-weight: 600; }
.accent-line     { width: 48px; height: 1px; background: var(--color-gold); border: none; }
.divider-botanical { height: 1px; background: linear-gradient(90deg, transparent, var(--color-gold), transparent); border: none; }
.hover-gold      { transition: color 0.2s ease; }
.hover-gold:hover { color: var(--color-gold); }
```

## LandingPage — Solo CSS Hero

El hero actual usa clases `.hero`, `.hero-title`, `.hero-subtitle`, `.hero-visual`. **No se toca el TSX** — solo se cambian las reglas CSS:

```css
/* ANTES */
.hero {
  background: linear-gradient(180deg, var(--color-background), var(--color-muted));
  /* gradiente ámbar */
}
.hero-title { color: var(--color-foreground); }
.hero-visual {
  background: radial-gradient(circle, var(--color-accent), var(--color-secondary), var(--color-primary));
}

/* DESPUÉS */
.hero {
  background: var(--color-offwhite);   /* fondo plano editorial */
}
.hero-title {
  color: var(--color-black);
  /* + clase .editorial-title aplicada via CSS */
}
.hero-title::after {
  content: "";
  display: block;
  width: 48px;
  height: 1px;
  background: var(--color-gold);
  margin: var(--space-4) auto 0;
}
.hero-subtitle {
  font-family: var(--font-accent);
  font-style: italic;
  color: var(--color-gray);
  line-height: 1.7;
}
.hero-visual { display: none; }  /* se reemplaza por accent-line */
```

**CTA Cards** — hover sin sombra ni translateY:

```css
/* ANTES */
.cta-card { box-shadow: var(--shadow-sm); transition: box-shadow 0.2s, transform 0.2s; }
.cta-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

/* DESPUÉS */
.cta-card {
  border: 1px solid color-mix(in srgb, var(--color-gold-light) 30%, transparent);
  transition: border-color 0.2s;
  /* sin box-shadow (token no definido → none) */
}
.cta-card:hover {
  border-color: var(--color-gold);
  /* sin translateY, sin sombra */
}
.cta-icon { color: var(--color-gold); }
.cta-badge { background: color-mix(in srgb, var(--color-gold-light) 20%, transparent); color: var(--color-gold-dark); }
```

## Layout — Nav y Footer (solo CSS)

| Elemento | Antes | Después |
|----------|-------|---------|
| `.nav` bg | `--color-surface` | `--color-offwhite` |
| `.nav` border | `--color-border` | gold-light mix |
| `.nav-logo` | `--color-foreground` | `--color-black` |
| `.nav-link` | `--color-muted-fg` | `--color-gray` |
| `.nav-link:hover` | `--color-primary` | `--color-gold` + clase `.hover-gold` |
| `.nav-theme-toggle` border | `--color-border` | gold-light mix |
| `.footer` bg | `--color-muted` | `--color-offwhite` |
| `.footer` border-top | `--color-border` | gold-light mix |
| `.footer-inner` text | `--color-muted-fg` | `--color-gray` |

## Estrategia de Remoción de Sombras

Las sombras se eliminan de `:root` — al no estar definidas, `var(--shadow-*)` produce declaración inválida y `box-shadow` cae a `none`. En dark mode, `[data-theme="dark"]` aún las define, así que se conservan. La jerarquía visual perdida se reemplaza por:

| Componente | Reemplazo de jerarquía |
|------------|----------------------|
| `.data-table` | Borde gold-light mix en la tabla + `border-bottom` gold-light en filas |
| `.form` | Borde gold-light mix alrededor del form |
| `.detail-grid` | `border: 1px solid` gold-light mix (antes sin borde, solo sombra) |
| `.detail-notes` | `border: 1px solid` gold-light mix (antes sin borde, solo sombra) |

## Mapa de Cambios en Componentes CSS

| Selector | Token anterior | Token nuevo |
|----------|---------------|-------------|
| `body` | `--color-foreground`, `--color-background` | mismos nombres, valores cambiados |
| `a` | `--color-primary` | mismo nombre, valor `#111` (black) |
| `.btn` | `--color-primary` | mismo nombre, valor `#111` |
| `.btn:hover` | `--color-primary-hover` | `color-mix(in srgb, var(--color-primary) 85%, transparent)` |
| `.input:focus` | `--color-primary` | `--color-gold` |
| `th` | `--color-muted`, `--color-muted-fg` | mismos nombres, valores cambiados |
| `tr td` border | `--color-border` | mismo nombre, valor gold-light mix |
| `.nav` | `--color-surface`, `--color-border` | `--color-offwhite`, gold-light mix |
| `.nav-link` | `--color-muted-fg` | `--color-gray` |
| `.nav-link:hover` | `--color-primary` | `--color-gold` |
| `.footer` | `--color-muted`, `--color-border` | `--color-offwhite`, gold-light mix |
| `--primary-hover` | `--color-primary-hover` | `color-mix(in srgb, var(--color-primary) 85%, transparent)` |

## Dark Mode Safeguards

1. `[data-theme="dark"]` en `tokens.css` — cero cambios, cero líneas tocadas
2. `[data-theme="dark"]` inline en `index.html` — sin modificar
3. Sombras en dark mode: `--shadow-sm/md/lg` siguen definidas → componentes con `box-shadow: var(--shadow-*)` mantienen sombras
4. Tokens antiguos en dark mode: todos existen con valores originales → 55 referencias `var()` en CSS funcionan igual que antes
5. Verificación: `git diff tokens.css` debe mostrar cambios solo en `:root`, ningún `data-theme` modificado

## Plan de Rollback

| Capa | Comando de rollback |
|------|-------------------|
| Tokens | `git checkout HEAD -- frontend/src/styles/tokens.css` |
| Utilidades editoriales | `git checkout HEAD -- frontend/src/styles/index.css` (líneas nuevas, seguro) |
| Componentes CSS | `git checkout HEAD -- frontend/src/styles/index.css` |
| Font loading | `git checkout HEAD -- frontend/index.html` |

Commits atómicos por archivo: si una capa falla, se revierte solo esa sin afectar las demás.
