import { eq, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { brewSessions, tastingNotes } from '../db/schema';
import type { TastingNote } from '../types';

type CreateNoteInput = Omit<typeof tastingNotes.$inferInsert, 'brewSessionId'>;

export const noteService = {
  async listByBrew(brewId: number): Promise<TastingNote[]> {
    return db
      .select()
      .from(tastingNotes)
      .where(eq(tastingNotes.brewSessionId, brewId))
      .orderBy(asc(tastingNotes.createdAt));
  },

  async create(
    brewId: number,
    data: CreateNoteInput
  ): Promise<TastingNote> {
    const [note] = await db
      .insert(tastingNotes)
      .values({ ...data, brewSessionId: brewId })
      .returning();
    return note;
  },

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(tastingNotes)
      .where(eq(tastingNotes.id, id))
      .returning({ id: tastingNotes.id });

    return result.length > 0;
  },

  async brewExists(brewId: number): Promise<boolean> {
    const [brew] = await db
      .select({ id: brewSessions.id })
      .from(brewSessions)
      .where(eq(brewSessions.id, brewId))
      .limit(1);

    return !!brew;
  },
};
