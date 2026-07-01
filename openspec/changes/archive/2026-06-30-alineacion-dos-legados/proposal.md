# Propuesta: Alineación Visual con Dos Legados

## Intención

Bitácora Café opera bajo la marca madre «Dos Legados — Café de Especialidad», pero su identidad visual actual (ámbar/café cálido sobre fondo #FFFBEB) no refleja el branding corporativo. El objetivo es alinear los tokens de color light mode, la tipografía y los componentes visuales con la paleta oficial de Dos Legados (offwhite, gold, black, espresso) para lograr coherencia de marca sin alterar la funcionalidad existente.

## Alcance

### Incluye
- Tokens de color light mode → paleta Dos Legados (offwhite, gold, black, gray, espresso)
- Nueva tipografía: `--font-accent` (Cormorant Garamond) con carga en index.html
- Utilidades editoriales: `.editorial-title`, `.editorial-body`, `.eyebrow`, `.accent-line`, `.divider-botanical`, `.hover-gold`
- LandingPage: hero + CTA grid adaptados al nuevo sistema visual sin sombras
- Nav/Footer: colores, bordes y tipografía actualizados a la marca
- Remoción de sombras en todos los componentes → reemplazo por bordes gold

### Excluye
- Dark mode: no se modifica, refactoriza ni toca
- Backend, lógica de negocio o nuevas funcionalidades
- Componentes no listados (tasting notes, modales, formularios internos: reciben solo actualización de tokens vía CSS)

## Capacidades

### Nuevas
Ninguna — todos los cambios son visuales dentro del design system existente.

### Modificadas
- `design-system`: tokens light mode reemplazados, tipografía expandida con `--font-accent`, nuevas utilidades editoriales, shadow tokens deprecados en light mode (se conservan en dark mode)

## Enfoque

1. **Tokens**: reemplazar valores `:root` en `tokens.css`. Agregar `--color-offwhite`, `--color-black`, `--color-gold*`, `--color-gray*`, `--color-espresso`, `--font-accent`. Dark mode intacto.
2. **Tipografía**: agregar Cormorant Garamond (cursiva 400–700) en `index.html`.
3. **Utilidades**: clases editoriales en `index.css` bajo un bloque `/* Dos Legados editorial */`.
4. **Componentes**: LandingPage (sin sombras, gold en bordes), Layout (nav/footer actualizados), remover `box-shadow` en data-table, form, detail-grid, detail-notes; reemplazar por gold borders.

## Áreas Afectadas

| Archivo | Impacto | Cambio |
|---------|---------|--------|
| `frontend/src/styles/tokens.css` | Modificado | Tokens light mode → paleta Dos Legados; nuevos tokens gold/gray/espresso |
| `frontend/index.html` | Modificado | Agregar Google Fonts: Cormorant Garamond |
| `frontend/src/styles/index.css` | Modificado | Utilidades editoriales + shadow removal en componentes |
| `frontend/src/components/LandingPage.tsx` | Modificado | Hero visual + CTA cards sin sombras |
| `frontend/src/components/Layout.tsx` | Modificado | Nav/footer actualizados a esquema de marca |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Contraste insuficiente (gold sobre offwhite) | Media | Verificar WCAG AA antes de aplicar |
| Regresión en dark mode al tocar tokens compartidos | Baja | `[data-theme="dark"]` separado; solo se modifica `:root` |
| Shadow removal visible como pérdida de jerarquía visual | Media | Reemplazar por gold borders y líneas decorativas |

## Plan de Rollback

Revertir commits por capa (tokens → utilidades → componentes) con `git revert` o `git checkout` de archivos individuales. Commits atómicos por archivo permiten rollback parcial si una capa falla.

## Dependencias

- Google Fonts: agregar Cormorant Garamond (400, 400i, 600, 600i, 700) al bloque preconnect existente en `index.html`

## Criterios de Éxito

- [ ] Todos los tokens `:root` reflejan la paleta Dos Legados
- [ ] Nav y footer usan offwhite/gold/black
- [ ] LandingPage y CTA cards sin sombras, con bordes gold
- [ ] Dark mode visualmente idéntico al actual (captura de referencia)
- [ ] No hay colores raw fuera de `tokens.css` en el nuevo código
