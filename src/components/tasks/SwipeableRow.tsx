import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

const RIGHT_ACTIONS_WIDTH = 144;
const COMPLETE_THRESHOLD = 88;

interface SwipeableRowProps {
  children: React.ReactNode;
  onComplete: () => void;
  onDelete: () => void;
  onReschedule: () => void;
}

export function SwipeableRow({
  children,
  onComplete,
  onDelete,
  onReschedule,
}: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const hasTriggeredHaptic = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        const next = Math.max(
          -RIGHT_ACTIONS_WIDTH - 16,
          Math.min(gesture.dx, COMPLETE_THRESHOLD + 40)
        );
        currentX.current = next;
        translateX.setValue(next);

        const pastThreshold = next > COMPLETE_THRESHOLD;
        if (pastThreshold && !hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = true;
          haptics.light();
        } else if (!pastThreshold) {
          hasTriggeredHaptic.current = false;
        }
      },
      onPanResponderRelease: () => {
        if (currentX.current > COMPLETE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: 500,
            duration: 220,
            useNativeDriver: true,
          }).start();
          onComplete();
          return;
        }
        if (currentX.current < -RIGHT_ACTIONS_WIDTH / 2) {
          currentX.current = -RIGHT_ACTIONS_WIDTH;
          Animated.spring(translateX, {
            toValue: -RIGHT_ACTIONS_WIDTH,
            damping: 24,
            useNativeDriver: true,
          }).start();
        } else {
          currentX.current = 0;
          Animated.spring(translateX, { toValue: 0, damping: 24, useNativeDriver: true }).start();
        }
        hasTriggeredHaptic.current = false;
      },
    })
  ).current;

  const closeRow = () => {
    currentX.current = 0;
    Animated.spring(translateX, { toValue: 0, damping: 24, useNativeDriver: true }).start();
  };

  const completeHintOpacity = translateX.interpolate({
    inputRange: [0, COMPLETE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.completeHint, { opacity: completeHintOpacity }]}>
        <Text style={styles.completeHintText}>✓ Complete</Text>
      </Animated.View>

      <View style={styles.rightActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.teal }]}
          onPress={() => {
            haptics.light();
            onReschedule();
            closeRow();
          }}
        >
          <Text style={styles.actionText}>Reschedule</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.danger }]}
          onPress={() => {
            haptics.medium();
            onDelete();
          }}
        >
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>

      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionButton: {
    width: RIGHT_ACTIONS_WIDTH / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...typography.captionStrong,
    color: colors.black,
    textAlign: 'center',
  },
  completeHint: {
    position: 'absolute',
    left: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  completeHintText: {
    ...typography.bodyStrong,
    color: colors.success,
  },
});
