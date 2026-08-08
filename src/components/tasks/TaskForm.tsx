import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type {
  Priority,
  RecurrenceFrequency,
  Subtask,
} from '@/domain/models';
import { PRIORITY_LABELS } from '@/domain/models';
import { RECURRENCE_LABELS } from '@/domain/recurrence';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Chip, TextField } from '@/components/ui';
import { useTagStore } from '@/store/useTagStore';
import { priorityColor } from './PriorityBadge';
import { SubtaskRow } from './SubtaskRow';
import { formatDueDate } from '@/utils/date';
import { haptics } from '@/utils/haptics';

export interface TaskFormValue {
  title: string;
  description: string;
  priority: Priority;
  dueAt: number | null;
  estimatedMinutes: number | null;
  tagIds: string[];
  recurrenceFrequency: RecurrenceFrequency | null;
}

interface TaskFormProps {
  initial: TaskFormValue;
  subtasks?: Subtask[];
  onAddSubtask?: (title: string) => void;
  onToggleSubtask?: (id: string) => void;
  onDeleteSubtask?: (id: string) => void;
  onSubmit: (value: TaskFormValue) => void;
  submitLabel: string;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const RECURRENCES: RecurrenceFrequency[] = ['daily', 'weekdays', 'weekly'];

export function TaskForm({
  initial,
  subtasks = [],
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onSubmit,
  submitLabel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [dueAt, setDueAt] = useState<number | null>(initial.dueAt);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initial.estimatedMinutes ? String(initial.estimatedMinutes) : ''
  );
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | null>(
    initial.recurrenceFrequency
  );
  const [showPicker, setShowPicker] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const tags = useTagStore((s) => s.tags);
  const createTag = useTagStore((s) => s.createTag);

  const toggleTag = (id: string) => {
    haptics.selection();
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addNewTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    const tag = createTag(name);
    setTagIds((prev) => [...prev, tag.id]);
    setNewTagName('');
  };

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description,
      priority,
      dueAt,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      tagIds,
      recurrenceFrequency: recurrence,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="What needs to get done?"
        autoFocus={!initial.title}
      />

      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Add more detail (optional)"
        multiline
        numberOfLines={3}
        style={{ minHeight: 72, textAlignVertical: 'top' }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Priority</Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Chip
              key={p}
              label={PRIORITY_LABELS[p]}
              color={priorityColor(p)}
              active={priority === p}
              onPress={() => setPriority(p)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Due date</Text>
        <View style={styles.chipRow}>
          <Chip
            label="None"
            active={dueAt === null}
            onPress={() => setDueAt(null)}
          />
          <Chip
            label="Today"
            active={false}
            onPress={() => setDueAt(withTime(new Date(), dueAt))}
          />
          <Chip
            label="Tomorrow"
            active={false}
            onPress={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setDueAt(withTime(d, dueAt));
            }}
          />
          <Chip label="Pick date…" active={false} onPress={() => setShowPicker(true)} />
        </View>
        {dueAt !== null && (
          <Text style={styles.dueSummary}>{formatDueDate(dueAt)}</Text>
        )}
        {showPicker && (
          <DateTimePicker
            value={dueAt ? new Date(dueAt) : new Date()}
            mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
            onChange={(event, selected) => {
              if (Platform.OS !== 'ios') setShowPicker(false);
              if (event.type === 'dismissed' || !selected) return;
              setDueAt(selected.getTime());
            }}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Estimated time (minutes)</Text>
        <TextInput
          value={estimatedMinutes}
          onChangeText={(v) => setEstimatedMinutes(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="e.g. 30"
          placeholderTextColor={colors.textTertiary}
          style={styles.numberInput}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Repeat</Text>
        <View style={styles.chipRow}>
          <Chip label="None" active={recurrence === null} onPress={() => setRecurrence(null)} />
          {RECURRENCES.map((r) => (
            <Chip
              key={r}
              label={RECURRENCE_LABELS[r]}
              active={recurrence === r}
              onPress={() => setRecurrence(r)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Tags</Text>
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              color={tag.color}
              active={tagIds.includes(tag.id)}
              onPress={() => toggleTag(tag.id)}
            />
          ))}
        </View>
        <View style={styles.newTagRow}>
          <TextInput
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="New tag name"
            placeholderTextColor={colors.textTertiary}
            style={styles.newTagInput}
            onSubmitEditing={addNewTag}
          />
          <Button label="Add" size="sm" variant="secondary" onPress={addNewTag} />
        </View>
      </View>

      {onAddSubtask && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subtasks</Text>
          {subtasks.map((s) => (
            <SubtaskRow
              key={s.id}
              subtask={s}
              onToggle={() => onToggleSubtask?.(s.id)}
              onDelete={() => onDeleteSubtask?.(s.id)}
            />
          ))}
          <View style={styles.newTagRow}>
            <TextInput
              value={newSubtaskTitle}
              onChangeText={setNewSubtaskTitle}
              placeholder="Add a subtask"
              placeholderTextColor={colors.textTertiary}
              style={styles.newTagInput}
              onSubmitEditing={() => {
                if (!newSubtaskTitle.trim()) return;
                onAddSubtask(newSubtaskTitle.trim());
                setNewSubtaskTitle('');
              }}
            />
            <Button
              label="Add"
              size="sm"
              variant="secondary"
              onPress={() => {
                if (!newSubtaskTitle.trim()) return;
                onAddSubtask(newSubtaskTitle.trim());
                setNewSubtaskTitle('');
              }}
            />
          </View>
        </View>
      )}

      <Button label={submitLabel} onPress={submit} size="lg" style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

function withTime(date: Date, existing: number | null): number {
  const d = new Date(date);
  if (existing) {
    const e = new Date(existing);
    d.setHours(e.getHours(), e.getMinutes(), 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d.getTime();
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dueSummary: {
    ...typography.caption,
    color: colors.accent,
  },
  numberInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  newTagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  newTagInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
