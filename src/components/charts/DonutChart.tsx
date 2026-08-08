import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing, typography } from '@/theme';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} originX={size / 2} originY={size / 2}>
            {total === 0 ? (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.surfaceHigh}
                strokeWidth={strokeWidth}
                fill="none"
              />
            ) : (
              data
                .filter((d) => d.value > 0)
                .map((segment, idx) => {
                  const fraction = segment.value / total;
                  const segmentLength = fraction * circumference;
                  const dashArray = `${segmentLength} ${circumference - segmentLength}`;
                  const dashOffset = -cumulative;
                  cumulative += segmentLength;
                  return (
                    <Circle
                      key={idx}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={segment.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      fill="none"
                    />
                  );
                })
            )}
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
          {centerValue && <Text style={styles.centerValue}>{centerValue}</Text>}
          {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((segment, idx) => (
          <View key={idx} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendLabel}>{segment.label}</Text>
            <Text style={styles.legendValue}>{segment.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  centerLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
});
