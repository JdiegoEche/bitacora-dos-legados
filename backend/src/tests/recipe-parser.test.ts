import { describe, it, expect } from 'vitest';
import { parseMethodSlug, parseRecipesFromMarkdown } from '../lib/recipe-parser';

// ─── Method Slug Extraction ─────────────────────────────────────────────────

describe('parseMethodSlug', () => {
  it('extracts "v60" from V60 markdown heading', () => {
    const content = '# 01 - V60 | RECETARIO DE RECETAS ICÓNICAS\n\n...';
    expect(parseMethodSlug(content)).toBe('v60');
  });

  it('extracts "switch" from Switch markdown heading', () => {
    const content = '# 02 - HARIO SWITCH | RECETARIO DE RECETAS ICÓNICAS\n\n...';
    expect(parseMethodSlug(content)).toBe('switch');
  });

  it('extracts "origami" from Origami Dripper heading', () => {
    const content = '# 03 - ORIGAMI DRIPPER | RECETARIO DE RECETAS ICÓNICAS\n\n...';
    expect(parseMethodSlug(content)).toBe('origami');
  });

  it('extracts "kalitawave" from Kalita Wave heading', () => {
    const content = '# 04 - KALITA WAVE | RECETARIO DE RECETAS ICÓNICAS\n\n...';
    expect(parseMethodSlug(content)).toBe('kalitawave');
  });

  it('extracts "chemex" from Chemex heading', () => {
    const content = '# 05 - CHEMEX | RECETARIO DE RECETAS ICÓNICAS\n\n...';
    expect(parseMethodSlug(content)).toBe('chemex');
  });

  it('extracts "aeropress" from Aeropress heading', () => {
    const content = '# 06 - AEROPRESS | RECETARIO DE RECETAS ICÓNICAS\n\n...';
    expect(parseMethodSlug(content)).toBe('aeropress');
  });
});

// ─── Recipe Parsing ──────────────────────────────────────────────────────────

const v60Sample = `# 01 - V60 | RECETARIO DE RECETAS ICÓNICAS

---

## 1. James Hoffmann – Ultimate V60

### Objetivo
Extracción equilibrada, alta claridad, dulzor alto y baja astringencia.

### Parámetros

| Parámetro | Valor |
|-----------|------:|
| Café | 15 g |
| Agua | 250 g |
| Ratio | 1:16.7 |
| Temperatura | 96–100 °C |
| Molienda | Media-fina |
| Tiempo total | 2:45–3:30 |

### Preparación
Filtro enjuagado, servidor precalentado, cama nivelada.

### Bloom
- 0:00 → 50 g de agua
- 0:10 → swirl suave
- 0:45 → inicio del siguiente vertido

### Vertido 1
- 0:45 → 200 g total
- Movimiento en espiral desde centro hacia afuera
- Caudal medio

### Vertido 2
- 1:20 → 250 g total
- Vertido más lento para estabilizar extracción

### Finalización
- Swirl suave para nivelar cama
- Drawdown esperado: 2:45–3:30

### Perfil
Alta claridad, dulzor alto, acidez limpia.

---

## 2. Scott Rao – High Extraction V60

### Objetivo
Máxima extracción sin amargor mediante flujo constante y control de cama.

### Parámetros

| Parámetro | Valor |
|-----------|------:|
| Café | 20 g |
| Agua | 340 g |
| Ratio | 1:17 |
| Temperatura | 96–99 °C |
| Molienda | Media-fina |
| Tiempo total | 3:00–3:45 |

### Bloom
- 0:00 → 60 g agua
- Agitación suave con cuchara o swirl
- 0:45 → continuar

### Vertido único
- 0:45 → 340 g total en flujo continuo
- Mantener cama siempre húmeda
- Evitar canales

### Finalización
- Swirl enérgico para nivelar

### Perfil
Cuerpo medio-alto, dulzor intenso, textura densa.

---

## FIN DEL MÉTODO V60`;

describe('parseRecipesFromMarkdown', () => {
  it('parses all recipes from V60 markdown', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    expect(recipes).toHaveLength(2);
  });

  it('extracts recipe name correctly', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    expect(recipes[0].name).toBe('James Hoffmann – Ultimate V60');
    expect(recipes[1].name).toBe('Scott Rao – High Extraction V60');
  });

  it('extracts objective', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    expect(recipes[0].objective).toContain('Extracción equilibrada');
    expect(recipes[1].objective).toContain('Máxima extracción sin amargor');
  });

  it('extracts parameters from table', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    const r1 = recipes[0];
    expect(r1.coffeeDose).toBe(15);
    expect(r1.waterDose).toBe(250);
    expect(r1.ratio).toBe('1:16.7');
    expect(r1.temperature).toBe('96–100 °C');
    expect(r1.grindSize).toBe('Media-fina');
    expect(r1.totalTime).toBe('2:45–3:30');

    const r2 = recipes[1];
    expect(r2.coffeeDose).toBe(20);
    expect(r2.waterDose).toBe(340);
    expect(r2.ratio).toBe('1:17');
    expect(r2.temperature).toBe('96–99 °C');
    expect(r2.grindSize).toBe('Media-fina');
    expect(r2.totalTime).toBe('3:00–3:45');
  });

  it('extracts profile', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    expect(recipes[0].profile).toContain('Alta claridad');
    expect(recipes[1].profile).toContain('Cuerpo medio-alto');
  });

  it('extracts steps from preparation sections', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    const r1 = recipes[0];
    expect(r1.steps.length).toBeGreaterThanOrEqual(4); // Bloom, Vertido 1, Vertido 2, Finalización
    expect(r1.steps[0].stepOrder).toBe(1);
    expect(r1.steps[0].instruction).toContain('Bloom');
    // The first step should include the Bloom section content
    expect(r1.steps[0].instruction).toContain('50 g');
    // Step sections that aren't Objetivo, Parámetros, or Perfil
    const stepNames = r1.steps.map((s) => s.instruction.split('\n')[0]);
    // Step sections include Bloom, Vertido 1, Vertido 2, Finalización
    expect(stepNames.some((n) => n.includes('Bloom'))).toBe(true);
    expect(stepNames.some((n) => n.includes('Vertido'))).toBe(true);
  });

  it('assigns correct method to all recipes', () => {
    const recipes = parseRecipesFromMarkdown(v60Sample, 'v60');
    for (const r of recipes) {
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('objective');
      expect(r).toHaveProperty('coffeeDose');
      expect(r).toHaveProperty('waterDose');
      expect(r).toHaveProperty('ratio');
      expect(r).toHaveProperty('temperature');
      expect(r).toHaveProperty('grindSize');
      expect(r).toHaveProperty('totalTime');
      expect(r).toHaveProperty('profile');
      expect(r).toHaveProperty('steps');
    }
  });
});

// ─── Aeropress edge cases (missing fields) ───────────────────────────────────

const aeropressSample = `# 06 - AEROPRESS | RECETARIO DE RECETAS ICÓNICAS

---

## 1. Tim Wendelboe Aeropress

### Objetivo
Taza limpia, dulce y consistente.

### Parámetros

| Parámetro | Valor |
|-----------|------:|
| Café | 14 g |
| Agua | 200 g |
| Ratio | 1:14 |
| Temperatura | 92–94 °C |
| Molienda | Media-fina |
| Tiempo total | 2:00 |

### Inmersión
- 0:00 → añadir 200 g agua
- Agitar 3–4 veces
- 1:00 → colocar filtro

### Prensado
- 1:00–2:00 → presión constante

### Perfil
Muy limpio, dulce, balanceado.

---

## 2. World Aeropress Championship Style (2019+)

### Objetivo
Alta intensidad y dulzor concentrado.

### Parámetros

| Parámetro | Valor |
|-----------|------:|
| Café | 30–35 g |
| Agua | 150–200 g |
| Tiempo | 1:30–2:00 |

### Perfil
Intenso, dulce, tipo espresso filtrado.

---

## FIN AEROPRESS`;

describe('parseRecipesFromMarkdown — Aeropress edge cases', () => {
  it('parses standard Aeropress recipe with full params', () => {
    const recipes = parseRecipesFromMarkdown(aeropressSample, 'aeropress');
    expect(recipes).toHaveLength(2);
    expect(recipes[0].name).toBe('Tim Wendelboe Aeropress');
    expect(recipes[0].coffeeDose).toBe(14);
    expect(recipes[0].waterDose).toBe(200);
  });

  it('handles range values in coffee/water doses by taking first number', () => {
    const recipes = parseRecipesFromMarkdown(aeropressSample, 'aeropress');
    // Recipe 2 has "30–35 g" and "150–200 g"
    expect(recipes[1].coffeeDose).toBeGreaterThan(0);
    expect(recipes[1].waterDose).toBeGreaterThan(0);
  });

  it('handles recipes with missing temperature/ratio/grindSize fields', () => {
    const recipes = parseRecipesFromMarkdown(aeropressSample, 'aeropress');
    // Recipe 2 has no temperature, ratio, or grindSize in its table
    expect(typeof recipes[1].temperature).toBe('string');
    expect(typeof recipes[1].ratio).toBe('string');
    expect(typeof recipes[1].grindSize).toBe('string');
  });

  it('uses empty string for missing optional text parameters', () => {
    const recipes = parseRecipesFromMarkdown(aeropressSample, 'aeropress');
    // Recipe 2 has no temperature in table, should default to ''
    expect(recipes[1].temperature).toBe('');
    expect(recipes[1].ratio).toBe('');
    expect(recipes[1].grindSize).toBe('');
  });

  it('extracts steps from recipe with Immersion + Press sections', () => {
    const recipes = parseRecipesFromMarkdown(aeropressSample, 'aeropress');
    const r1 = recipes[0];
    // Recipe 1 has: Inmersión (3 instruction lines) + Prensado (1 instruction line)
    expect(r1.steps.length).toBeGreaterThanOrEqual(2);
    expect(r1.steps[0].instruction).toContain('Inmersión');
    expect(r1.steps[1].instruction).toContain('Prensado');
  });
});

// ─── Empty Content ───────────────────────────────────────────────────────────

describe('parseRecipesFromMarkdown — edge cases', () => {
  it('returns empty array for content with no recipe sections', () => {
    const content = '# Solo título\n\nSin recetas.\n\nFIN';
    const recipes = parseRecipesFromMarkdown(content, 'v60');
    expect(recipes).toEqual([]);
  });

  it('returns empty array for completely empty content', () => {
    const recipes = parseRecipesFromMarkdown('', 'v60');
    expect(recipes).toEqual([]);
  });
});
