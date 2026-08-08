import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJournalStore } from '@/store/useJournalStore';
import { colors, radius, spacing, typography } from '@/theme';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { Card, EmptyState } from '@/components/ui';
import { addDays, formatMonthDay, todayKey, toDateKey } from '@/utils/date';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateKey = toDateKey(selectedDate);
  const isToday = dateKey === todayKey();

  const entries = useJournalStore((s) => s.entries);
  const save = useJournalStore((s) => s.save);
  const entry = useMemo(() => entries.find((e) => e.date === dateKey), [entries, dateKey]);

  const pastEntries = useMemo(
    () => entries.filter((e) => e.date !== dateKey && e.content.trim().length > 0).slice(0, 10),
    [entries, dateKey]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Journal</Text>

      <View style={styles.dateNav}>
        <Pressable
          onPress={() => setSelectedDate((d) => addDays(d, -1))}
          style={styles.navButton}
          hitSlop={8}
        >
          <Text style={styles.navIcon}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{isToday ? 'Today' : formatMonthDay(dateKey)}</Text>
        <Pressable
          onPress={() => setSelectedDate((d) => addDays(d, 1))}
          style={styles.navButton}
          hitSlop={8}
          disabled={isToday}
        >
          <Text style={[styles.navIcon, isToday && styles.navIconDisabled]}>›</Text>
        </Pressable>
      </View>

      <Card>
        <JournalEditor
          content={entry?.content ?? ''}
          mood={entry?.mood ?? null}
          onSave={(content, mood) => save(dateKey, content, mood)}
        />
      </Card>

      <View style={styles.pastSection}>
        <Text style={styles.sectionTitle}>Past entries</Text>
        {pastEntries.length === 0 ? (
          <EmptyState icon="📓" title="No entries yet" body="Your reflections will appear here." />
        ) : (
          pastEntries.map((e) => (
            <Pressable
              key={e.date}
              onPress={() => setSelectedDate(new Date(`${e.date}T00:00:00`))}
            >
              <Card style={styles.pastCard}>
                <Text style={styles.pastDate}>{formatMonthDay(e.date)}</Text>
                <Text style={styles.pastContent} numberOfLines={2}>
                  {e.content}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  navIconDisabled: {
    color: colors.textDisabled,
  },
  dateLabel: {
    ...typography.h3,
    color: colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },
  pastSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  pastCard: {
    gap: spacing.xs,
  },
  pastDate: {
    ...typography.captionStrong,
    color: colors.textTertiary,
  },
  pastContent: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
