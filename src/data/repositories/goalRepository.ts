import { getDb } from '../db/client';
import type { DailyGoal } from '@/domain/models';

const DEFAULT_TARGET_TASKS = 5;
const DEFAULT_TARGET_FOCUS_MINUTES = 60;

export function getDailyGoal(date: string): DailyGoal {
  const db = getDb();
  const row = db.getFirstSync<DailyGoal>(
    `SELECT date, target_tasks as targetTasks, target_focus_minutes as targetFocusMinutes FROM daily_goals WHERE date = ?;`,
    [date]
  );
  if (row) return row;
  return {
    date,
    targetTasks: DEFAULT_TARGET_TASKS,
    targetFocusMinutes: DEFAULT_TARGET_FOCUS_MINUTES,
  };
}

export function setDailyGoal(
  date: string,
  targetTasks: number,
  targetFocusMinutes: number
): DailyGoal {
  const db = getDb();
  db.runSync(
    `INSERT INTO daily_goals (date, target_tasks, target_focus_minutes)
     VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET target_tasks = excluded.target_tasks, target_focus_minutes = excluded.target_focus_minutes;`,
    [date, targetTasks, targetFocusMinutes]
  );
  return { date, targetTasks, targetFocusMinutes };
}

export function listDailyGoals(): DailyGoal[] {
  const db = getDb();
  return db.getAllSync<DailyGoal>(
    `SELECT date, target_tasks as targetTasks, target_focus_minutes as targetFocusMinutes FROM daily_goals;`
  );
}
