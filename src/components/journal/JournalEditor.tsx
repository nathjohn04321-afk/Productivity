import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

const MOODS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];

interface JournalEditorProps {
  content: string;
  mood: number | null;
  onSave: (content: string, mood: number | null) => void;
}

export function JournalEditor({ content, mood, onSave }: JournalEditorProps) {
  const [text, setText] = useState(content);
  const [selectedMood, setSelectedMood] = useState<number | null>(mood);

  useEffect(() => {
    setText(content);
    setSelectedMood(mood);
  }, [content, mood]);

  return (
    <View style={styles.container}>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <Pressable
            key={m.value}
            onPress={() => {
              haptics.selection();
              const next = selectedMood === m.value ? null : m.value;
              setSelectedMood(next);
              onSave(text, next);
            }}
            style={[
              styles.moodButton,
              selectedMood === m.value && styles.moodButtonActive,
            ]}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={() => onSave(text, selectedMood)}
        placeholder="How did today go? What are you proud of, what would you change?"
        placeholderTextColor={colors.textTertiary}
        multiline
        style={styles.textArea}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  moodEmoji: {
    fontSize: 22,
  },
  textArea: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 180,
  },
});
