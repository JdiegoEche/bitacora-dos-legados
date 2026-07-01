# Delta para Design System — Alineación Visual con Dos Legados

## Resumen

Este delta spec describe la alineación visual de Bitácora Café con la identidad de marca Dos Legados. Modifica los tokens de color en `:root` (light mode), agrega tipografía editorial, introduce clases utilitarias, reemplaza sombras por bordes dorados, y actualiza los componentes LandingPage, nav y footer. El dark mode no se modifica.

---

## ADDED Requirements

### Requisito: DSG-REQ-6 — Nuevos tokens de color Dos Legados

El archivo `tokens.css` DEBE definir los siguientes tokens nuevos en `:root` (light mode):

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-offwhite` | `#f8f7f4` | Fondo principal del layout |
| `--color-black` | `#111` | Texto principal, acciones primarias, logo |
| `--color-gold` | `#b08d57` | Acentos decorativos, bordes primarios |
| `--color-gold-light` | `#c9a96e` | Bordes hover, variante clara de acento |
| `--color-gold-dark` | `#8b6a3d` | Eyebrow text, títulos decorativos |
| `--color-gray` | `#6e6e6e` | Texto secundario, metadatos |
| `--color-gray-light` | `#a8a6a0` | Placeholders, texto deshabilitado |
| `--color-espresso` | `#3a2a22` | Fondo de sección hero, fondos oscuros localizados |

#### Escenario: Nuevos tokens están presentes en `:root`

- GIVEN `tokens.css` se carga en el navegador
- WHEN se inspecciona `getComputedStyle(document.documentElement)`
- THEN los ocho tokens nuevos están definidos en `:root`
- AND los tokens NO están definidos en `[data-theme="dark"]` (a menos que se agreguen explícitamente)

#### Escenario: Tokens ausentes rompen layout

- GIVEN un token Dos Legados no está definido
- WHEN el componente que lo referencia se renderiza
- THEN el valor por defecto de `var()` (si existe) se usa como fallback
- AND `tokens.css` no se considera válido hasta que todos los tokens estén definidos

### Requisito: DSG-REQ-7 — Carga de Cormorant Garamond

`index.html` DEBE cargar Cormorant Garamond vía Google Fonts con pesos 400, 400i, 500, 500i, 600, 600i, 700, 700i y `font-display: swap`.

#### Escenario: Carga correcta de la tipografía

- GIVEN `index.html` incluye el `<link>` a Google Fonts con Cormorant Garamond
- WHEN la página carga en un navegador
- THEN la fuente Cormorant Garamond está disponible para uso CSS
- AND los pesos 400, 400i, 500, 500i, 600, 600i, 700, 700i se descargan

#### Escenario: Fallback en conexión lenta

- GIVEN una red lenta
- WHEN la página se renderiza antes de que Cormorant Garamond termine de cargar
- THEN el sistema usa `Georgia`, `serif` como fallback inmediato
- AND el texto se intercambia a Cormorant Garamond una vez cargada

### Requisito: DSG-REQ-8 — Clases utilitarias editoriales

`index.css` DEBE definir las siguientes clases utilitarias bajo un bloque `/* Dos Legados editorial */`:

| Clase | Propiedades | Contexto de uso |
|-------|-------------|-----------------|
| `.editorial-title` | `font-family: var(--font-heading)`, `font-weight: 600`, `line-height: 1.1`, `letter-spacing: 0.02em` | Títulos de landing, encabezados de sección editorial |
| `.editorial-body` | `font-family: var(--font-accent)`, `font-style: italic`, `color: var(--color-gray)`, `line-height: 1.7` | Cuerpo de texto editorial, citas, descripciones |
| `.eyebrow` | `text-transform: uppercase`, `color: var(--color-gold-dark)`, `letter-spacing: 0.25em`, `font-size: 0.75rem`, `font-weight: 600` | Etiqueta superior decorativa antes del título |
| `.accent-line` | `width: 48px`, `height: 1px` (o `border-top`), `background: var(--color-gold)` | Línea decorativa horizontal de acento |
| `.divider-botanical` | `height: 1px`, `background: linear-gradient(90deg, transparent, var(--color-gold), transparent)` | Divisor decorativo entre secciones |
| `.hover-gold` | `transition: color 0.2s`, al hover `color: var(--color-gold)` | Links, íconos, elementos interactivos |

#### Escenario: Clases utilitarias aplicadas correctamente

- GIVEN un elemento con clase `.editorial-title`
- WHEN el navegador renderiza
- THEN usa `Playfair Display`, weight 600, line-height 1.1, letter-spacing 0.02em

#### Escenario: Divider botanical visible

- GIVEN un elemento `<hr>` con clase `.divider-botanical`
- WHEN el navegador renderiza
- THEN se muestra una línea horizontal con gradiente transparent → gold → transparent

---

## MODIFIED Requirements

### Requisito: DSG-REQ-1 — Definición de tokens CSS (MODIFICADO)

Todos los tokens visuales DEBEN definirse en `styles/tokens.css` como custom properties en `:root` (light) y `[data-theme="dark"]` (dark). Cada archivo CSS de componente DEBE referenciar tokens exclusivamente vía `var()`.

En light mode (`:root`), los valores de los tokens se reemplazan por la paleta Dos Legados. Los tokens de sombra (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) se eliminan de `:root` pero SE CONSERVAN en `[data-theme="dark"]`.
(Anteriormente: valores ámbar/cálido con sombras en light mode)

#### Escenario: Light mode con paleta Dos Legados

- GIVEN no hay atributo `data-theme` en `<html>`
- WHEN el navegador renderiza
- THEN todos los elementos usan los valores de `:root` de la paleta Dos Legados
- AND `box-shadow` no está presente en las cards, tablas, formularios ni detail-grid

#### Escenario: Dark mode sin cambios

- GIVEN `<html>` tiene `data-theme="dark"`
- WHEN el navegador renderiza
- THEN todos los elementos usan los valores oscuros originales
- AND las sombras siguen presentes en dark mode

### Requisito: DSG-REQ-2 — Categorías de tokens (MODIFICADO)

El archivo de tokens DEBE definir valores para estas categorías:

| Categoría | Tokens (light) |
|-----------|----------------|
| Colores light | `--color-offwhite`, `--color-black`, `--color-gold`, `--color-gold-light`, `--color-gold-dark`, `--color-gray`, `--color-gray-light`, `--color-espresso`, `--color-surface`, `--color-destructive` |
| Tipografía | `--font-heading` (Playfair Display), `--font-body` (Inter), `--font-accent` (Cormorant Garamond), `--text-xs` a `--text-4xl` |
| Espaciado | `--space-1` a `--space-8` (incrementos de 4px) |
| Sombras | `--shadow-sm`, `--shadow-md`, `--shadow-lg` — solo en dark mode |
| Radio | `--radius-sm`, `--radius-md`, `--radius-lg` |

(Anteriormente: colores primarios/secundarios cálidos, sin `--font-accent`, sombras en ambos modos)

#### Escenario: Tokens actualizados presentes

- GIVEN `tokens.css` está cargado
- WHEN se inspecciona `:root` via `getComputedStyle`
- THEN los tokens de color Dos Legados existen
- AND los tokens antiguos (`--color-primary`, `--color-accent`, etc. en `:root`) NO existen

#### Escenario: Token `--font-accent` disponible

- GIVEN `tokens.css` define `--font-accent`
- WHEN se usa en CSS via `var(--font-accent)`
- THEN se resuelve a `"Cormorant Garamond", "Playfair Display", Georgia, serif`

### Requisito: DSG-REQ-3 — Integración Google Fonts (MODIFICADO)

`index.html` DEBE cargar Playfair Display (400–700), Inter (300–700), y Cormorant Garamond (400, 400i, 500, 500i, 600, 600i, 700, 700i) via `<link>` con `font-display: swap`.
(Anteriormente: solo Playfair Display e Inter)

#### Escenario: Carga completa de fuentes

- GIVEN `index.html` tiene el `<link>` a Google Fonts
- WHEN se inspeccionan las fuentes cargadas via `document.fonts`
- THEN Playfair Display, Inter y Cormorant Garamond están disponibles

#### Escenario: Font swap en conexión lenta

- GIVEN una red lenta
- WHEN la página carga
- THEN las fuentes fallback del sistema se renderizan inmediatamente
- AND se intercambian por las Google Fonts una vez cargadas

---

## REMOVED Requirements

### Requisito: DSG-REQ-REMOVIDO-1 — Token `--color-primary` en `:root`

(Reason: Reemplazado por `--color-black` como color de acciones primarias. El dorado cubre acentos decorativos, el negro cubre acciones y texto principal.)
(Migration: En componentes light mode, reemplazar `var(--color-primary)` por `var(--color-black)`. Para iconos decorativos, usar `var(--color-gold)`.)

### Requisito: DSG-REQ-REMOVIDO-2 — Token `--color-primary-hover` en `:root`

(Reason: Se elimina el hover específico. Los botones primarios usan `--color-black` con opacidad al hover en lugar de un token separado.)
(Migration: Reemplazar `var(--color-primary-hover)` por `color-mix(in srgb, var(--color-black) 85%, transparent)` o similar.)

### Requisito: DSG-REQ-REMOVIDO-3 — Token `--color-accent` en `:root`

(Reason: Reemplazado por `--color-gold` como acento decorativo principal.)
(Migration: Reemplazar `var(--color-accent)` por `var(--color-gold)` en light mode.)

### Requisito: DSG-REQ-REMOVIDO-4 — Token `--color-background`, `--color-foreground`, `--color-muted`, `--color-muted-fg`, `--color-border` en `:root`

(Reason: Reemplazados por `--color-offwhite`, `--color-black`, `--color-gray`, `--color-gray-light` y bordes con opacidad gold.)
(Migration: Mapear según la tabla de reemplazo en la Especificación de Tokens.)

### Requisito: DSG-REQ-REMOVIDO-5 — Sombras (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) en `:root`

(Reason: Se elimina la jerarquía basada en sombras en light mode. Se reemplaza por bordes gold, líneas decorativas y espaciado. Las sombras se conservan en dark mode.)
(Migration: No se necesita migración en componentes light mode si usaban `var(--shadow-*)` — se resuelven a `initial` al no estar definidos. Para componentes que necesiten jerarquía visual, agregar `border: 1px solid var(--color-gold-light)` con 30% de opacidad.)

---

## Especificación de Tokens — Tabla Completa `:root`

| Token actual (`:root`) | Valor actual | → | Nuevo token | Nuevo valor |
|---|---|---|---|---|
| `--color-background` | `#FFFBEB` | → | `--color-offwhite` | `#f8f7f4` |
| `--color-foreground` | `#0F172A` | → | `--color-black` | `#111` |
| `--color-primary` | `#92400E` | → | `--color-black` | `#111` |
| `--color-primary-hover` | `#78350F` | → | *(eliminado)* | — |
| `--color-accent` | `#D97706` | → | `--color-gold` | `#b08d57` |
| `--color-muted` | `#F5F0EB` | → | `--color-offwhite` | `#f8f7f4` |
| `--color-muted-fg` | `#78716C` | → | `--color-gray` | `#6e6e6e` |
| `--color-border` | `#E8DFD3` | → | *(ver nota)* | `color-mix(in srgb, var(--color-gold-light) 30%, transparent)` |
| `--color-secondary` | `#B45309` | → | *(eliminado)* | — |
| `--shadow-sm` | `0 1px 2px...` | → | *(eliminado de `:root`)* | — |
| `--shadow-md` | `0 4px 6px...` | → | *(eliminado de `:root`)* | — |
| `--shadow-lg` | `0 10px 15px...` | → | *(eliminado de `:root`)* | — |
| *(nuevo)* | — | → | `--color-gold-light` | `#c9a96e` |
| *(nuevo)* | — | → | `--color-gold-dark` | `#8b6a3d` |
| *(nuevo)* | — | → | `--color-gray-light` | `#a8a6a0` |
| *(nuevo)* | — | → | `--color-espresso` | `#3a2a22` |
| *(nuevo)* | — | → | `--font-accent` | `"Cormorant Garamond", "Playfair Display", Georgia, serif` |

> Nota: `--color-border` en light mode se redefine como `color-mix(in srgb, var(--color-gold-light) 30%, transparent)`. Si `color-mix` no está soportado, usar valor directo `#d8cfbc` (mezcla manual equivalente).

---

## Especificación Tipográfica

### Fuentes
| Rolle | Token | Font Stack | Pesos |
|-------|-------|------------|-------|
| Títulos | `--font-heading` | `'Playfair Display', Georgia, serif` | 400–700 (existente) |
| Cuerpo | `--font-body` | `'Inter', -apple-system, sans-serif` | 300–700 (existente) |
| Acento editorial | `--font-accent` | `"Cormorant Garamond", "Playfair Display", Georgia, serif` | 400, 400i, 500, 500i, 600, 600i, 700, 700i |

### Carga en `index.html`

Agregar al `<link>` existente de Google Fonts:

```
&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700
```

---

## Especificación de Utilidades Editoriales

Las siguientes clases se agregan en `index.css` bajo `/* Dos Legados editorial */`:

```css
/* Dos Legados editorial */
.editorial-title {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: 0.02em;
}

.editorial-body {
  font-family: var(--font-accent);
  font-style: italic;
  color: var(--color-gray);
  line-height: 1.7;
}

.eyebrow {
  text-transform: uppercase;
  color: var(--color-gold-dark);
  letter-spacing: 0.25em;
  font-size: 0.75rem;
  font-weight: 600;
}

.accent-line {
  width: 48px;
  height: 1px;
  background: var(--color-gold);
  border: none;
}

.divider-botanical {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
  border: none;
}

.hover-gold {
  transition: color 0.2s ease;
}

.hover-gold:hover {
  color: var(--color-gold);
}
```

---

## Matriz de Impacto por Componente

| Componente | Actual | Target | Criterio de Aceptación |
|------------|--------|--------|------------------------|
| LandingPage — Hero | Fondo gradiente ámbar, título primary, acento amber | Fondo `--color-espresso` u offwhite, título `--color-black`, línea accent gold | Hero usa colores Dos Legados. Sin sombras. Título en black. Línea decorative gold presente. |
| LandingPage — CTA Cards | `box-shadow`, borde `--color-border`, hover eleva sombra | Sin `box-shadow`. Borde gold-light con 30% opacidad. Hover: gold. | Al hover: borde gold sólido, sin translateY, sin sombra. |
| Nav | Fondo `--color-surface`, borde `--color-border`, texto `--color-muted-fg` | Fondo `--color-offwhite`, borde gold-light, texto `--color-black` | Nav usa offwhite + gold. Logo en black. Links cambian a gold en hover. |
| Footer | Fondo `--color-muted`, texto `--color-muted-fg`, borde `--color-border` | Fondo `--color-offwhite`, texto `--color-gray`, borde gold-light arriba | Footer usa offwhite + gold-light border. |
| Data Table | `box-shadow`, borde `--color-border` | Sin `box-shadow`. Borde gold-light opaco. | Tabla sin sombra. Bordes gold-light sutiles. |
| Form | `box-shadow`, borde `--color-border` | Sin `box-shadow`. Borde gold-light opaco. | Formularios sin sombra. Input focus con borde gold. |
| Detail Grid | `box-shadow`, bg `--color-surface` | Sin `box-shadow`. Borde gold-light opaco. | Detail grid sin sombra. |
| Detail Notes | `box-shadow`, bg `--color-surface` | Sin `box-shadow`. Borde gold-light opaco. | Detail notes sin sombra. |
| Buttons | Fondo `--color-primary`, hover `--color-primary-hover` | Fondo `--color-black`, hover con opacidad 85% | Botones primarios en black. Sin hover específico. |

---

## Restricción de Dark Mode

`[data-theme="dark"]` NO DEBE modificarse. Los únicos cambios permitidos en dark mode son aquellos que ocurren automáticamente por herencia de tokens que antes estaban en `:root` y ahora se eliminan (p. ej. `--color-primary`), pero el archivo `tokens.css` NO DEBE alterar ningún valor existente bajo `[data-theme="dark"]`.

### Criterios de verificación

- [ ] `tokens.css` no tiene cambios en ningún bloque `[data-theme="dark"]`
- [ ] Las sombras (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) siguen definidas en `[data-theme="dark"]`
- [ ] Los componentes renderizados en dark mode se ven idénticos al estado pre-cambio (comparación visual o snapshot)
- [ ] El toggle de dark mode sigue funcionando sin errores

---

## Restricciones de Diseño

### Contraste WCAG AA
- Texto gold (`--color-gold: #b08d57`) sobre fondo offwhite (`#f8f7f4`): relación de contraste ~3.2:1 — NO cumple AA para texto normal.
- **Regla**: Gold solo se usa para elementos decorativos (bordes, líneas, iconos decorativos). Nunca para texto de cuerpo o enlaces funcionales.
- Texto gold-dark (`--color-gold-dark: #8b6a3d`) sobre offwhite: relación ~4.7:1 — cumple AA para texto normal (>4.5:1).
- **Regla**: `--color-gold-dark` se usa para eyebrow text y títulos decorativos pequeños. `--color-gray` para texto secundario.

### Reemplazo de sombras
- Toda ocurrencia de `box-shadow` en componentes light mode DEBE eliminarse.
- La jerarquía visual se reemplaza por: bordes gold-light (30% opacidad), líneas accent, y espaciado generoso.
- En hover (CTA cards): borde gold sólido, sin `translateY`, sin sombra.

### Uso del gold
- `--color-gold` es el acento principal: bordes, líneas decorativas, iconos, hover states.
- `--color-gold-light` es para bordes sutiles y hover transitions.
- `--color-gold-dark` es para texto decorativo pequeño (eyebrows, badges).
- El gold NUNCA se usa como fondo de botón primario — los botones usan `--color-black`.

---

## Criterios de Aceptación Visual

### Tokens y Tipografía
- [ ] `:root` en `tokens.css` tiene todos los tokens Dos Legados y ninguno de los antiguos (`--color-primary`, `--color-accent`, etc.)
- [ ] `[data-theme="dark"]` no tiene cambios
- [ ] `index.html` carga Cormorant Garamond con todos los pesos requeridos
- [ ] `--font-accent` está definido en `tokens.css`

### Utilidades Editoriales
- [ ] `.editorial-title`, `.editorial-body`, `.eyebrow`, `.accent-line`, `.divider-botanical`, `.hover-gold` existen en `index.css`
- [ ] Cada clase tiene las propiedades especificadas

### LandingPage
- [ ] Hero sin sombras, con colores Dos Legados
- [ ] CTA cards sin `box-shadow`, borde gold-light, hover cambia a borde gold sólido
- [ ] Sin `translateY` en hover de CTA cards

### Nav y Footer
- [ ] Nav con fondo `--color-offwhite`, borde inferior gold-light
- [ ] Logo en `--color-black`, links cambian a gold en hover
- [ ] Footer con fondo `--color-offwhite`, borde superior gold-light, texto en `--color-gray`

### Componentes
- [ ] Data-table sin `box-shadow`
- [ ] Formularios sin `box-shadow`
- [ ] Detail-grid y detail-notes sin `box-shadow`
- [ ] Botones primarios en `--color-black`

### Dark Mode
- [ ] Toggle funciona y persiste preferencia
- [ ] Dark mode visualmente idéntico al estado anterior
- [ ] Sombras siguen presentes en dark mode
