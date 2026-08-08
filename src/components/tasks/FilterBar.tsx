import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Priority, Tag, TaskFilter, TaskSort } from '@/domain/models';
import { PRIORITY_LABELS } from '@/domain/models';
import { spacing } from '@/theme';
import { Chip } from '@/components/ui';
import { priorityColor } from './PriorityBadge';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const SORTS: { value: TaskSort; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'created', label: 'Newest' },
];

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low'];

interface FilterBarProps {
  filter: TaskFilter;
  onFilterChange: (f: TaskFilter) => void;
  sort: TaskSort;
  onSortChange: (s: TaskSort) => void;
  tags: Tag[];
  activeTagId: string | null;
  onTagChange: (tagId: string | null) => void;
  activePriority: Priority | null;
  onPriorityChange: (p: Priority | null) => void;
}

export function FilterBar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  tags,
  activeTagId,
  onTagChange,
  activePriority,
  onPriorityChange,
}: FilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onPress={() => onFilterChange(f.value)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {SORTS.map((s) => (
          <Chip
            key={s.value}
            label={`Sort: ${s.label}`}
            active={sort === s.value}
            onPress={() => onSortChange(s.value)}
          />
        ))}
        {PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={PRIORITY_LABELS[p]}
            color={priorityColor(p)}
            active={activePriority === p}
            onPress={() => onPriorityChange(activePriority === p ? null : p)}
          />
        ))}
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            active={activeTagId === tag.id}
            onPress={() => onTagChange(activeTagId === tag.id ? null : tag.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
