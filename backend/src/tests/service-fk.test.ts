import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { createTestDb, destroyTestDb } from '../db/test-helper';
import type { TestDb } from '../db/test-helper';
import * as schema from '../db/schema';
import { eq, isNull, inArray } from 'drizzle-orm';

// ─── Mock DB connection ──────────────────────────────────────────────────────

let testDb: TestDb;

vi.mock('../db/connection', () => ({
  get db() { return testDb; },
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

let testUserId: number;

beforeAll(async () => {
  testDb = await createTestDb();

  // Create a test user
  const [user] = await testDb.insert(schema.users).values({
    email: 'fk-test@test.com',
  }).returning();
  testUserId = user.id;
});

afterAll(() => {
  destroyTestDb();
});

// ─── FK Tests — Bean Delete (SET NULL) ──────────────────────────────────────

describe('Bean delete — SET NULL on brew_sessions', () => {
  it('sets coffee_bean_id to NULL on referenced brews when bean is deleted', async () => {
    const { beanService } = await import('../services/bean-service');

    // Create a bean
    const bean = await beanService.create({
      name: 'Test Bean FK',
      roaster: 'Test Roaster FK',
    }, testUserId);
    expect(bean.id).toBeGreaterThan(0);

    // Create a brew referencing the bean
    await testDb.insert(schema.brewSessions).values({
      coffeeBeanId: bean.id,
      userId: testUserId,
      method: 'V60',
      grindSize: 'medium',
      waterTemp: 93,
      brewTime: '150',
      coffeeDose: 15,
      waterDose: 250,
    });

    // Create a second brew referencing the same bean
    await testDb.insert(schema.brewSessions).values({
      coffeeBeanId: bean.id,
      userId: testUserId,
      method: 'Aeropress',
      grindSize: 'fine',
      waterTemp: 88,
      brewTime: '120',
      coffeeDose: 14,
      waterDose: 200,
    });

    // Verify both brews reference the bean
    const brewsBefore = await testDb
      .select()
      .from(schema.brewSessions)
      .where(eq(schema.brewSessions.coffeeBeanId, bean.id));
    expect(brewsBefore).toHaveLength(2);

    // Delete the bean
    const deleted = await beanService.delete(bean.id, testUserId);
    expect(deleted).toBe(true);

    // Verify the brews still exist but have NULL coffee_bean_id
    const brewsAfter = await testDb
      .select()
      .from(schema.brewSessions)
      .where(isNull(schema.brewSessions.coffeeBeanId));
    expect(brewsAfter).toHaveLength(2);
  });

  it('deletes unreferenced bean without affecting any brews', async () => {
    const { beanService } = await import('../services/bean-service');

    const bean = await beanService.create({
      name: 'Solo Bean',
      roaster: 'Solo Roaster',
    }, testUserId);

    const totalBrewsBefore = await testDb
      .select()
      .from(schema.brewSessions);

    const deleted = await beanService.delete(bean.id, testUserId);
    expect(deleted).toBe(true);

    // Total brews should be unchanged (no SET NULL needed)
    const totalBrewsAfter = await testDb
      .select()
      .from(schema.brewSessions);

    expect(totalBrewsAfter).toHaveLength(totalBrewsBefore.length);
  });
});

// ─── FK Tests — Brew Delete (CASCADE on notes) ──────────────────────────────

describe('Brew delete — CASCADE on tasting_notes', () => {
  it('cascades deletion to all linked tasting notes', async () => {
    // Create a brew
    const [brew] = await testDb
      .insert(schema.brewSessions)
      .values({ method: 'Pour Over', grindSize: 'medium', userId: testUserId })
      .returning();

    // Add 3 tasting notes to that brew
    for (let i = 1; i <= 3; i++) {
      await testDb.insert(schema.tastingNotes).values({
        brewSessionId: brew.id,
        userId: testUserId,
        aroma: `aroma-${i}`,
      });
    }

    // Verify notes exist
    const notesBefore = await testDb
      .select()
      .from(schema.tastingNotes)
      .where(eq(schema.tastingNotes.brewSessionId, brew.id));
    expect(notesBefore).toHaveLength(3);

    // Delete the brew
    const { brewService } = await import('../services/brew-service');
    const deleted = await brewService.delete(brew.id, testUserId);
    expect(deleted).toBe(true);

    // Verify notes are cascade-deleted
    const notesAfter = await testDb
      .select()
      .from(schema.tastingNotes)
      .where(eq(schema.tastingNotes.brewSessionId, brew.id));
    expect(notesAfter).toHaveLength(0);
  });
});
