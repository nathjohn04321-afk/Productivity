import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { Task } from '@/domain/models';
import { colors, radius, spacing } from '@/theme';
import { haptics } from '@/utils/haptics';
import { TaskCard } from './TaskCard';
import { SwipeableRow } from './SwipeableRow';

const ROW_HEIGHT = 96;

interface TaskListProps {
  tasks: Task[];
  draggable: boolean;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function TaskList({
  tasks,
  draggable,
  onToggleComplete,
  onDelete,
  onReschedule,
  onReorder,
}: TaskListProps) {
  const [order, setOrder] = useState(tasks.map((t) => t.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (draggingId) return;
    const incoming = tasks.map((t) => t.id);
    const sameSet =
      incoming.length === order.length && incoming.every((id) => order.includes(id));
    if (!sameSet) setOrder(incoming);
  }, [tasks, draggingId, order]);

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const activeOrder = draggable ? order : tasks.map((t) => t.id);

  const commitReorder = (nextOrder: string[]) => {
    setOrder(nextOrder);
    onReorder(nextOrder);
    setDraggingId(null);
  };

  return (
    <View>
      {activeOrder.map((id) => {
        const task = byId.get(id);
        if (!task) return null;
        return (
          <Animated.View
            key={id}
            layout={draggingId === id ? undefined : LinearTransition.duration(180)}
          >
            <SwipeableRow
              onComplete={() => onToggleComplete(id)}
              onDelete={() => onDelete(id)}
              onReschedule={() => onReschedule(id)}
            >
              {draggable ? (
                <DraggableCard
                  task={task}
                  order={order}
                  isDragging={draggingId === id}
                  onDragStart={() => {
                    haptics.medium();
                    setDraggingId(id);
                  }}
                  onDragMove={(newIndex) => {
                    setOrder((prev) => {
                      const currentIndex = prev.indexOf(id);
                      if (currentIndex === -1 || currentIndex === newIndex) return prev;
                      const next = [...prev];
                      next.splice(currentIndex, 1);
                      next.splice(newIndex, 0, id);
                      return next;
                    });
                  }}
                  onDragEnd={() => commitReorder(order)}
                  onToggleComplete={() => onToggleComplete(id)}
                />
              ) : (
                <TaskCard task={task} onToggleComplete={() => onToggleComplete(id)} />
              )}
            </SwipeableRow>
          </Animated.View>
        );
      })}
    </View>
  );
}

interface DraggableCardProps {
  task: Task;
  order: string[];
  isDragging: boolean;
  onDragStart: () => void;
  onDragMove: (newIndex: number) => void;
  onDragEnd: () => void;
  onToggleComplete: () => void;
}

function DraggableCard({
  task,
  order,
  isDragging,
  onDragStart,
  onDragMove,
  onDragEnd,
  onToggleComplete,
}: DraggableCardProps) {
  const translateY = useSharedValue(0);

  const startDrag = () => onDragStart();
  const moveDrag = (newIndex: number) => onDragMove(newIndex);
  const endDrag = () => {
    translateY.value = 0;
    onDragEnd();
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      runOnJS(startDrag)();
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
      const currentIndex = order.indexOf(task.id);
      const proposedIndex = Math.max(
        0,
        Math.min(order.length - 1, currentIndex + Math.round(e.translationY / ROW_HEIGHT))
      );
      if (proposedIndex !== currentIndex) {
        runOnJS(moveDrag)(proposedIndex);
      }
    })
    .onEnd(() => {
      runOnJS(endDrag)();
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: isDragging ? translateY.value : 0 }],
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.94 : 1,
  }));

  return (
    <Animated.View style={style}>
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        dragHandle={
          <GestureDetector gesture={pan}>
            <Pressable style={styles.handle} hitSlop={10}>
              <Text style={styles.handleIcon}>≡</Text>
            </Pressable>
          </GestureDetector>
        }
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  handleIcon: {
    fontSize: 18,
    color: colors.textTertiary,
  },
});
