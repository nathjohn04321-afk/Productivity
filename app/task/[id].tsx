import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/useTaskStore';
import { colors, spacing, typography } from '@/theme';
import { TaskForm, type TaskFormValue } from '@/components/tasks/TaskForm';
import { Button, EmptyState } from '@/components/ui';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const task = useTaskStore((s) => s.tasks.find((t) => t.id === id));
  const editTask = useTaskStore((s) => s.editTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const removeSubtask = useTaskStore((s) => s.removeSubtask);

  if (!task) {
    return (
      <View
        style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
      >
        <EmptyState icon="🔍" title="Task not found" body="It may have been deleted." />
      </View>
    );
  }

  const initial: TaskFormValue = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueAt: task.dueAt,
    estimatedMinutes: task.estimatedMinutes,
    tagIds: task.tags.map((t) => t.id),
    recurrenceFrequency: task.recurrence?.frequency ?? null,
  };

  const handleSubmit = (value: TaskFormValue) => {
    editTask(task.id, {
      title: value.title,
      description: value.description,
      priority: value.priority,
      dueAt: value.dueAt,
      estimatedMinutes: value.estimatedMinutes,
      tagIds: value.tagIds,
      recurrence: value.recurrenceFrequency
        ? { frequency: value.recurrenceFrequency }
        : null,
    });
    router.back();
  };

  const handleDelete = () => {
    removeTask(task.id);
    router.back();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom },
      ]}
    >
      {task.recurrence && (
        <Text style={styles.recurrenceNote}>
          ↻ This is a recurring task template — edits apply to future occurrences.
        </Text>
      )}
      <TaskForm
        initial={initial}
        subtasks={task.subtasks}
        onAddSubtask={(title) => addSubtask(task.id, title)}
        onToggleSubtask={(subtaskId) => toggleSubtask(task.id, subtaskId)}
        onDeleteSubtask={(subtaskId) => removeSubtask(task.id, subtaskId)}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
      <Button
        label="Delete task"
        variant="danger"
        onPress={handleDelete}
        style={styles.deleteButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  recurrenceNote: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
