import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import type { User } from '../types/index.js';

export const authService = {
  /**
   * Upsert a user by email — returns existing user if found, creates a new one otherwise.
   */
  async upsertUser(email: string): Promise<User> {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) return existing;

    const [user] = await db
      .insert(users)
      .values({ email })
      .returning();

    return user;
  },

  /**
   * Get a user by their ID.
   */
  async getUser(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  },

  /**
   * Get a user by their email.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  },
};
