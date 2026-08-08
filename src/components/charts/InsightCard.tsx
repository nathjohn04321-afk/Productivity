import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';
import type { InsightCard as InsightCardData } from '@/domain/stats';

export function InsightCard({ title, body }: InsightCardData) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.teal,
  },
  title: {
    ...typography.captionStrong,
    color: colors.teal,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
