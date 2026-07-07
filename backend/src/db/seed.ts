import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { db } from './connection';
import { users, coffeeBeans, brewSessions, tastingNotes, recipes } from './schema';
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
  await db.delete(recipes);

  for (const file of files) {
    const content = readFileSync(resolve(FILTER_COFFEE_DIR, file), 'utf-8');
    const method = parseMethodSlug(content);
    if (!method) continue;

    const parsed = parseRecipesFromMarkdown(content, method);

    for (const recipe of parsed) {
      await db.insert(recipes).values({
        method,
        name: recipe.name,
        objective: recipe.objective || null,
        preparation: recipe.preparation || '',
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
      });
      total++;
    }
  }

  return total;
}

// ─── Main Seed (CLI) ─────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database…');

  // Create or get default user (idempotent)
  const [defaultUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'dev@bitacora.dev'))
    .limit(1);

  if (!defaultUser) {
    await db.insert(users).values({ email: 'dev@bitacora.dev' });
    console.log('   - 1 user created (dev@bitacora.dev)');
  } else {
    console.log('   - 1 user already exists (dev@bitacora.dev)');
  }

  // Clean slate: remove all user-facing data, keep only recipes
  await db.delete(tastingNotes);
  await db.delete(brewSessions);
  await db.delete(coffeeBeans);

  // Seed recipes from markdown files
  const recipeCount = await seedRecipes();

  console.log('✅ Seed complete:');
  console.log('   - 1 default user (dev@bitacora.dev)');
  console.log('   - 0 coffee beans (empty — ready for your beans)');
  console.log('   - 0 brew sessions (empty — ready for your brews)');
  console.log('   - 0 tasting notes');
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
