import { getDb } from '../db/client';
import type { JournalEntry } from '@/domain/models';

export function listJournalEntries(): JournalEntry[] {
  const db = getDb();
  return db.getAllSync<JournalEntry>(
    `SELECT date, content, mood, updated_at as updatedAt FROM journal_entries ORDER BY date DESC;`
  );
}

export function getJournalEntry(date: string): JournalEntry | null {
  const db = getDb();
  return db.getFirstSync<JournalEntry>(
    `SELECT date, content, mood, updated_at as updatedAt FROM journal_entries WHERE date = ?;`,
    [date]
  );
}

export function upsertJournalEntry(
  date: string,
  content: string,
  mood: number | null
): JournalEntry {
  const db = getDb();
  const now = Date.now();
  db.runSync(
    `INSERT INTO journal_entries (date, content, mood, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET content = excluded.content, mood = excluded.mood, updated_at = excluded.updated_at;`,
    [date, content, mood, now]
  );
  return { date, content, mood, updatedAt: now };
}
