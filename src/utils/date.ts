export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateKeyFromTimestamp(ts: number): string {
  return toDateKey(new Date(ts));
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday
  return addDays(d, -day);
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
}

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function weekdayLabel(dayIndex: number): string {
  return WEEKDAY_LABELS[dayIndex] ?? '';
}

export function formatDueDate(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const key = toDateKey(date);
  const todayK = toDateKey(now);
  const tomorrowK = toDateKey(addDays(now, 1));
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (key === todayK) return `Today · ${time}`;
  if (key === tomorrowK) return `Tomorrow · ${time}`;
  const yesterdayK = toDateKey(addDays(now, -1));
  if (key === yesterdayK) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })} · ${time}`;
}

export function formatMonthDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
