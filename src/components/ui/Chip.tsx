import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}

export function Chip({ label, active, onPress, color }: ChipProps) {
  const activeColor = color ?? colors.accent;
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={[
        styles.base,
        active
          ? { backgroundColor: `${activeColor}26`, borderColor: activeColor }
          : styles.inactive,
      ]}
      hitSlop={4}
    >
      <Text style={[styles.label, active && { color: activeColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  inactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
});
