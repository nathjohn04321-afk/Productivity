import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { TrendBucket } from '@/domain/stats';
import { colors, radius, spacing, typography } from '@/theme';

interface TrendChartProps {
  data: TrendBucket[];
  height?: number;
}

export function TrendChart({ data, height = 140 }: TrendChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barGap = 6;
  const showEveryLabel = data.length <= 14;

  return (
    <View>
      <View style={[styles.chartRow, { height }]}>
        {data.map((bucket, idx) => {
          const barHeight = Math.max(4, (bucket.value / max) * (height - 24));
          return (
            <View key={idx} style={[styles.barColumn, { marginHorizontal: barGap / 2 }]}>
              <View style={styles.barTrack}>
                <Svg width="100%" height={barHeight}>
                  <Defs>
                    <LinearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={colors.accent} stopOpacity={1} />
                      <Stop offset="1" stopColor={colors.teal} stopOpacity={0.85} />
                    </LinearGradient>
                  </Defs>
                  <Rect
                    x="0"
                    y="0"
                    width="100%"
                    height={barHeight}
                    rx={6}
                    fill={bucket.value > 0 ? `url(#grad-${idx})` : colors.surfaceHigh}
                  />
                </Svg>
              </View>
              {(showEveryLabel || idx % Math.ceil(data.length / 7) === 0) && (
                <Text style={styles.label} numberOfLines={1}>
                  {bucket.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  label: {
    ...typography.micro,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textTransform: 'none',
  },
});
