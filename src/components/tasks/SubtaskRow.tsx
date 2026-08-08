import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Subtask } from '@/domain/models';
import { colors, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

interface SubtaskRowProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
}

export function SubtaskRow({ subtask, onToggle, onDelete }: SubtaskRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          haptics.selection();
          onToggle();
        }}
        style={[styles.checkbox, subtask.isCompleted && styles.checkboxDone]}
        hitSlop={8}
      >
        {subtask.isCompleted && <Text style={styles.check}>✓</Text>}
      </Pressable>
      <Text
        style={[styles.title, subtask.isCompleted && styles.titleDone]}
        numberOfLines={2}
      >
        {subtask.title}
      </Text>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Text style={styles.remove}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  check: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  titleDone: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  remove: {
    color: colors.textTertiary,
    fontSize: 14,
    paddingHorizontal: spacing.xs,
  },
});
