import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { brewSessions, tastingNotes } from '../db/schema.js';
import type { TastingNote } from '../types/index.js';

type CreateNoteInput = Omit<typeof tastingNotes.$inferInsert, 'brewSessionId' | 'userId'>;

export const noteService = {
  async listByBrew(brewId: number, userId: number): Promise<TastingNote[]> {
    // Verify brew belongs to user first
    const brew = await db
      .select({ id: brewSessions.id })
      .from(brewSessions)
      .where(and(eq(brewSessions.id, brewId), eq(brewSessions.userId, userId)))
      .limit(1);

    if (!brew.length) return [];

    return db
      .select()
      .from(tastingNotes)
      .where(eq(tastingNotes.brewSessionId, brewId))
      .orderBy(asc(tastingNotes.createdAt));
  },

  async create(
    brewId: number,
    data: CreateNoteInput,
    userId: number,
  ): Promise<TastingNote | 'not_found' | 'conflict'> {
    // Verify brew belongs to user
    const brew = await db
      .select({ id: brewSessions.id })
      .from(brewSessions)
      .where(and(eq(brewSessions.id, brewId), eq(brewSessions.userId, userId)))
      .limit(1);

    if (!brew.length) return 'not_found';

    // A brew session gets at most one tasting note
    const existing = await db
      .select({ id: tastingNotes.id })
      .from(tastingNotes)
      .where(eq(tastingNotes.brewSessionId, brewId))
      .limit(1);

    if (existing.length) return 'conflict';

    const [note] = await db
      .insert(tastingNotes)
      .values({ ...data, brewSessionId: brewId, userId })
      .returning();
    return note;
  },

  async update(
    id: number,
    data: Partial<CreateNoteInput>,
    userId: number,
  ): Promise<TastingNote | null> {
    // First find the note, then verify its parent brew belongs to the user
    const [note] = await db
      .select()
      .from(tastingNotes)
      .where(eq(tastingNotes.id, id))
      .limit(1);

    if (!note) return null;

    // Verify the parent brew belongs to the user
    const brew = await db
      .select({ id: brewSessions.id })
      .from(brewSessions)
      .where(
        and(eq(brewSessions.id, note.brewSessionId), eq(brewSessions.userId, userId)),
      )
      .limit(1);

    if (!brew.length) return null;

    const [updated] = await db
      .update(tastingNotes)
      .set({ ...data })
      .where(eq(tastingNotes.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: number, userId: number): Promise<boolean> {
    // First find the note, then verify its parent brew belongs to the user
    const [note] = await db
      .select()
      .from(tastingNotes)
      .where(eq(tastingNotes.id, id))
      .limit(1);

    if (!note) return false;

    // Verify the parent brew belongs to the user
    const brew = await db
      .select({ id: brewSessions.id })
      .from(brewSessions)
      .where(
        and(eq(brewSessions.id, note.brewSessionId), eq(brewSessions.userId, userId)),
      )
      .limit(1);

    if (!brew.length) return false;

    const result = await db
      .delete(tastingNotes)
      .where(eq(tastingNotes.id, id))
      .returning({ id: tastingNotes.id });

    return result.length > 0;
  },

  async brewBelongsToUser(brewId: number, userId: number): Promise<boolean> {
    const [brew] = await db
      .select({ id: brewSessions.id })
      .from(brewSessions)
      .where(and(eq(brewSessions.id, brewId), eq(brewSessions.userId, userId)))
      .limit(1);

    return !!brew;
  },
};
