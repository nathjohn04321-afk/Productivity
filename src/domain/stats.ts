import type { Priority, StatsPeriod, Tag, Task } from './models';
import {
  addDays,
  dateKeyFromTimestamp,
  startOfDay,
  startOfMonth,
  startOfWeek,
  todayKey,
  weekdayLabel,
} from '@/utils/date';
import { chartPalette } from '@/theme/colors';

export interface DateRange {
  start: number;
  end: number;
}

export function periodRange(period: StatsPeriod, reference = new Date()): DateRange {
  const now = startOfDay(reference);
  switch (period) {
    case 'day':
      return { start: now.getTime(), end: addDays(now, 1).getTime() - 1 };
    case 'week': {
      const start = startOfWeek(now);
      return { start: start.getTime(), end: addDays(start, 7).getTime() - 1 };
    }
    case 'month': {
      const start = startOfMonth(now);
      const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return { start: start.getTime(), end: nextMonth.getTime() - 1 };
    }
    case 'all':
    default:
      return { start: 0, end: Date.now() };
  }
}

function daysElapsedInPeriod(period: StatsPeriod, range: DateRange): number {
  const now = Date.now();
  const effectiveEnd = Math.min(range.end, now);
  const days = Math.max(
    1,
    Math.round((effectiveEnd - range.start) / 86_400_000) + 1
  );
  if (period === 'all') return days;
  return days;
}

export interface CoreMetrics {
  tasksCompleted: number;
  totalDue: number;
  completionRate: number; // 0-1
  avgTasksPerDay: number;
  estimatedMinutes: number;
  actualMinutes: number;
}

export function computeCoreMetrics(
  tasks: Task[],
  period: StatsPeriod,
  reference = new Date()
): CoreMetrics {
  const range = periodRange(period, reference);
  const completedInRange = tasks.filter(
    (t) =>
      t.completedAt !== null &&
      t.completedAt >= range.start &&
      t.completedAt <= range.end
  );
  const dueInRange = tasks.filter(
    (t) => t.dueAt !== null && t.dueAt >= range.start && t.dueAt <= range.end
  );
  const dueCompleted = dueInRange.filter((t) => t.status === 'completed');

  const withActual = completedInRange.filter(
    (t) => t.estimatedMinutes != null && t.actualMinutes != null
  );
  const estimatedMinutes = withActual.reduce(
    (sum, t) => sum + (t.estimatedMinutes ?? 0),
    0
  );
  const actualMinutes = withActual.reduce(
    (sum, t) => sum + (t.actualMinutes ?? 0),
    0
  );

  const days = daysElapsedInPeriod(period, range);

  return {
    tasksCompleted: completedInRange.length,
    totalDue: dueInRange.length,
    completionRate: dueInRange.length > 0 ? dueCompleted.length / dueInRange.length : completedInRange.length > 0 ? 1 : 0,
    avgTasksPerDay: completedInRange.length / days,
    estimatedMinutes,
    actualMinutes,
  };
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export function computeStreaks(tasks: Task[]): StreakInfo {
  const completedDays = new Set(
    tasks
      .filter((t) => t.completedAt !== null)
      .map((t) => dateKeyFromTimestamp(t.completedAt!))
  );

  if (completedDays.size === 0) return { current: 0, longest: 0 };

  // Current streak: walk backward from today (or yesterday if today is empty).
  let current = 0;
  let cursor = startOfDay(new Date());
  if (!completedDays.has(todayKey())) {
    cursor = addDays(cursor, -1);
  }
  while (completedDays.has(dateKeyFromTimestamp(cursor.getTime()))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest streak: scan the full range of completed dates.
  const sortedKeys = Array.from(completedDays).sort();
  let longest = 0;
  let run = 0;
  let prevDate: Date | null = null;
  for (const key of sortedKeys) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (prevDate && date.getTime() - prevDate.getTime() === 86_400_000) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevDate = date;
  }

  return { current, longest: Math.max(longest, current) };
}

export interface PriorityBreakdownEntry {
  priority: Priority;
  total: number;
  completed: number;
  rate: number;
  color: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#F87171',
  high: '#FB923C',
  medium: '#FBBF24',
  low: '#60A5FA',
};

export function computePriorityBreakdown(
  tasks: Task[],
  range?: DateRange
): PriorityBreakdownEntry[] {
  const scoped = range
    ? tasks.filter((t) => t.createdAt >= range.start && t.createdAt <= range.end)
    : tasks;
  const priorities: Priority[] = ['critical', 'high', 'medium', 'low'];
  return priorities.map((priority) => {
    const forPriority = scoped.filter((t) => t.priority === priority);
    const completed = forPriority.filter((t) => t.status === 'completed');
    return {
      priority,
      total: forPriority.length,
      completed: completed.length,
      rate: forPriority.length > 0 ? completed.length / forPriority.length : 0,
      color: PRIORITY_COLORS[priority],
    };
  });
}

export interface TagDistributionEntry {
  tag: Tag;
  count: number;
  color: string;
}

export function computeTagDistribution(
  tasks: Task[],
  range?: DateRange
): TagDistributionEntry[] {
  const scoped = range
    ? tasks.filter((t) => t.createdAt >= range.start && t.createdAt <= range.end)
    : tasks;
  const counts = new Map<string, { tag: Tag; count: number }>();
  scoped.forEach((task) => {
    task.tags.forEach((tag) => {
      const existing = counts.get(tag.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(tag.id, { tag, count: 1 });
      }
    });
  });
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .map((entry, idx) => ({
      ...entry,
      color: chartPalette[idx % chartPalette.length],
    }));
}

export interface HeatmapCell {
  dateKey: string;
  count: number;
}

export function computeHeatmap(tasks: Task[], days = 91): HeatmapCell[] {
  const counts = new Map<string, number>();
  tasks
    .filter((t) => t.completedAt !== null)
    .forEach((t) => {
      const key = dateKeyFromTimestamp(t.completedAt!);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

  const cells: HeatmapCell[] = [];
  const today = startOfDay(new Date());
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const key = dateKeyFromTimestamp(date.getTime());
    cells.push({ dateKey: key, count: counts.get(key) ?? 0 });
  }
  return cells;
}

export interface TrendBucket {
  label: string;
  value: number;
}

export function computeTrend(
  tasks: Task[],
  period: StatsPeriod,
  reference = new Date()
): TrendBucket[] {
  const completedByDay = new Map<string, number>();
  tasks
    .filter((t) => t.completedAt !== null)
    .forEach((t) => {
      const key = dateKeyFromTimestamp(t.completedAt!);
      completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
    });

  if (period === 'all') {
    const byMonth = new Map<string, number>();
    tasks
      .filter((t) => t.completedAt !== null)
      .forEach((t) => {
        const d = new Date(t.completedAt!);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      });
    const buckets: TrendBucket[] = [];
    const now = startOfMonth(reference);
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.push({
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        value: byMonth.get(key) ?? 0,
      });
    }
    return buckets;
  }

  const spanDays = period === 'day' ? 7 : period === 'week' ? 7 : 30;
  const buckets: TrendBucket[] = [];
  const today = startOfDay(reference);
  for (let i = spanDays - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const key = dateKeyFromTimestamp(date.getTime());
    const label =
      spanDays === 7
        ? weekdayLabel(date.getDay()).slice(0, 3)
        : String(date.getDate());
    buckets.push({ label, value: completedByDay.get(key) ?? 0 });
  }
  return buckets;
}

export interface InsightCard {
  id: string;
  title: string;
  body: string;
}

export function generateInsights(tasks: Task[]): InsightCard[] {
  const insights: InsightCard[] = [];
  const completed = tasks.filter((t) => t.completedAt !== null);

  if (completed.length >= 3) {
    const byWeekday = new Array(7).fill(0);
    completed.forEach((t) => {
      byWeekday[new Date(t.completedAt!).getDay()] += 1;
    });
    const bestDay = byWeekday.indexOf(Math.max(...byWeekday));
    insights.push({
      id: 'best-day',
      title: 'Peak day',
      body: `Your best day is ${weekdayLabel(bestDay)} — that's when you complete the most tasks.`,
    });
  }

  const breakdown = computePriorityBreakdown(tasks);
  const highPriority = breakdown.find((b) => b.priority === 'high');
  if (highPriority && highPriority.total >= 3) {
    insights.push({
      id: 'high-priority-rate',
      title: 'High priority follow-through',
      body: `You complete ${Math.round(highPriority.rate * 100)}% of your High priority tasks.`,
    });
  }

  const critical = breakdown.find((b) => b.priority === 'critical');
  if (critical && critical.total >= 2 && critical.rate < 0.6) {
    insights.push({
      id: 'critical-warning',
      title: 'Critical tasks slipping',
      body: `Only ${Math.round(critical.rate * 100)}% of Critical tasks get finished — consider tackling these first.`,
    });
  }

  const streaks = computeStreaks(tasks);
  if (streaks.current >= 2) {
    insights.push({
      id: 'streak',
      title: 'On a roll',
      body: `You're on a ${streaks.current}-day completion streak. Longest ever: ${streaks.longest} days.`,
    });
  }

  const withEstimates = completed.filter(
    (t) => t.estimatedMinutes != null && t.actualMinutes != null && t.estimatedMinutes > 0
  );
  if (withEstimates.length >= 3) {
    const avgRatio =
      withEstimates.reduce((sum, t) => sum + t.actualMinutes! / t.estimatedMinutes!, 0) /
      withEstimates.length;
    if (avgRatio > 1.15) {
      insights.push({
        id: 'estimate-under',
        title: 'Estimates run short',
        body: `Tasks take ${Math.round((avgRatio - 1) * 100)}% longer than estimated on average — try padding your estimates.`,
      });
    } else if (avgRatio < 0.85) {
      insights.push({
        id: 'estimate-over',
        title: 'Estimates run long',
        body: `You finish tasks ${Math.round((1 - avgRatio) * 100)}% faster than estimated on average.`,
      });
    }
  }

  return insights;
}
