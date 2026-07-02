/**
 * Recipe Parser — extracts structured recipe data from markdown files
 * in the filter-coffeMD format.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedStep {
  stepOrder: number;
  instruction: string;
  waterAtStep?: number;
}

export interface ParsedRecipe {
  name: string;
  objective: string;
  preparation: string;
  coffeeDose: number;
  waterDose: number;
  ratio: string;
  temperature: string;
  grindSize: string;
  totalTime: string;
  profile: string;
  steps: ParsedStep[];
}

export interface ParsedFile {
  method: string;
  recipes: ParsedRecipe[];
}

// ─── Method Slug Mapping ─────────────────────────────────────────────────────

/**
 * Known method names mapped from the file title patterns.
 * The first heading follows: "# NN - METHOD_NAME | RECETARIO..."
 */
const METHOD_SLUG_MAP: Record<string, string> = {
  v60: 'v60',
  'hario switch': 'switch',
  'origami dripper': 'origami',
  'kalita wave': 'kalitawave',
  chemex: 'chemex',
  aeropress: 'aeropress',
};

/**
 * Extracts the method slug from a markdown file's first heading.
 * @example "# 01 - V60 | RECETARIO..." → "v60"
 */
export function parseMethodSlug(fileContent: string): string {
  const match = fileContent.match(/^#\s+\d+\s*-\s*(.+?)\s*\|/i);
  if (!match) return '';

  const rawName = match[1].toLowerCase().trim();
  // Try exact match first
  if (METHOD_SLUG_MAP[rawName]) return METHOD_SLUG_MAP[rawName];

  // Fallback: try to match by included key
  for (const [key, slug] of Object.entries(METHOD_SLUG_MAP)) {
    if (rawName.includes(key)) return slug;
  }

  return rawName.replace(/\s+/g, '');
}

// ─── Parameter Table Parsing ─────────────────────────────────────────────────

/**
 * Maps Spanish table row labels to our parameter keys.
 */
const PARAM_MAP: Record<string, string> = {
  café: 'coffeeDose',
  agua: 'waterDose',
  'agua total': 'waterDose',
  ratio: 'ratio',
  temperatura: 'temperature',
  molienda: 'grindSize',
  'tiempo total': 'totalTime',
  tiempo: 'totalTime',
};

/**
 * Extracts the first number from a string, handling ranges like "15–18 g".
 */
function extractFirstNum(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Parses a parameter table section within a recipe block.
 * Returns a map of parameter key → raw value string.
 */
function parseParamTable(section: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Match table rows: | Key | Value |
  const rowRegex = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let match: RegExpExecArray | null;

  while ((match = rowRegex.exec(section)) !== null) {
    const key = match[1].toLowerCase().trim();
    const value = match[2].trim();

    // Find which parameter this maps to
    for (const [spanishKey, paramName] of Object.entries(PARAM_MAP)) {
      if (key === spanishKey || key.startsWith(spanishKey)) {
        params[paramName] = value;
        break;
      }
    }
  }

  return params;
}

// ─── Step Parsing ────────────────────────────────────────────────────────────

/**
 * Sections under ### that are NOT Objetivo/Parámetros/Perfil are step phases.
 * We capture the heading name as the first line of the instruction and collect
 * all bullet points underneath as part of the instruction.
 */
function parseSteps(recipeBlock: string): ParsedStep[] {
  const steps: ParsedStep[] = [];
  const stepSectionRegex = /###\s+(.+?)\s*\n([\s\S]*?)(?=\n###|\n---|$)/g;
  let stepOrder = 0;
  let match: RegExpExecArray | null;

  while ((match = stepSectionRegex.exec(recipeBlock)) !== null) {
    const heading = match[1].trim();
    const content = match[2].trim();

    // Skip non-step sections
    const lowerHeading = heading.toLowerCase();
    if (
      lowerHeading === 'objetivo' ||
      lowerHeading.startsWith('parámetro') ||
      lowerHeading.startsWith('parametro') ||
      lowerHeading === 'perfil' ||
      lowerHeading === 'preparación' ||
      lowerHeading === 'preparacion'
    ) {
      continue;
    }

    stepOrder++;

    // Build instruction: heading name + bullet points
    const lines: string[] = [heading];
    const bulletRegex = /^[-*]\s*(.+)$/gm;
    let bulletMatch: RegExpExecArray | null;
    while ((bulletMatch = bulletRegex.exec(content)) !== null) {
      lines.push(`• ${bulletMatch[1].trim()}`);
    }

    // Also include non-bullet instruction lines (like Preparation text)
    const nonBulletLines = content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('-') && !l.startsWith('*'));
    for (const line of nonBulletLines) {
      // Avoid duplicating header or adding very short lines
      if (!lines.includes(line) && line !== heading && line.length > 3) {
        // Check if it's a table row
        if (!line.startsWith('|')) {
          lines.push(line);
        }
      }
    }

    const instruction = lines.join('\n');

    // Try to extract waterAtStep from first bullet
    const waterMatch = content.match(/(\d+)\s*g/i);
    const waterAtStep = waterMatch ? parseInt(waterMatch[1], 10) : undefined;

    steps.push({
      stepOrder,
      instruction,
      waterAtStep,
    });
  }

  return steps;
}

// ─── Main Parsing Function ───────────────────────────────────────────────────

/**
 * Splits markdown content into individual recipe blocks by ## N. heading,
 * then parses each block for objective, parameters, profile, and steps.
 */
export function parseRecipesFromMarkdown(
  fileContent: string,
  method: string,
): ParsedRecipe[] {
  // Split by "## " (level-2 headings) that start with a number
  // Include the heading line in each block so the name can be extracted
  const headingRegex = /^##\s+(\d+)\.\s+(.+)$/gm;
  const headingMatches: Array<{ name: string; index: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = headingRegex.exec(fileContent)) !== null) {
    headingMatches.push({ name: m[2].trim(), index: m.index });
  }

  // Build sections: from each heading to the next heading
  const sections: Array<{ name: string; content: string }> = [];

  for (let i = 0; i < headingMatches.length; i++) {
    const start = headingMatches[i].index;
    const end =
      i + 1 < headingMatches.length
        ? headingMatches[i + 1].index
        : fileContent.length;
    const content = fileContent.slice(start, end).trim();

    // Skip "FIN DEL MÉTODO" and "Otras recetas" sections
    const lowerName = headingMatches[i].name.toLowerCase();
    if (lowerName.startsWith('fin ') || lowerName.startsWith('otra')) continue;

    sections.push({ name: headingMatches[i].name, content });
  }

  // Parse each section into a recipe
  const recipes: ParsedRecipe[] = [];

  for (const section of sections) {
    const block = section.content;

    // ── Extract sub-sections (### headings) ──────────────────────────────
    const subSections: Record<string, string> = {};
    const subRegex = /^###\s+(.+?)\s*$/gm;
    subRegex.lastIndex = 0;
    const subMatches: Array<{ name: string; start: number }> = [];
    let subM: RegExpExecArray | null;
    while ((subM = subRegex.exec(block)) !== null) {
      subMatches.push({ name: subM[1].trim().toLowerCase(), start: subRegex.lastIndex });
    }

    for (let i = 0; i < subMatches.length; i++) {
      const start = subMatches[i].start;
      const end = i + 1 < subMatches.length ? subMatches[i + 1].start : block.length;
      subSections[subMatches[i].name] = block.slice(start, end).trim();
    }

    // ── Extract name ────────────────────────────────────────────────────
    const name = section.name;

    // ── Extract objective ───────────────────────────────────────────────
    let objective = '';
    for (const [key, val] of Object.entries(subSections)) {
      if (key === 'objetivo') {
        objective = val.split('\n')[0].trim();
        break;
      }
    }

    // ── Extract preparation ─────────────────────────────────────────────
    let preparation = '';
    for (const [key, val] of Object.entries(subSections)) {
      if (key === 'preparación' || key === 'preparacion') {
        preparation = val.trim();
        break;
      }
    }

    // ── Extract parameters ──────────────────────────────────────────────
    let paramsSection = '';
    for (const [key, val] of Object.entries(subSections)) {
      if (key.startsWith('parámetro') || key.startsWith('parametro')) {
        paramsSection = val;
        break;
      }
    }

    const params = parseParamTable(paramsSection);

    // ── Extract profile ─────────────────────────────────────────────────
    let profile = '';
    for (const [key, val] of Object.entries(subSections)) {
      if (key === 'perfil') {
        profile = val.split('\n')[0].trim();
        break;
      }
    }

    // ── Parse steps ─────────────────────────────────────────────────────
    const steps = parseSteps(block);

    recipes.push({
      name,
      objective,
      preparation,
      coffeeDose: params.coffeeDose ? extractFirstNum(params.coffeeDose) : 0,
      waterDose: params.waterDose ? extractFirstNum(params.waterDose) : 0,
      ratio: params.ratio ?? '',
      temperature: params.temperature ?? '',
      grindSize: params.grindSize ?? '',
      totalTime: params.totalTime ?? '',
      profile,
      steps,
    });
  }

  return recipes;
}
