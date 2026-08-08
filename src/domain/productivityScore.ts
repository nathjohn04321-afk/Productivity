import type { StatsPeriod, Task } from './models';
import { computeCoreMetrics, computePriorityBreakdown, computeStreaks, periodRange } from './stats';

/**
 * Productivity score (0-100): a weighted blend of completion rate, current
 * streak momentum, and follow-through on high-stakes (high/critical) tasks.
 * Weights: 55% completion rate, 20% streak, 25% high-priority completion.
 */
export function computeProductivityScore(
  tasks: Task[],
  period: StatsPeriod,
  reference = new Date()
): number {
  const metrics = computeCoreMetrics(tasks, period, reference);
  const streaks = computeStreaks(tasks);
  const breakdown = computePriorityBreakdown(tasks, periodRange(period, reference));

  const highStakes = breakdown.filter(
    (b) => b.priority === 'high' || b.priority === 'critical'
  );
  const highStakesTotal = highStakes.reduce((s, b) => s + b.total, 0);
  const highStakesCompleted = highStakes.reduce((s, b) => s + b.completed, 0);
  const highStakesRate =
    highStakesTotal > 0 ? highStakesCompleted / highStakesTotal : metrics.completionRate;

  const streakScore = Math.min(streaks.current / 14, 1);

  const score =
    metrics.completionRate * 55 + streakScore * 20 + highStakesRate * 25;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Steady';
  if (score >= 30) return 'Building';
  return 'Getting started';
}
