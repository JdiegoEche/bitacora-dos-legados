import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { brewSessions } from '../db/schema';
import type { BrewSession, BrewSessionDetail } from '../types';

export const brewService = {
  async list(userId: number): Promise<BrewSession[]> {
    return db
      .select()
      .from(brewSessions)
      .where(eq(brewSessions.userId, userId))
      .orderBy(desc(brewSessions.createdAt));
  },

  async getById(id: number, userId: number): Promise<BrewSessionDetail | null> {
    const result = await db.query.brewSessions.findFirst({
      where: and(eq(brewSessions.id, id), eq(brewSessions.userId, userId)),
      with: {
        coffeeBean: true,
        tastingNotes: {
          orderBy: (notes, { asc }) => [asc(notes.createdAt)],
        },
      },
    });

    return result ?? null;
  },

  async toggleShare(
    id: number,
    userId: number,
    isPublic: boolean,
  ): Promise<{ isPublic: boolean; shareToken: string | null } | null> {
    // Generate a new token each time sharing is enabled (token rotation).
    // This revokes any previous public link — intentional security property.
    const shareToken = isPublic ? crypto.randomUUID() : null;

    const [updated] = await db
      .update(brewSessions)
      .set({
        isPublic,
        shareToken,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(brewSessions.id, id), eq(brewSessions.userId, userId)))
      .returning();

    if (!updated) return null;

    return {
      isPublic: updated.isPublic,
      shareToken: updated.shareToken ?? null,
    };
  },

  async getByShareToken(
    shareToken: string,
  ): Promise<BrewSessionDetail | null> {
    const result = await db.query.brewSessions.findFirst({
      where: and(
        eq(brewSessions.shareToken, shareToken),
        eq(brewSessions.isPublic, true),
      ),
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
    data: Omit<typeof brewSessions.$inferInsert, 'userId'>,
    userId: number,
  ): Promise<BrewSession> {
    const [brew] = await db
      .insert(brewSessions)
      .values({ ...data, userId })
      .returning();
    return brew;
  },

  async update(
    id: number,
    data: Partial<typeof brewSessions.$inferInsert>,
    userId: number,
  ): Promise<BrewSession | null> {
    const [existing] = await db
      .select()
      .from(brewSessions)
      .where(and(eq(brewSessions.id, id), eq(brewSessions.userId, userId)))
      .limit(1);

    if (!existing) return null;

    const [updated] = await db
      .update(brewSessions)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(brewSessions.id, id))
      .returning();

    return updated;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(brewSessions)
      .where(and(eq(brewSessions.id, id), eq(brewSessions.userId, userId)))
      .returning({ id: brewSessions.id });

    return result.length > 0;
  },
};
