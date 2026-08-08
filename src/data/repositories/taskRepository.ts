import { getDb } from '../db/client';
import { generateId } from '@/utils/id';
import type {
  NewTaskInput,
  Priority,
  RecurrenceRule,
  Subtask,
  Tag,
  Task,
  TaskStatus,
} from '@/domain/models';

interface TaskRow {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  due_at: number | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  recurrence: string | null;
  recurring_template_id: string | null;
  order_index: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  is_completed: number;
  order_index: number;
}

interface TagJoinRow {
  task_id: string;
  id: string;
  name: string;
  color: string;
}

function mapTask(
  row: TaskRow,
  subtasks: Subtask[],
  tags: Tag[]
): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueAt: row.due_at,
    estimatedMinutes: row.estimated_minutes,
    actualMinutes: row.actual_minutes,
    recurrence: row.recurrence
      ? (JSON.parse(row.recurrence) as RecurrenceRule)
      : null,
    recurringTemplateId: row.recurring_template_id,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    tags,
    subtasks,
  };
}

function hydrateTasks(taskRows: TaskRow[]): Task[] {
  if (taskRows.length === 0) return [];
  const db = getDb();
  const ids = taskRows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const subtaskRows = db.getAllSync<SubtaskRow>(
    `SELECT * FROM subtasks WHERE task_id IN (${placeholders}) ORDER BY order_index ASC;`,
    ids
  );
  const tagRows = db.getAllSync<TagJoinRow>(
    `SELECT tt.task_id as task_id, t.id as id, t.name as name, t.color as color
     FROM task_tags tt JOIN tags t ON t.id = tt.tag_id
     WHERE tt.task_id IN (${placeholders});`,
    ids
  );

  const subtasksByTask = new Map<string, Subtask[]>();
  for (const s of subtaskRows) {
    const list = subtasksByTask.get(s.task_id) ?? [];
    list.push({
      id: s.id,
      taskId: s.task_id,
      title: s.title,
      isCompleted: !!s.is_completed,
      orderIndex: s.order_index,
    });
    subtasksByTask.set(s.task_id, list);
  }

  const tagsByTask = new Map<string, Tag[]>();
  for (const t of tagRows) {
    const list = tagsByTask.get(t.task_id) ?? [];
    list.push({ id: t.id, name: t.name, color: t.color });
    tagsByTask.set(t.task_id, list);
  }

  return taskRows.map((row) =>
    mapTask(
      row,
      subtasksByTask.get(row.id) ?? [],
      tagsByTask.get(row.id) ?? []
    )
  );
}

export function listTasks(): Task[] {
  const db = getDb();
  const rows = db.getAllSync<TaskRow>(
    `SELECT * FROM tasks ORDER BY order_index ASC, created_at ASC;`
  );
  return hydrateTasks(rows);
}

export function getTaskById(id: string): Task | null {
  const db = getDb();
  const row = db.getFirstSync<TaskRow>(`SELECT * FROM tasks WHERE id = ?;`, [
    id,
  ]);
  if (!row) return null;
  return hydrateTasks([row])[0] ?? null;
}

function nextOrderIndex(db: ReturnType<typeof getDb>): number {
  const row = db.getFirstSync<{ maxIndex: number | null }>(
    `SELECT MAX(order_index) as maxIndex FROM tasks;`
  );
  return (row?.maxIndex ?? -1) + 1;
}

export function createTask(
  input: NewTaskInput,
  recurringTemplateId: string | null = null
): Task {
  const db = getDb();
  const id = generateId();
  const now = Date.now();
  const orderIndex = nextOrderIndex(db);

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO tasks (id, title, description, priority, status, due_at, estimated_minutes, actual_minutes, recurrence, recurring_template_id, order_index, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, NULL, ?, ?, ?, ?, ?, NULL);`,
      [
        id,
        input.title.trim(),
        input.description ?? '',
        input.priority ?? 'medium',
        input.dueAt ?? null,
        input.estimatedMinutes ?? null,
        input.recurrence ? JSON.stringify(input.recurrence) : null,
        recurringTemplateId,
        orderIndex,
        now,
        now,
      ]
    );

    (input.subtasks ?? []).forEach((s, idx) => {
      db.runSync(
        `INSERT INTO subtasks (id, task_id, title, is_completed, order_index) VALUES (?, ?, ?, 0, ?);`,
        [generateId(), id, s.title.trim(), idx]
      );
    });

    (input.tagIds ?? []).forEach((tagId) => {
      db.runSync(
        `INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);`,
        [id, tagId]
      );
    });
  });

  return getTaskById(id)!;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: Priority;
  dueAt?: number | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  recurrence?: RecurrenceRule | null;
  tagIds?: string[];
}

export function updateTask(id: string, input: TaskUpdateInput): Task | null {
  const db = getDb();
  const now = Date.now();

  db.withTransactionSync(() => {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.title !== undefined) {
      fields.push('title = ?');
      values.push(input.title.trim());
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      values.push(input.description);
    }
    if (input.priority !== undefined) {
      fields.push('priority = ?');
      values.push(input.priority);
    }
    if (input.dueAt !== undefined) {
      fields.push('due_at = ?');
      values.push(input.dueAt);
    }
    if (input.estimatedMinutes !== undefined) {
      fields.push('estimated_minutes = ?');
      values.push(input.estimatedMinutes);
    }
    if (input.actualMinutes !== undefined) {
      fields.push('actual_minutes = ?');
      values.push(input.actualMinutes);
    }
    if (input.recurrence !== undefined) {
      fields.push('recurrence = ?');
      values.push(input.recurrence ? JSON.stringify(input.recurrence) : null);
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      db.runSync(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?;`,
        [...values, id]
      );
    }

    if (input.tagIds !== undefined) {
      db.runSync(`DELETE FROM task_tags WHERE task_id = ?;`, [id]);
      input.tagIds.forEach((tagId) => {
        db.runSync(
          `INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);`,
          [id, tagId]
        );
      });
    }
  });

  return getTaskById(id);
}

export function setTaskCompleted(id: string, completed: boolean): Task | null {
  const db = getDb();
  const now = Date.now();
  db.runSync(
    `UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?;`,
    [completed ? 'completed' : 'active', completed ? now : null, now, id]
  );
  return getTaskById(id);
}

export function deleteTask(id: string): void {
  const db = getDb();
  db.runSync(`DELETE FROM tasks WHERE id = ?;`, [id]);
}

export function rescheduleTask(id: string, dueAt: number | null): Task | null {
  return updateTask(id, { dueAt });
}

export function reorderTasks(orderedIds: string[]): void {
  const db = getDb();
  db.withTransactionSync(() => {
    orderedIds.forEach((id, index) => {
      db.runSync(`UPDATE tasks SET order_index = ? WHERE id = ?;`, [
        index,
        id,
      ]);
    });
  });
}

export function addSubtask(taskId: string, title: string): Task | null {
  const db = getDb();
  const row = db.getFirstSync<{ maxIndex: number | null }>(
    `SELECT MAX(order_index) as maxIndex FROM subtasks WHERE task_id = ?;`,
    [taskId]
  );
  const orderIndex = (row?.maxIndex ?? -1) + 1;
  db.runSync(
    `INSERT INTO subtasks (id, task_id, title, is_completed, order_index) VALUES (?, ?, ?, 0, ?);`,
    [generateId(), taskId, title.trim(), orderIndex]
  );
  db.runSync(`UPDATE tasks SET updated_at = ? WHERE id = ?;`, [
    Date.now(),
    taskId,
  ]);
  return getTaskById(taskId);
}

export function toggleSubtask(
  subtaskId: string,
  taskId: string
): Task | null {
  const db = getDb();
  db.runSync(
    `UPDATE subtasks SET is_completed = 1 - is_completed WHERE id = ?;`,
    [subtaskId]
  );
  db.runSync(`UPDATE tasks SET updated_at = ? WHERE id = ?;`, [
    Date.now(),
    taskId,
  ]);
  return getTaskById(taskId);
}

export function deleteSubtask(subtaskId: string, taskId: string): Task | null {
  const db = getDb();
  db.runSync(`DELETE FROM subtasks WHERE id = ?;`, [subtaskId]);
  return getTaskById(taskId);
}

export function generateRecurringInstance(
  template: Task,
  dueAt: number
): Task {
  return createTask(
    {
      title: template.title,
      description: template.description,
      priority: template.priority,
      dueAt,
      estimatedMinutes: template.estimatedMinutes,
      recurrence: null,
      tagIds: template.tags.map((t) => t.id),
      subtasks: template.subtasks.map((s) => ({ title: s.title })),
    },
    template.id
  );
}
