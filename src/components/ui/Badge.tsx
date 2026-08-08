import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/theme';

interface BadgeProps {
  label: string;
  color: string;
  soft?: boolean;
}

export function Badge({ label, color, soft = true }: BadgeProps) {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: soft ? `${color}26` : color },
      ]}
    >
      <Text style={[styles.label, { color: soft ? color : '#0F0F11' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.micro,
    textTransform: 'uppercase',
  },
});
