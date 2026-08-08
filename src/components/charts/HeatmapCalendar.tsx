import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { HeatmapCell } from '@/domain/stats';
import { colors, spacing, typography } from '@/theme';

interface HeatmapCalendarProps {
  cells: HeatmapCell[];
  cellSize?: number;
}

function intensityColor(count: number, max: number): string {
  if (count === 0) return colors.surfaceElevated;
  const ratio = count / Math.max(1, max);
  if (ratio > 0.75) return colors.accent;
  if (ratio > 0.5) return `${colors.accent}CC`;
  if (ratio > 0.25) return `${colors.accent}80`;
  return `${colors.accent}40`;
}

export function HeatmapCalendar({ cells, cellSize = 13 }: HeatmapCalendarProps) {
  const max = Math.max(1, ...cells.map((c) => c.count));

  // Pad the front so the first column starts on Sunday.
  const firstDate = cells[0] ? new Date(`${cells[0].dateKey}T00:00:00`) : new Date();
  const leadingBlanks = firstDate.getDay();
  const padded: (HeatmapCell | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...cells,
  ];

  const columns: (HeatmapCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {columns.map((col, colIdx) => (
            <View key={colIdx} style={styles.column}>
              {col.map((cell, rowIdx) => (
                <View
                  key={rowIdx}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cell ? intensityColor(cell.count, max) : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => (
          <View
            key={idx}
            style={[
              styles.legendSwatch,
              { backgroundColor: r === 0 ? colors.surfaceElevated : intensityColor(Math.ceil(r * max), max) },
            ]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 3,
  },
  column: {
    gap: 3,
  },
  cell: {
    borderRadius: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  legendText: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'none',
    marginHorizontal: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
});
