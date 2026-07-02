import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection';
import { coffeeBeans, brewSessions, tastingNotes, recipes } from './schema';
import { parseMethodSlug, parseRecipesFromMarkdown } from '../lib/recipe-parser';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FILTER_COFFEE_DIR = resolve(__dirname, '../../../filter-coffeMD');

// ─── Recipe Seeding (idempotent) ─────────────────────────────────────────────

/**
 * Seeds the recipes table by parsing all filter-coffeMD/*.md files.
 * Idempotent: truncates the recipes table before re-inserting.
 */
export async function seedRecipes(): Promise<number> {
  const files = readdirSync(FILTER_COFFEE_DIR).filter((f) => f.endsWith('.md'));
  let total = 0;

  // Truncate existing recipes
  db.delete(recipes).run();

  for (const file of files) {
    const content = readFileSync(resolve(FILTER_COFFEE_DIR, file), 'utf-8');
    const method = parseMethodSlug(content);
    if (!method) continue;

    const parsed = parseRecipesFromMarkdown(content, method);

    for (const recipe of parsed) {
      db.insert(recipes).values({
        method,
        name: recipe.name,
        objective: recipe.objective || null,
        coffeeDose: recipe.coffeeDose,
        waterDose: recipe.waterDose,
        ratio: recipe.ratio,
        temperature: recipe.temperature,
        grindSize: recipe.grindSize,
        totalTime: recipe.totalTime,
        profile: recipe.profile,
        steps: JSON.stringify(
          recipe.steps.map((s) => ({
            stepOrder: s.stepOrder,
            instruction: s.instruction,
            ...(s.waterAtStep ? { waterAtStep: s.waterAtStep } : {}),
          })),
        ),
      }).run();
      total++;
    }
  }

  return total;
}

// ─── Main Seed (CLI) ─────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database…');

  // Insert sample coffee beans
  const beans = await db
    .insert(coffeeBeans)
    .values([
      {
        name: 'Ethiopia Yirgacheffe',
        roaster: 'Counter Culture',
        origin: 'Ethiopia',
        roastLevel: 'light',
      },
      {
        name: 'Colombia La Esperanza',
        roaster: 'Intelligentsia',
        origin: 'Colombia',
        roastLevel: 'medium',
      },
      {
        name: 'House Blend',
        roaster: 'Stumptown',
        origin: null,
        roastLevel: 'medium-dark',
      },
    ])
    .returning();

  const [ethiopia, colombia, houseBlend] = beans;

  // Insert sample brew sessions
  const brews = await db
    .insert(brewSessions)
    .values([
      {
        coffeeBeanId: ethiopia.id,
        grindSize: 'medium-fine',
        waterTemp: 93,
        brewTime: 150,
        method: 'V60',
        grinder: 'Comandante C40',
        clicks: '22',
        coffeeDose: 15,
        waterDose: 250,
        notes: 'Bright and clean, floral notes came through nicely.',
        rating: 4,
      },
      {
        coffeeBeanId: colombia.id,
        grindSize: 'medium',
        waterTemp: 88,
        brewTime: 120,
        method: 'Aeropress',
        grinder: 'Eureka Mignon',
        clicks: '3',
        coffeeDose: 14,
        waterDose: 200,
        notes: 'Smooth body, good for a quick morning brew.',
        rating: 5,
      },
      {
        coffeeBeanId: houseBlend.id,
        grindSize: 'coarse',
        waterTemp: 96,
        brewTime: 240,
        method: 'French Press',
        grinder: null,
        clicks: null,
        coffeeDose: 30,
        waterDose: 500,
        notes: 'Full-bodied and rich. Classic comfort brew.',
        rating: 3,
      },
    ])
    .returning();

  const [v60, aeropress, frenchPress] = brews;

  // Insert sample tasting notes for the V60 brew
  await db.insert(tastingNotes).values([
    {
      brewSessionId: v60.id,
      aroma: 'Floral with hints of jasmine',
      flavor: 'Blueberry and dark chocolate',
      body: 'Medium, tea-like',
      acidity: 'Bright, citric',
      rating: 4,
      freeText: 'Excellent light roast — very aromatic.',
    },
    {
      brewSessionId: v60.id,
      aroma: 'Sweet, honey-like',
      flavor: 'Stone fruit',
      body: 'Light',
      acidity: 'Mild',
      rating: 3,
      freeText: 'Lost some brightness as it cooled.',
    },
  ]);

  // Insert a tasting note for the Aeropress brew
  await db.insert(tastingNotes).values([
    {
      brewSessionId: aeropress.id,
      aroma: 'Nutty and caramel',
      flavor: 'Toffee with a hint of apple',
      body: 'Smooth, medium-full',
      acidity: 'Low',
      rating: 5,
      freeText: 'Perfect everyday Aeropress recipe.',
    },
  ]);

  // Seed recipes from markdown files
  const recipeCount = await seedRecipes();

  console.log('✅ Seed complete:');
  console.log(`   - ${beans.length} coffee beans`);
  console.log(`   - ${brews.length} brew sessions`);
  console.log('   - 3 tasting notes');
  console.log(`   - ${recipeCount} recipes`);

  process.exit(0);
}

// Only run as CLI when this file is executed directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
