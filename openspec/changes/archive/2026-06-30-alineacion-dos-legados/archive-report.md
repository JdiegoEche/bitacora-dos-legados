# Archive Report: Alineación Visual con Dos Legados

**Fecha de archive**: 2026-06-30
**Cambio**: alineacion-dos-legados
**Proyecto**: Bitácora Café / Dos Legados — Café de Especialidad
**Artifact Store**: OpenSpec

---

## Resumen Ejecutivo

Se alineó la identidad visual de Bitácora Café con la paleta de marca Dos Legados. Los tokens de color light mode, la tipografía y los componentes visuales se actualizaron para reflejar la paleta corporativa (offwhite, gold, black, espresso) sin alterar la funcionalidad existente ni el dark mode.

**Veredicto de verificación**: ✅ APPROVED — 28/28 criterios PASS, 0 CRITICAL, 0 WARNING

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/styles/tokens.css` | Reemplazo de valores en `:root` con paleta Dos Legados. Eliminación de `--color-primary-hover`, `--color-secondary`, `--shadow-*` de `:root`. Agregados 8 nuevos tokens de color + `--font-accent`. Dark mode intacto. |
| `frontend/index.html` | Agregado Cormorant Garamond a la URL de Google Fonts (400–700, itálicas). |
| `frontend/src/styles/index.css` | Bloque `/* Dos Legados editorial */` con 6 clases utilitarias. Hero, CTA cards, nav, footer, data-table, form, detail-grid, detail-notes actualizados sin sombras. |

## Archivos No Modificados (Zero Changes)

- `frontend/src/components/LandingPage.tsx`
- `frontend/src/components/Layout.tsx`
- Cualquier archivo `.tsx`

Todo el cambio se implementó vía CSS, sin tocar JSX.

---

## Decisiones Arquitectónicas

### 1. Mantener nombres de tokens antiguos en `:root`

En lugar de renombrar todos los tokens (lo cual habría requerido modificar ~55 referencias `var()` en ambos modos), se **conservaron los nombres antiguos** (`--color-primary`, `--color-accent`, `--color-background`, etc.) en `:root` **con nuevos valores** de la paleta Dos Legados. Esto permitió:

- Cero cambios en `[data-theme="dark"]` (todos los nombres existen con valores originales)
- 55 referencias CSS inalteradas en ambos modos
- Migración puramente aditiva: los nuevos tokens se agregan, los viejos nombres se reasignan

**Tradeoff**: duplicación semántica (ej. `--color-primary: #111` y `--color-black: #111` apuntan al mismo valor).

### 2. Fondo hero offwhite plano

Se reemplazó el gradiente radial del hero por un fondo plano `--color-offwhite`. El gradiente anterior dependía de tokens que cambiaron de valor; mantenerlo habría distorsionado el diseño.

### 3. Dark mode intacto

`[data-theme="dark"]` no recibió ningún cambio. Los tokens antiguos que se eliminaron de `:root` (`--shadow-*`, `--color-primary-hover`) no estaban referenciados en dark mode, por lo que su eliminación no afecta. Las sombras se conservan en dark mode porque ese bloque aún las define.

### 4. Reemplazo de sombras por bordes gold

Se eliminó `box-shadow` de todos los componentes en light mode. La jerarquía visual se reemplazó por bordes `color-mix(in srgb, var(--color-gold-light) 30%, transparent)`. Al no estar definidos los tokens de sombra en `:root`, `var(--shadow-*)` produce declaración inválida → `box-shadow: none`.

### 5. Migración solo CSS

Ningún archivo `.tsx` fue modificado. Todos los cambios visuales se hicieron vía CSS en `index.css` y `tokens.css`. Esto minimiza riesgo de regresiones en lógica de componentes y facilita el rollback.

---

## Especificación de Tokens — Estado Final `:root`

| Token | Valor | Nota |
|-------|-------|------|
| `--color-background` | `#f8f7f4` | Reemplazado (era `#FFFBEB`) |
| `--color-foreground` | `#111` | Reemplazado (era `#0F172A`) |
| `--color-primary` | `#111` | Reemplazado (era `#92400E`) |
| `--color-accent` | `#b08d57` | Reemplazado (era `#D97706`) |
| `--color-surface` | `#FFFFFF` | Sin cambios |
| `--color-destructive` | `#DC2626` | Sin cambios |
| `--color-muted` | `#f8f7f4` | Reemplazado (era `#F5F0EB`) |
| `--color-muted-fg` | `#6e6e6e` | Reemplazado (era `#78716C`) |
| `--color-border` | `color-mix(...)` | Gold-light mix |
| `--color-offwhite` | `#f8f7f4` | **Nuevo** |
| `--color-black` | `#111` | **Nuevo** |
| `--color-gold` | `#b08d57` | **Nuevo** |
| `--color-gold-light` | `#c9a96e` | **Nuevo** |
| `--color-gold-dark` | `#8b6a3d` | **Nuevo** |
| `--color-gray` | `#6e6e6e` | **Nuevo** |
| `--color-gray-light` | `#a8a6a0` | **Nuevo** |
| `--color-espresso` | `#3a2a22` | **Nuevo** |
| `--font-accent` | `"Cormorant Garamond", "Playfair Display", Georgia, serif` | **Nuevo** |
| `--shadow-*` | (eliminados de `:root`) | Solo en `[data-theme="dark"]` |

---

## Issues Conocidos y Consideraciones Futuras

### Contraste WCAG AA

- **Gold (`#b08d57`) sobre offwhite (`#f8f7f4`)**: ~3.2:1 — No cumple AA para texto normal.
  - **Mitigación**: Gold se usa exclusivamente para elementos decorativos (bordes, líneas, iconos). Nunca para texto funcional.
- **Gold-dark (`#8b6a3d`) sobre offwhite**: ~4.7:1 — Cumple AA (>4.5:1).
  - Se usa para eyebrow text y títulos decorativos pequeños.

### Dependencia de `color-mix()`

`--color-border` usa `color-mix(in srgb, var(--color-gold-light) 30%, transparent)`, función CSS que no está soportada en navegadores muy antiguos. El fallback manual sería `#d8cfbc` (mezcla equivalente calculada). Si se requiere soporte legacy, agregar el valor directo.

### Duplicación Semántica de Tokens

`--color-primary: #111` y `--color-black: #111` son equivalentes. En una futura limpieza del design system, se podría unificar eliminando los nombres legacy y migrando las 55 referencias `var()` al nuevo naming. Esto requeriría actualizar también `[data-theme="dark"]`, por lo que debe planificarse como un cambio independiente.

### Tipografía Cormorant Garamond

No se verificó visualmente la renderización en todos los navegadores objetivo porque el proyecto no tiene suite de tests visuales ni E2E. Se confió en el build exitoso de TypeScript + Vite y la inspección estática de la URL de Google Fonts.

---

## Consistencia del Ciclo SDD

| Fase | Estado | Artefacto |
|------|--------|-----------|
| Proposal | ✅ Completado | `proposal.md` |
| Spec | ✅ Completado | `specs/design-system/spec.md` (delta) |
| Design | ✅ Completado | `design.md` |
| Tasks | ✅ Completado (8/8) | `tasks.md` |
| Apply | ✅ Completado | Implementación en código |
| Verify | ✅ Approved (28/28) | `verify-report.md` |
| **Archive** | **✅ Completado** | **Este reporte** |

---

## Source of Truth

El main spec `openspec/specs/design-system/spec.md` fue actualizado con los cambios de este delta:
- DSG-REQ-1: modificado — tokens Dos Legados en light mode, sombras solo en dark mode
- DSG-REQ-2: modificado — categorías con nuevos tokens y `--font-accent`
- DSG-REQ-3: modificado — incluye Cormorant Garamond en Google Fonts
- DSG-REQ-6: agregado — nuevos tokens de color Dos Legados
- DSG-REQ-7: agregado — carga de Cormorant Garamond
- DSG-REQ-8: agregado — clases utilitarias editoriales

---

*Archive generado el 2026-06-30 por `sdd-archive`. Ciclo SDD completo.*
