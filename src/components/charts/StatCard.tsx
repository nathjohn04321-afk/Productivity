import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  accentColor?: string;
}

export function StatCard({ label, value, caption, accentColor = colors.accent }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  value: {
    ...typography.stat,
  },
  caption: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
