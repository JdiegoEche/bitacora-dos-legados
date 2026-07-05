import { db } from '../db/connection';
import { tastingNotes, brewSessions } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface WordFreq {
  word: string;
  count: number;
}

export interface TastingWordsResponse {
  aroma: WordFreq[];
  flavor: WordFreq[];
  body: WordFreq[];
  acidity: WordFreq[];
}

export interface MethodPopItem {
  method: string;
  count: number;
  avgRating: number | null;
}

// ─── Stopwords ──────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the',
  'and',
  'a',
  'with',
  'very',
  'notes',
  'like',
  'slight',
  'of',
  'in',
  'on',
  'it',
  'is',
  'was',
  'has',
  'have',
  'some',
  'but',
  'not',
  'too',
  'also',
  'more',
  'than',
  'an',
]);

// ─── Pure Functions ─────────────────────────────────────────────────────────

export function parseWords(text: string | null): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .trim()
    .split(/[,\s&]+| and /)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));
}

export function topWords(words: string[], limit = 5): WordFreq[] {
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

// ─── Category helper ────────────────────────────────────────────────────────

function processCategory(
  notes: { aroma: string | null; flavor: string | null; body: string | null; acidity: string | null }[],
  field: 'aroma' | 'flavor' | 'body' | 'acidity',
): WordFreq[] {
  const allWords: string[] = [];
  for (const note of notes) {
    const parsed = parseWords(note[field]);
    allWords.push(...parsed);
  }
  return topWords(allWords);
}

// ─── Service Functions ──────────────────────────────────────────────────────

export async function getTastingWords(
  userId: number,
): Promise<TastingWordsResponse> {
  const notes = await db
    .select({
      aroma: tastingNotes.aroma,
      flavor: tastingNotes.flavor,
      body: tastingNotes.body,
      acidity: tastingNotes.acidity,
    })
    .from(tastingNotes)
    .where(eq(tastingNotes.userId, userId));

  return {
    aroma: processCategory(notes, 'aroma'),
    flavor: processCategory(notes, 'flavor'),
    body: processCategory(notes, 'body'),
    acidity: processCategory(notes, 'acidity'),
  };
}

export async function getMethodPopularity(
  userId: number,
): Promise<MethodPopItem[]> {
  const rows = await db
    .select({
      method: brewSessions.method,
      count: sql<number>`COUNT(DISTINCT ${brewSessions.id})`.as('count'),
      avgRating: sql<number | null>`AVG(${tastingNotes.rating})`.as('avg_rating'),
    })
    .from(brewSessions)
    .leftJoin(
      tastingNotes,
      eq(brewSessions.id, tastingNotes.brewSessionId),
    )
    .where(eq(brewSessions.userId, userId))
    .groupBy(brewSessions.method)
    .orderBy(sql`count DESC`);

  return rows.map((row) => ({
    method: row.method,
    count: Number(row.count),
    avgRating: row.avgRating !== null ? Number(row.avgRating.toFixed(1)) : null,
  }));
}
