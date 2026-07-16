import { eq, asc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { recipes } from '../db/schema.js';
import type { Recipe, RecipeDetail, RecipeStep } from '../types/index.js';

export const recipeService = {
  async list(method?: string): Promise<Recipe[]> {
    const query = db
      .select()
      .from(recipes)
      .orderBy(asc(recipes.name));

    if (method) {
      query.where(eq(recipes.method, method));
    }

    return query;
  },

  async getById(id: number): Promise<RecipeDetail | null> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (!recipe) return null;

    return {
      ...recipe,
      steps: parseSteps(recipe.steps),
    };
  },
};

function parseSteps(stepsJson: string): RecipeStep[] {
  try {
    return JSON.parse(stepsJson) as RecipeStep[];
  } catch {
    return [];
  }
}
