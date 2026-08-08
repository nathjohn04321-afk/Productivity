import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ elevated, padded = true, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        elevated && shadow.card,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  padded: {
    padding: spacing.lg,
  },
});
