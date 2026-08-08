import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

interface QuickAddBarProps {
  onSubmit: (title: string) => void;
  onExpand: () => void;
}

export function QuickAddBar({ onSubmit, onExpand }: QuickAddBarProps) {
  const [value, setValue] = useState('');

  const submit = () => {
    const title = value.trim();
    if (!title) return;
    onSubmit(title);
    setValue('');
    haptics.light();
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Quick-add a task…"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={submit}
        blurOnSubmit={false}
      />
      <Pressable style={styles.expandButton} onPress={onExpand} hitSlop={8}>
        <Text style={styles.expandIcon}>⚙</Text>
      </Pressable>
      <Pressable
        style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
        onPress={submit}
        disabled={!value.trim()}
        hitSlop={8}
      >
        <Text style={styles.sendIcon}>↑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    ...shadow.floating,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceHigh,
  },
  sendIcon: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '700',
  },
});
