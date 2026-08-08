import { create } from 'zustand';
import type {
  NewTaskInput,
  Task,
  TaskFilter,
  TaskSort,
} from '@/domain/models';
import { PRIORITY_ORDER } from '@/domain/models';
import { findMissingRecurringInstances } from '@/domain/recurrence';
import * as taskRepo from '@/data/repositories/taskRepository';
import type { TaskUpdateInput } from '@/data/repositories/taskRepository';
import { haptics } from '@/utils/haptics';
import { addDays, dateKeyFromTimestamp, todayKey } from '@/utils/date';

interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  filter: TaskFilter;
  sort: TaskSort;
  activeTagId: string | null;
  activePriority: Task['priority'] | null;

  hydrate: () => void;
  refresh: () => void;
  setFilter: (filter: TaskFilter) => void;
  setSort: (sort: TaskSort) => void;
  setActiveTag: (tagId: string | null) => void;
  setActivePriority: (priority: Task['priority'] | null) => void;

  addTask: (input: NewTaskInput) => Task;
  editTask: (id: string, input: TaskUpdateInput) => void;
  toggleComplete: (id: string) => void;
  removeTask: (id: string) => void;
  reschedule: (id: string, dueAt: number | null) => void;
  reorder: (orderedIds: string[]) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;

  visibleTasks: () => Task[];
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isLoading: true,
  filter: 'today',
  sort: 'manual',
  activeTagId: null,
  activePriority: null,

  hydrate: () => {
    set({ isLoading: true });
    generateDueRecurringInstances();
    const tasks = taskRepo.listTasks();
    set({ tasks, isLoading: false });
  },

  refresh: () => {
    set({ tasks: taskRepo.listTasks() });
  },

  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),
  setActiveTag: (activeTagId) => set({ activeTagId }),
  setActivePriority: (activePriority) => set({ activePriority }),

  addTask: (input) => {
    const task = taskRepo.createTask(input);
    haptics.light();
    get().refresh();
    return task;
  },

  editTask: (id, input) => {
    taskRepo.updateTask(id, input);
    get().refresh();
  },

  toggleComplete: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    const willComplete = task?.status !== 'completed';
    taskRepo.setTaskCompleted(id, willComplete);
    if (willComplete) {
      haptics.success();
    } else {
      haptics.light();
    }
    get().refresh();
  },

  removeTask: (id) => {
    taskRepo.deleteTask(id);
    haptics.medium();
    get().refresh();
  },

  reschedule: (id, dueAt) => {
    taskRepo.rescheduleTask(id, dueAt);
    haptics.light();
    get().refresh();
  },

  reorder: (orderedIds) => {
    set((state) => {
      const byId = new Map(state.tasks.map((t) => [t.id, t]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((t): t is Task => !!t);
      return { tasks: reordered };
    });
    taskRepo.reorderTasks(orderedIds);
  },

  addSubtask: (taskId, title) => {
    taskRepo.addSubtask(taskId, title);
    get().refresh();
  },

  toggleSubtask: (taskId, subtaskId) => {
    taskRepo.toggleSubtask(subtaskId, taskId);
    haptics.selection();
    get().refresh();
  },

  removeSubtask: (taskId, subtaskId) => {
    taskRepo.deleteSubtask(subtaskId, taskId);
    get().refresh();
  },

  visibleTasks: () => {
    const { tasks, filter, sort, activeTagId, activePriority } = get();
    let result = tasks;

    const now = Date.now();
    const today = todayKey();
    const tomorrow = dateKeyFromTimestamp(addDays(new Date(), 1).getTime());

    switch (filter) {
      case 'today':
        result = result.filter(
          (t) =>
            t.recurrence === null &&
            t.status === 'active' &&
            t.dueAt !== null &&
            dateKeyFromTimestamp(t.dueAt) === today
        );
        break;
      case 'upcoming':
        result = result.filter(
          (t) =>
            t.recurrence === null &&
            t.status === 'active' &&
            t.dueAt !== null &&
            dateKeyFromTimestamp(t.dueAt) >= tomorrow
        );
        break;
      case 'overdue':
        result = result.filter(
          (t) =>
            t.recurrence === null &&
            t.status === 'active' &&
            t.dueAt !== null &&
            t.dueAt < now &&
            dateKeyFromTimestamp(t.dueAt) !== today
        );
        break;
      case 'completed':
        result = result.filter((t) => t.status === 'completed');
        break;
      case 'all':
      default:
        break;
    }

    if (activeTagId) {
      result = result.filter((t) => t.tags.some((tag) => tag.id === activeTagId));
    }
    if (activePriority) {
      result = result.filter((t) => t.priority === activePriority);
    }

    switch (sort) {
      case 'priority':
        result = [...result].sort(
          (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        );
        break;
      case 'dueDate':
        result = [...result].sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
        break;
      case 'created':
        result = [...result].sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'manual':
      default:
        result = [...result].sort((a, b) => a.orderIndex - b.orderIndex);
        break;
    }

    return result;
  },
}));

function generateDueRecurringInstances() {
  const all = taskRepo.listTasks();
  const templates = all.filter((t) => t.recurrence !== null);
  const missing = findMissingRecurringInstances(templates, all);
  missing.forEach(({ templateId, dueAt }) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) taskRepo.generateRecurringInstance(template, dueAt);
  });
}
