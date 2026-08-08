import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/useTaskStore';
import { useGoalStore } from '@/store/useGoalStore';
import { usePomodoroStore, pomodoroPhaseMinutes } from '@/store/usePomodoroStore';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Card, Chip, TextField } from '@/components/ui';
import { PomodoroRing } from '@/components/focus/PomodoroRing';
import { dateKeyFromTimestamp, todayKey } from '@/utils/date';

const PHASE_COLORS = {
  focus: colors.accent,
  shortBreak: colors.teal,
  longBreak: colors.info,
} as const;

const PHASE_LABELS = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
} as const;

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const tasks = useTaskStore((s) => s.tasks);

  const todayGoal = useGoalStore((s) => s.todayGoal);
  const setTargets = useGoalStore((s) => s.setTargets);
  const [targetTasksInput, setTargetTasksInput] = useState(String(todayGoal.targetTasks));
  const [targetMinutesInput, setTargetMinutesInput] = useState(
    String(todayGoal.targetFocusMinutes)
  );

  const phase = usePomodoroStore((s) => s.phase);
  const isRunning = usePomodoroStore((s) => s.isRunning);
  const remainingSeconds = usePomodoroStore((s) => s.remainingSeconds);
  const completedFocusCount = usePomodoroStore((s) => s.completedFocusCount);
  const activeTaskId = usePomodoroStore((s) => s.activeTaskId);
  const setActiveTask = usePomodoroStore((s) => s.setActiveTask);
  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skip = usePomodoroStore((s) => s.skip);
  const sessions = usePomodoroStore((s) => s.sessions);

  const todaysCompletedTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.completedAt !== null && dateKeyFromTimestamp(t.completedAt) === todayKey()
      ).length,
    [tasks]
  );

  const todaysFocusMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.completed && dateKeyFromTimestamp(s.startedAt) === todayKey())
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions]
  );

  const candidateTasks = useMemo(
    () => tasks.filter((t) => t.status === 'active' && t.recurrence === null).slice(0, 8),
    [tasks]
  );

  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  const totalSecondsForPhase = pomodoroPhaseMinutes(phase) * 60;
  const progress = 1 - remainingSeconds / totalSecondsForPhase;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Focus</Text>

      <Card style={styles.goalsCard}>
        <Text style={styles.cardTitle}>Today's goals</Text>
        <View style={styles.goalRow}>
          <ProgressBar
            label="Tasks"
            current={todaysCompletedTasks}
            target={todayGoal.targetTasks}
            color={colors.accent}
          />
        </View>
        <View style={styles.goalRow}>
          <ProgressBar
            label="Focus minutes"
            current={todaysFocusMinutes}
            target={todayGoal.targetFocusMinutes}
            color={colors.teal}
          />
        </View>
        <View style={styles.goalInputs}>
          <View style={styles.goalInputField}>
            <TextField
              label="Target tasks"
              keyboardType="number-pad"
              value={targetTasksInput}
              onChangeText={(v) => setTargetTasksInput(v.replace(/[^0-9]/g, ''))}
            />
          </View>
          <View style={styles.goalInputField}>
            <TextField
              label="Target minutes"
              keyboardType="number-pad"
              value={targetMinutesInput}
              onChangeText={(v) => setTargetMinutesInput(v.replace(/[^0-9]/g, ''))}
            />
          </View>
        </View>
        <Button
          label="Save goals"
          variant="secondary"
          size="sm"
          onPress={() =>
            setTargets(Number(targetTasksInput) || 0, Number(targetMinutesInput) || 0)
          }
        />
      </Card>

      <Card style={styles.timerCard}>
        <Text style={styles.cardTitle}>Pomodoro timer</Text>
        <View style={styles.ringWrapper}>
          <PomodoroRing
            progress={Math.max(0, Math.min(1, progress))}
            color={PHASE_COLORS[phase]}
            timeLabel={`${minutes}:${seconds}`}
            phaseLabel={PHASE_LABELS[phase]}
          />
        </View>

        <Text style={styles.sessionCount}>
          {completedFocusCount} focus session{completedFocusCount === 1 ? '' : 's'} today
        </Text>

        {candidateTasks.length > 0 && (
          <View style={styles.taskPicker}>
            <Text style={styles.taskPickerLabel}>Focusing on</Text>
            <View style={styles.chipRow}>
              <Chip
                label="No task"
                active={activeTaskId === null}
                onPress={() => setActiveTask(null)}
              />
              {candidateTasks.map((t) => (
                <Chip
                  key={t.id}
                  label={t.title}
                  active={activeTaskId === t.id}
                  onPress={() => setActiveTask(t.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.controls}>
          <Button
            label={isRunning ? 'Pause' : 'Start'}
            onPress={isRunning ? pause : start}
            size="lg"
            style={{ flex: 1 }}
          />
          <Button label="Reset" variant="secondary" onPress={reset} />
          <Button label="Skip" variant="ghost" onPress={skip} />
        </View>
      </Card>
    </ScrollView>
  );
}

function ProgressBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <View style={{ gap: spacing.xs, flex: 1 }}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {current} / {target}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${ratio * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
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
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  goalsCard: {
    gap: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
  },
  goalInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  goalInputField: {
    flex: 1,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  timerCard: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  ringWrapper: {
    marginVertical: spacing.md,
  },
  sessionCount: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  taskPicker: {
    width: '100%',
    gap: spacing.sm,
  },
  taskPickerLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
});
