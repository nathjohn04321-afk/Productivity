import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/useTaskStore';
import { colors, spacing } from '@/theme';
import { TaskForm, type TaskFormValue } from '@/components/tasks/TaskForm';

const DEFAULT_VALUE: TaskFormValue = {
  title: '',
  description: '',
  priority: 'medium',
  dueAt: null,
  estimatedMinutes: null,
  tagIds: [],
  recurrenceFrequency: null,
};

export default function NewTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addTask = useTaskStore((s) => s.addTask);

  const handleSubmit = (value: TaskFormValue) => {
    addTask({
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

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom },
      ]}
    >
      <TaskForm initial={DEFAULT_VALUE} onSubmit={handleSubmit} submitLabel="Create task" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
});
