import React from 'react';
import { PRIORITY_LABELS, type Priority } from '@/domain/models';
import { colors } from '@/theme';
import { Badge } from '@/components/ui';

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: colors.priorityCritical,
  high: colors.priorityHigh,
  medium: colors.priorityMedium,
  low: colors.priorityLow,
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge label={PRIORITY_LABELS[priority]} color={PRIORITY_COLORS[priority]} />;
}

export function priorityColor(priority: Priority): string {
  return PRIORITY_COLORS[priority];
}
