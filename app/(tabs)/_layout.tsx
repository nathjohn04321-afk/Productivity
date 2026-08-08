import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, Slot, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

const TABS = [
  { href: '/', icon: '✓', label: 'Tasks' },
  { href: '/stats', icon: '📊', label: 'Stats' },
  { href: '/focus', icon: '⏱', label: 'Focus' },
  { href: '/journal', icon: '📓', label: 'Journal' },
] as const;

export default function TabsLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <View
        style={[
          styles.tabBar,
          { paddingBottom: insets.bottom + spacing.sm, height: 62 + insets.bottom },
        ]}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} asChild replace>
              <Pressable
                onPress={() => haptics.selection()}
                style={styles.tabButton}
                hitSlop={4}
              >
                <Text style={[styles.icon, { opacity: active ? 1 : 0.5 }]}>{tab.icon}</Text>
                <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
              </Pressable>
            </Link>
          );
        })}
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
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    ...typography.micro,
    color: colors.textTertiary,
    textTransform: 'none',
  },
  labelActive: {
    color: colors.accent,
  },
});
