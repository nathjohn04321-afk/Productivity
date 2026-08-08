import { getDb } from '../db/client';
import { generateId } from '@/utils/id';
import type { PomodoroSession } from '@/domain/models';

interface SessionRow {
  id: string;
  task_id: string | null;
  started_at: number;
  duration_minutes: number;
  completed: number;
}

function mapRow(row: SessionRow): PomodoroSession {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    durationMinutes: row.duration_minutes,
    completed: !!row.completed,
  };
}

export function listPomodoroSessions(): PomodoroSession[] {
  const db = getDb();
  const rows = db.getAllSync<SessionRow>(
    `SELECT * FROM pomodoro_sessions ORDER BY started_at DESC;`
  );
  return rows.map(mapRow);
}

export function logPomodoroSession(
  taskId: string | null,
  durationMinutes: number,
  completed: boolean
): PomodoroSession {
  const db = getDb();
  const id = generateId();
  const startedAt = Date.now();
  db.runSync(
    `INSERT INTO pomodoro_sessions (id, task_id, started_at, duration_minutes, completed) VALUES (?, ?, ?, ?, ?);`,
    [id, taskId, startedAt, durationMinutes, completed ? 1 : 0]
  );
  return { id, taskId, startedAt, durationMinutes, completed };
}
