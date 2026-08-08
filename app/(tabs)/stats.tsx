import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/useTaskStore';
import type { StatsPeriod } from '@/domain/models';
import {
  computeCoreMetrics,
  computeHeatmap,
  computePriorityBreakdown,
  computeStreaks,
  computeTagDistribution,
  computeTrend,
  generateInsights,
  periodRange,
} from '@/domain/stats';
import { computeProductivityScore, scoreLabel } from '@/domain/productivityScore';
import { colors, spacing, typography } from '@/theme';
import { SegmentedControl } from '@/components/ui';
import { StatCard } from '@/components/charts/StatCard';
import { TrendChart } from '@/components/charts/TrendChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar';
import { InsightCard } from '@/components/charts/InsightCard';

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All-time' },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const tasks = useTaskStore((s) => s.tasks);
  const [period, setPeriod] = useState<StatsPeriod>('week');

  const metrics = useMemo(() => computeCoreMetrics(tasks, period), [tasks, period]);
  const streaks = useMemo(() => computeStreaks(tasks), [tasks]);
  const score = useMemo(() => computeProductivityScore(tasks, period), [tasks, period]);
  const trend = useMemo(() => computeTrend(tasks, period), [tasks, period]);
  const priorityBreakdown = useMemo(
    () => computePriorityBreakdown(tasks, period === 'all' ? undefined : periodRange(period)),
    [tasks, period]
  );
  const tagDistribution = useMemo(
    () => computeTagDistribution(tasks, period === 'all' ? undefined : periodRange(period)),
    [tasks, period]
  );
  const heatmap = useMemo(() => computeHeatmap(tasks), [tasks]);
  const insights = useMemo(() => generateInsights(tasks), [tasks]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Performance</Text>

      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Productivity score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
        <Text style={styles.scoreTag}>{scoreLabel(score)}</Text>
      </View>

      <View style={styles.statGrid}>
        <StatCard label="Completed" value={String(metrics.tasksCompleted)} />
        <StatCard
          label="Completion rate"
          value={`${Math.round(metrics.completionRate * 100)}%`}
          accentColor={colors.teal}
        />
        <StatCard label="Avg / day" value={metrics.avgTasksPerDay.toFixed(1)} />
        <StatCard
          label="Streak"
          value={`${streaks.current}d`}
          caption={`Longest: ${streaks.longest}d`}
          accentColor={colors.warning}
        />
      </View>

      <Section title="Completion trend">
        <TrendChart data={trend} />
      </Section>

      <Section title="Priority breakdown">
        <DonutChart
          data={priorityBreakdown.map((b) => ({
            label: `${capitalize(b.priority)} (${Math.round(b.rate * 100)}%)`,
            value: b.total,
            color: b.color,
          }))}
          centerValue={String(priorityBreakdown.reduce((s, b) => s + b.total, 0))}
          centerLabel="tasks"
        />
      </Section>

      {tagDistribution.length > 0 && (
        <Section title="Tag distribution">
          <DonutChart
            data={tagDistribution.map((t) => ({
              label: t.tag.name,
              value: t.count,
              color: t.color,
            }))}
            centerValue={String(tagDistribution.reduce((s, t) => s + t.count, 0))}
            centerLabel="tagged"
          />
        </Section>
      )}

      <Section title="Activity heatmap">
        <HeatmapCalendar cells={heatmap} />
      </Section>

      {insights.length > 0 && (
        <Section title="Insights">
          <View style={{ gap: spacing.md }}>
            {insights.map((insight) => (
              <InsightCard key={insight.id} {...insight} />
            ))}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  scoreCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -1,
  },
  scoreTag: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
});
