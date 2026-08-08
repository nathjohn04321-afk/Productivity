import type { RecurrenceRule, Task } from './models';
import { toDateKey } from '@/utils/date';

export function ruleMatchesDate(
  rule: RecurrenceRule,
  date: Date,
  anchor: Date
): boolean {
  switch (rule.frequency) {
    case 'daily': {
      const interval = rule.interval ?? 1;
      const diffDays = Math.round(
        (toStartOfDay(date).getTime() - toStartOfDay(anchor).getTime()) / 86_400_000
      );
      return diffDays >= 0 && diffDays % interval === 0;
    }
    case 'weekdays':
      return date.getDay() >= 1 && date.getDay() <= 5;
    case 'weekly': {
      const days = rule.daysOfWeek ?? [anchor.getDay()];
      return days.includes(date.getDay());
    }
    case 'custom':
      return (rule.daysOfWeek ?? []).includes(date.getDay());
    default:
      return false;
  }
}

function toStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface RecurringDue {
  templateId: string;
  dueAt: number;
}

/**
 * Given recurring templates and already-materialized instances, returns the
 * templates that need a fresh instance created for `today`.
 */
export function findMissingRecurringInstances(
  templates: Task[],
  allTasks: Task[],
  today: Date = new Date()
): RecurringDue[] {
  const todayKey = toDateKey(today);
  const due: RecurringDue[] = [];

  for (const template of templates) {
    if (!template.recurrence) continue;
    const anchor = new Date(template.createdAt);
    if (!ruleMatchesDate(template.recurrence, today, anchor)) continue;

    const alreadyExists = allTasks.some(
      (t) =>
        t.recurringTemplateId === template.id &&
        t.dueAt !== null &&
        toDateKey(new Date(t.dueAt)) === todayKey
    );
    if (alreadyExists) continue;

    const dueAt = toStartOfDay(today);
    dueAt.setHours(anchor.getHours() || 9, anchor.getMinutes() || 0, 0, 0);
    due.push({ templateId: template.id, dueAt: dueAt.getTime() });
  }

  return due;
}

export const RECURRENCE_LABELS: Record<RecurrenceRule['frequency'], string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
  custom: 'Custom',
};
