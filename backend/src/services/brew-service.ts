import { eq, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { brewSessions } from '../db/schema';
import type { BrewSession, BrewSessionDetail } from '../types';

export const brewService = {
  async list(): Promise<BrewSession[]> {
    return db
      .select()
      .from(brewSessions)
      .orderBy(desc(brewSessions.createdAt));
  },

  async getById(id: number): Promise<BrewSessionDetail | null> {
    const result = await db.query.brewSessions.findFirst({
      where: eq(brewSessions.id, id),
      with: {
        coffeeBean: true,
        tastingNotes: {
          orderBy: (notes, { asc }) => [asc(notes.createdAt)],
        },
      },
    });

    return result ?? null;
  },

  async create(
    data: typeof brewSessions.$inferInsert
  ): Promise<BrewSession> {
    const [brew] = await db
      .insert(brewSessions)
      .values(data)
      .returning();
    return brew;
  },

  async update(
    id: number,
    data: Partial<typeof brewSessions.$inferInsert>
  ): Promise<BrewSession | null> {
    const existing = await db
      .select()
      .from(brewSessions)
      .where(eq(brewSessions.id, id))
      .limit(1);

    if (existing.length === 0) return null;

    const [updated] = await db
      .update(brewSessions)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(brewSessions.id, id))
      .returning();

    return updated;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(brewSessions)
      .where(eq(brewSessions.id, id))
      .returning({ id: brewSessions.id });

    return result.length > 0;
  },
};
