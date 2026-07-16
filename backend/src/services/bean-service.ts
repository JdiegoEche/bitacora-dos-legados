import { eq, and, asc, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../db/connection';
import { coffeeBeans, brewSessions, tastingNotes } from '../db/schema';
import type { CoffeeBean, CoffeeBeanWithStats, BrewSessionWithNotes, TastingNote } from '../types';

export const beanService = {
  async list(userId: number): Promise<CoffeeBean[]> {
    return db
      .select()
      .from(coffeeBeans)
      .where(eq(coffeeBeans.userId, userId))
      .orderBy(asc(coffeeBeans.name));
  },

  async getById(id: number, userId: number): Promise<CoffeeBean | null> {
    const [bean] = await db
      .select()
      .from(coffeeBeans)
      .where(and(eq(coffeeBeans.id, id), eq(coffeeBeans.userId, userId)))
      .limit(1);

    return bean ?? null;
  },

  async create(
    data: Omit<typeof coffeeBeans.$inferInsert, 'userId'>,
    userId: number,
  ): Promise<CoffeeBean> {
    const [bean] = await db
      .insert(coffeeBeans)
      .values({ ...data, userId })
      .returning();
    return bean;
  },

  async update(
    id: number,
    data: Partial<typeof coffeeBeans.$inferInsert>,
    userId: number,
  ): Promise<CoffeeBean | null> {
    const [existing] = await db
      .select()
      .from(coffeeBeans)
      .where(and(eq(coffeeBeans.id, id), eq(coffeeBeans.userId, userId)))
      .limit(1);

    if (!existing) return null;

    const [updated] = await db
      .update(coffeeBeans)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(coffeeBeans.id, id))
      .returning();

    return updated;
  },

  async getByIdWithStats(id: number, userId: number): Promise<CoffeeBeanWithStats | null> {
    const bean = await this.getById(id, userId);
    if (!bean) return null;

    // Aggregate stats — avgRating from tastingNotes.rating (numeric INT),
    // NOT brewSessions.rating (TEXT ratio like "1:15")
    const [aggregate] = await db
      .select({
        avgRating: sql<number | null>`CAST(AVG(${tastingNotes.rating}) AS REAL)`,
        brewCount: sql<number>`COUNT(DISTINCT ${brewSessions.id})`,
      })
      .from(brewSessions)
      .leftJoin(tastingNotes, eq(tastingNotes.brewSessionId, brewSessions.id))
      .where(
        and(eq(brewSessions.coffeeBeanId, id), eq(brewSessions.userId, userId)),
      );

    // Method breakdown (GROUP BY method, scoped to user)
    const methodRows = await db
      .select({
        method: brewSessions.method,
        count: sql<number>`COUNT(*)`,
      })
      .from(brewSessions)
      .where(
        and(eq(brewSessions.coffeeBeanId, id), eq(brewSessions.userId, userId)),
      )
      .groupBy(brewSessions.method);

    const methodBreakdown: Record<string, number> = {};
    for (const row of methodRows) {
      methodBreakdown[row.method] = row.count;
    }

    return {
      ...bean,
      avgRating: aggregate?.avgRating ?? null,
      brewCount: aggregate?.brewCount ?? 0,
      methodBreakdown,
    };
  },

  async getBrewsByBeanId(id: number, userId: number): Promise<BrewSessionWithNotes[]> {
    const brews = await db
      .select()
      .from(brewSessions)
      .where(
        and(eq(brewSessions.coffeeBeanId, id), eq(brewSessions.userId, userId)),
      )
      .orderBy(desc(brewSessions.createdAt));

    if (brews.length === 0) return [];

    // Batch-fetch tasting notes for all brews
    const brewIds = brews.map((b) => b.id);
    const allNotes = await db
      .select()
      .from(tastingNotes)
      .where(inArray(tastingNotes.brewSessionId, brewIds));

    const notesByBrew = new Map<number, TastingNote[]>();
    for (const note of allNotes) {
      const arr = notesByBrew.get(note.brewSessionId) ?? [];
      arr.push(note);
      notesByBrew.set(note.brewSessionId, arr);
    }

    function buildNotesSummary(notes: TastingNote[]): string | null {
      if (notes.length === 0) return null;

      const parts: string[] = [];
      for (const n of notes) {
        if (n.aroma) parts.push(`aroma: ${n.aroma}`);
        if (n.flavor) parts.push(`flavor: ${n.flavor}`);
        if (n.body) parts.push(`body: ${n.body}`);
        if (n.acidity) parts.push(`acidity: ${n.acidity}`);
        if (n.freeText) parts.push(`free_text: ${n.freeText}`);
      }

      return parts.length > 0 ? parts.join(', ') : null;
    }

    return brews.map((brew) => {
      const brewNotes = notesByBrew.get(brew.id) ?? [];
      return {
        ...brew,
        tastingNotesSummary: buildNotesSummary(brewNotes),
      };
    });
  },

  async delete(id: number, userId: number): Promise<boolean> {
    // Verify ownership first
    const [existing] = await db
      .select()
      .from(coffeeBeans)
      .where(and(eq(coffeeBeans.id, id), eq(coffeeBeans.userId, userId)))
      .limit(1);

    if (!existing) return false;

    // SET NULL on all brew sessions referencing this bean
    await db
      .update(brewSessions)
      .set({ coffeeBeanId: null })
      .where(eq(brewSessions.coffeeBeanId, id));

    // Delete the bean itself
    const result = await db
      .delete(coffeeBeans)
      .where(eq(coffeeBeans.id, id))
      .returning({ id: coffeeBeans.id });

    return result.length > 0;
  },
};
