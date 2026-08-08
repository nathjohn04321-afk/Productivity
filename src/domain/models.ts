export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'active' | 'completed';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'weekdays' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  /** For 'custom': 0=Sun..6=Sat */
  daysOfWeek?: number[];
  /** Repeat every N units (days for daily, weeks for weekly) */
  interval?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueAt: number | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  recurrence: RecurrenceRule | null;
  recurringTemplateId: string | null;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  tags: Tag[];
  subtasks: Subtask[];
}

export interface NewTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueAt?: number | null;
  estimatedMinutes?: number | null;
  recurrence?: RecurrenceRule | null;
  tagIds?: string[];
  subtasks?: { title: string }[];
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  content: string;
  mood: number | null; // 1-5
  updatedAt: number;
}

export interface PomodoroSession {
  id: string;
  taskId: string | null;
  startedAt: number;
  durationMinutes: number;
  completed: boolean;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
  targetTasks: number;
  targetFocusMinutes: number;
}

export type TaskFilter =
  | 'today'
  | 'upcoming'
  | 'overdue'
  | 'completed'
  | 'all';

export type TaskSort = 'manual' | 'priority' | 'dueDate' | 'created';

export type StatsPeriod = 'day' | 'week' | 'month' | 'all';

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
