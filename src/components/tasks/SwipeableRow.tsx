import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue<number | null>(null);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => haptics.light();
  const triggerComplete = () => onComplete();

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      const next = e.translationX;
      translateX.value = Math.max(
        -RIGHT_ACTIONS_WIDTH - 16,
        Math.min(next, COMPLETE_THRESHOLD + 40)
      );
      const pastThreshold = translateX.value > COMPLETE_THRESHOLD;
      if (pastThreshold && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (!pastThreshold) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd(() => {
      if (translateX.value > COMPLETE_THRESHOLD) {
        translateX.value = withTiming(500, { duration: 220 });
        runOnJS(triggerComplete)();
        return;
      }
      if (translateX.value < -RIGHT_ACTIONS_WIDTH / 2) {
        translateX.value = withSpring(-RIGHT_ACTIONS_WIDTH, { damping: 24 });
      } else {
        translateX.value = withSpring(0, { damping: 24 });
      }
    });

  const closeRow = () => {
    translateX.value = withSpring(0, { damping: 24 });
  };

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const completeHintStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(translateX.value / COMPLETE_THRESHOLD, 0), 1),
  }));

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => {
        rowHeight.value = e.nativeEvent.layout.height;
      }}
    >
      <Animated.View style={[styles.completeHint, completeHintStyle]}>
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

      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
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
