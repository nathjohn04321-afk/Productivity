import { getDb } from './client';

interface Migration {
  version: number;
  statements: string[];
}

// Append new migrations to the end; never edit a shipped one, since
// user_version tracks how far a device's on-disk DB has already advanced.
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'active',
        due_at INTEGER,
        estimated_minutes INTEGER,
        actual_minutes INTEGER,
        recurrence TEXT,
        recurring_template_id TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        completed_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS subtasks (
        id TEXT PRIMARY KEY NOT NULL,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0,
        order_index INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS task_tags (
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, tag_id)
      );`,
      `CREATE TABLE IF NOT EXISTS journal_entries (
        date TEXT PRIMARY KEY NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        mood INTEGER,
        updated_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
        started_at INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS daily_goals (
        date TEXT PRIMARY KEY NOT NULL,
        target_tasks INTEGER NOT NULL DEFAULT 5,
        target_focus_minutes INTEGER NOT NULL DEFAULT 60
      );`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);`,
      `CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);`,
      `CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON task_tags(task_id);`,
      `CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);`,
    ],
  },
];

/** Runs any migrations newer than the DB's current user_version, in order. */
export function runMigrations(): void {
  const db = getDb();
  const row = db.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = row?.user_version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pending) {
    db.withTransactionSync(() => {
      for (const statement of migration.statements) {
        db.execSync(statement);
      }
      db.execSync(`PRAGMA user_version = ${migration.version};`);
    });
  }
}
