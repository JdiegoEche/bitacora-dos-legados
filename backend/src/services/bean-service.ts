import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { coffeeBeans, brewSessions } from '../db/schema';
import type { CoffeeBean } from '../types';

export const beanService = {
  async list(): Promise<CoffeeBean[]> {
    return db
      .select()
      .from(coffeeBeans)
      .orderBy(asc(coffeeBeans.name));
  },

  async getById(id: number): Promise<CoffeeBean | null> {
    const [bean] = await db
      .select()
      .from(coffeeBeans)
      .where(eq(coffeeBeans.id, id))
      .limit(1);

    return bean ?? null;
  },

  async create(
    data: typeof coffeeBeans.$inferInsert
  ): Promise<CoffeeBean> {
    const [bean] = await db
      .insert(coffeeBeans)
      .values(data)
      .returning();
    return bean;
  },

  async update(
    id: number,
    data: Partial<typeof coffeeBeans.$inferInsert>
  ): Promise<CoffeeBean | null> {
    const existing = await db
      .select()
      .from(coffeeBeans)
      .where(eq(coffeeBeans.id, id))
      .limit(1);

    if (existing.length === 0) return null;

    const [updated] = await db
      .update(coffeeBeans)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(coffeeBeans.id, id))
      .returning();

    return updated;
  },

  async delete(id: number): Promise<boolean> {
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
