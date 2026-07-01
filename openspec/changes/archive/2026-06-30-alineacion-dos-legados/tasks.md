# Tasks: Alineación Visual con Dos Legados

## Revisión de Carga de Trabajo

| Campo | Valor |
|-------|-------|
| Líneas estimadas cambiadas | ~160-175 |
| Riesgo de presupuesto 400 líneas | Low |
| ¿Chained PRs recomendado? | No |
| Split sugerido | PR único |
| Estrategia de entrega | ask-on-risk |

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
```

### Unidades de Trabajo

| Unidad | Objetivo | PR estimado |
|--------|----------|-------------|
| 1 | Tokens, fonts, utilitarias editoriales + componentes CSS | PR único (~160 líneas) |

---

## Fase 1: Fundación — Tokens y Tipografía

- [x] **1.1** `tokens.css` — Reemplazar valores en `:root` con paleta Dos Legados: `--color-primary` → `#111`, `--color-accent` → `#b08d57`, `--color-background` → `#f8f7f4`, `--color-foreground` → `#111`, `--color-muted` → `#f8f7f4`, `--color-muted-fg` → `#6e6e6e`, `--color-border` → gold-light mix. Eliminar `--color-primary-hover`, `--color-secondary`, `--shadow-*` de `:root`. Agregar `--color-offwhite`, `--color-black`, `--color-gold`, `--color-gold-light`, `--color-gold-dark`, `--color-gray`, `--color-gray-light`, `--color-espresso`, `--font-accent`. Cero cambios en `[data-theme="dark"]`.
- [x] **1.2** `index.html` — Agregar Cormorant Garamond a la URL de Google Fonts: `&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700`

## Fase 2: Utilidades Editoriales

- [x] **2.1** `index.css` — Agregar bloque `/* Dos Legados editorial */` con clases: `.editorial-title`, `.editorial-body`, `.eyebrow`, `.accent-line`, `.divider-botanical`, `.hover-gold`

## Fase 3: Componentes Visuales

- [x] **3.1** `index.css` — Hero: `.hero` fondo plano `--color-offwhite`; `.hero-title` + `::after` línea gold; `.hero-subtitle` con `--font-accent`, italic, `--color-gray`; `.hero-visual` `display: none`
- [x] **3.2** `index.css` — CTA cards: `.cta-card` sin `box-shadow`, borde gold-light mix; hover sin `translateY` ni sombra, borde gold sólido; `.cta-icon` → `--color-gold`; `.cta-badge` con `--color-gold-dark` + gold-light bg
- [x] **3.3** `index.css` — Nav y footer: `.nav` bg `--color-offwhite`, borde gold-light; `.nav-logo` → `--color-black`; `.nav-link` → `--color-gray`, hover → `--color-gold`; `.nav-theme-toggle` borde gold-light; `.footer` bg `--color-offwhite`, borde gold-light; `.footer-inner` → `--color-gray`
- [x] **3.4** `index.css` — Remover sombras de `.data-table`, `.form`, `.detail-grid`, `.detail-notes`; agregar borde gold-light a cada uno. `.input:focus` borde → `--color-gold`. `.btn:hover` reemplazar `var(--color-primary-hover)` por `color-mix(in srgb, var(--color-primary) 85%, transparent)`

## Fase 4: Verificación

- [x] **4.1** Verificar: ningún cambio en `[data-theme="dark"]`; hero sin sombras, con línea gold; CTA cards sin sombra, hover gold solid; nav offwhite + gold; footer offwhite + gray; tablas/forms/detail-grid sin sombra; botones primarios en `--color-black`; toggle de modo oscuro funcional
