import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/useTaskStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { useGoalStore } from '@/store/useGoalStore';
import { colors, spacing, typography } from '@/theme';
import { Button, Card } from '@/components/ui';
import { exportData } from '@/utils/export';
import * as goalRepo from '@/data/repositories/goalRepository';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const journalEntries = useJournalStore((s) => s.entries);
  const pomodoroSessions = usePomodoroStore((s) => s.sessions);
  const todayGoal = useGoalStore((s) => s.todayGoal);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(format);
    try {
      await exportData(format, {
        tasks,
        journalEntries,
        pomodoroSessions,
        dailyGoals: [...goalRepo.listDailyGoals(), todayGoal],
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
    >
      <Text style={styles.pageTitle}>Settings</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Export your data</Text>
        <Text style={styles.cardBody}>
          Download every task, journal entry, and focus session stored on this device.
        </Text>
        <View style={styles.buttonRow}>
          <Button
            label="Export JSON"
            variant="secondary"
            loading={exporting === 'json'}
            onPress={() => handleExport('json')}
            style={{ flex: 1 }}
          />
          <Button
            label="Export CSV"
            variant="secondary"
            loading={exporting === 'csv'}
            onPress={() => handleExport('csv')}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>About your data</Text>
        <Text style={styles.cardBody}>
          FocusFlow stores everything locally on this device in a SQLite database — there is no
          server and no account. Your tasks, streaks, and journal entries persist across app
          restarts, background kills, and device reboots, and never leave your phone unless you
          export them.
        </Text>
      </Card>

      <Text style={styles.footer}>FocusFlow · v1.0.0</Text>
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
    gap: spacing.lg,
  },
  pageTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  card: {
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  footer: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
