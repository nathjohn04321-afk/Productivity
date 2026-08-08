import { getDb } from '../db/client';
import { generateId } from '@/utils/id';
import type { Tag } from '@/domain/models';

export function listTags(): Tag[] {
  const db = getDb();
  return db.getAllSync<Tag>(`SELECT id, name, color FROM tags ORDER BY name ASC;`);
}

export function createTag(name: string, color: string): Tag {
  const db = getDb();
  const id = generateId();
  db.runSync(`INSERT INTO tags (id, name, color) VALUES (?, ?, ?);`, [
    id,
    name.trim(),
    color,
  ]);
  return { id, name: name.trim(), color };
}

export function deleteTag(id: string): void {
  const db = getDb();
  db.runSync(`DELETE FROM tags WHERE id = ?;`, [id]);
}

export function findOrCreateTag(name: string, color: string): Tag {
  const db = getDb();
  const existing = db.getFirstSync<Tag>(
    `SELECT id, name, color FROM tags WHERE name = ? COLLATE NOCASE;`,
    [name.trim()]
  );
  if (existing) return existing;
  return createTag(name, color);
}
