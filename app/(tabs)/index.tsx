import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/useTaskStore';
import { useTagStore } from '@/store/useTagStore';
import { colors, spacing, typography } from '@/theme';
import { FilterBar } from '@/components/tasks/FilterBar';
import { TaskList } from '@/components/tasks/TaskList';
import { QuickAddBar } from '@/components/tasks/QuickAddBar';
import { EmptyState } from '@/components/ui';
import { TaskCardSkeleton } from '@/components/ui/Skeleton';
import { addDays } from '@/utils/date';

const FILTER_EMPTY_COPY: Record<string, { icon: string; title: string; body: string }> = {
  today: {
    icon: '🌤️',
    title: 'Nothing due today',
    body: 'Enjoy the calm, or add something to get ahead.',
  },
  upcoming: {
    icon: '📅',
    title: 'No upcoming tasks',
    body: 'Plan ahead by adding a task with a future due date.',
  },
  overdue: {
    icon: '🎉',
    title: "You're all caught up",
    body: 'No overdue tasks — nice work.',
  },
  completed: {
    icon: '✅',
    title: 'No completed tasks yet',
    body: 'Finished tasks will show up here.',
  },
  all: {
    icon: '📝',
    title: 'No tasks yet',
    body: 'Tap the input below to add your first task.',
  },
};

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isLoading = useTaskStore((s) => s.isLoading);
  const filter = useTaskStore((s) => s.filter);
  const sort = useTaskStore((s) => s.sort);
  const activeTagId = useTaskStore((s) => s.activeTagId);
  const activePriority = useTaskStore((s) => s.activePriority);
  const setFilter = useTaskStore((s) => s.setFilter);
  const setSort = useTaskStore((s) => s.setSort);
  const setActiveTag = useTaskStore((s) => s.setActiveTag);
  const setActivePriority = useTaskStore((s) => s.setActivePriority);
  const addTask = useTaskStore((s) => s.addTask);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const removeTask = useTaskStore((s) => s.removeTask);
  const reschedule = useTaskStore((s) => s.reschedule);
  const reorder = useTaskStore((s) => s.reorder);
  const tasks = useTaskStore((s) => s.tasks);

  const tags = useTagStore((s) => s.tags);

  const visibleTasks = useTaskStore((s) => s.visibleTasks());
  const emptyCopy = FILTER_EMPTY_COPY[filter] ?? FILTER_EMPTY_COPY.all;
  const draggable = filter !== 'completed' && sort === 'manual';

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>FocusFlow</Text>
          <Text style={styles.subtitle}>{visibleTasks.length} tasks</Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
          hitSlop={8}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        tags={tags}
        activeTagId={activeTagId}
        onTagChange={setActiveTag}
        activePriority={activePriority}
        onPriorityChange={setActivePriority}
      />

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </>
        ) : visibleTasks.length === 0 ? (
          <EmptyState icon={emptyCopy.icon} title={emptyCopy.title} body={emptyCopy.body} />
        ) : (
          <TaskList
            tasks={visibleTasks}
            draggable={draggable}
            onToggleComplete={toggleComplete}
            onDelete={removeTask}
            onReschedule={(id) => {
              const task = tasks.find((t) => t.id === id);
              const base = task?.dueAt ? new Date(task.dueAt) : new Date();
              reschedule(id, addDays(base, 1).getTime());
            }}
            onReorder={reorder}
          />
        )}
      </ScrollView>

      <View style={[styles.quickAdd, { bottom: insets.bottom + spacing.md }]}>
        <QuickAddBar
          onSubmit={(title) => addTask({ title })}
          onExpand={() => router.push('/task/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  list: {
    flex: 1,
    marginTop: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  quickAdd: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
});
