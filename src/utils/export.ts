import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { DailyGoal, JournalEntry, PomodoroSession, Task } from '@/domain/models';
import { todayKey } from './date';

export type ExportFormat = 'json' | 'csv';

interface ExportBundle {
  tasks: Task[];
  journalEntries: JournalEntry[];
  pomodoroSessions: PomodoroSession[];
  dailyGoals: DailyGoal[];
}

function csvEscape(value: string | number | null): string {
  const str = value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function tasksToCsv(tasks: Task[]): string {
  const headers = [
    'id',
    'title',
    'description',
    'priority',
    'status',
    'dueAt',
    'estimatedMinutes',
    'actualMinutes',
    'tags',
    'subtasksCompleted',
    'subtasksTotal',
    'createdAt',
    'completedAt',
  ];
  const rows = tasks.map((t) =>
    [
      t.id,
      t.title,
      t.description,
      t.priority,
      t.status,
      t.dueAt ? new Date(t.dueAt).toISOString() : '',
      t.estimatedMinutes ?? '',
      t.actualMinutes ?? '',
      t.tags.map((tag) => tag.name).join('; '),
      t.subtasks.filter((s) => s.isCompleted).length,
      t.subtasks.length,
      new Date(t.createdAt).toISOString(),
      t.completedAt ? new Date(t.completedAt).toISOString() : '',
    ]
      .map(csvEscape)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

/** Writes the export to a cache file and opens the native share sheet. */
export async function exportData(format: ExportFormat, bundle: ExportBundle): Promise<void> {
  const filename = `focusflow-export-${todayKey()}.${format}`;
  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();

  const content =
    format === 'json'
      ? JSON.stringify(bundle, null, 2)
      : tasksToCsv(bundle.tasks);

  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: format === 'json' ? 'application/json' : 'text/csv',
      dialogTitle: 'Export FocusFlow data',
    });
  }
}
