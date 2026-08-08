import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Task } from '@/domain/models';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDueDate } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import { PriorityBadge, priorityColor } from './PriorityBadge';
import { Badge } from '@/components/ui';

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  dragHandle?: React.ReactNode;
}

export function TaskCard({ task, onToggleComplete, dragHandle }: TaskCardProps) {
  const router = useRouter();
  const isCompleted = task.status === 'completed';
  const isOverdue =
    !isCompleted && task.dueAt !== null && task.dueAt < Date.now();
  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/task/${task.id}`)}
    >
      <Pressable
        onPress={() => {
          haptics.selection();
          onToggleComplete();
        }}
        hitSlop={10}
        style={[
          styles.checkbox,
          { borderColor: priorityColor(task.priority) },
          isCompleted && {
            backgroundColor: priorityColor(task.priority),
          },
        ]}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[styles.title, isCompleted && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          <PriorityBadge priority={task.priority} />
          {task.dueAt !== null && (
            <Text style={[styles.meta, isOverdue && styles.metaOverdue]}>
              {formatDueDate(task.dueAt)}
            </Text>
          )}
          {task.estimatedMinutes !== null && (
            <Text style={styles.meta}>⏱ {task.estimatedMinutes}m</Text>
          )}
          {task.subtasks.length > 0 && (
            <Text style={styles.meta}>
              ☑ {completedSubtasks}/{task.subtasks.length}
            </Text>
          )}
          {task.recurrence && <Text style={styles.meta}>↻</Text>}
        </View>

        {task.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {task.tags.map((tag) => (
              <Badge key={tag.id} label={tag.name} color={tag.color} />
            ))}
          </View>
        )}
      </View>

      {dragHandle}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: {
    color: colors.bg,
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  titleCompleted: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  metaOverdue: {
    color: colors.danger,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
