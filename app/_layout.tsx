import React, { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from '@/data/db/migrations';
import { useTaskStore } from '@/store/useTaskStore';
import { useTagStore } from '@/store/useTagStore';
import { useJournalStore } from '@/store/useJournalStore';
import { usePomodoroStore } from '@/store/usePomodoroStore';
import { useGoalStore } from '@/store/useGoalStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  const hydrateTasks = useTaskStore((s) => s.hydrate);
  const hydrateTags = useTagStore((s) => s.hydrate);
  const hydrateJournal = useJournalStore((s) => s.hydrate);
  const hydratePomodoro = usePomodoroStore((s) => s.hydrate);
  const hydrateGoals = useGoalStore((s) => s.hydrate);

  useEffect(() => {
    try {
      runMigrations();
      hydrateTags();
      hydrateTasks();
      hydrateJournal();
      hydratePomodoro();
      hydrateGoals();
    } finally {
      setIsReady(true);
    }
  }, [hydrateTasks, hydrateTags, hydrateJournal, hydratePomodoro, hydrateGoals]);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="task/new"
            options={{
              headerShown: true,
              presentation: 'modal',
              title: 'New Task',
              headerStyle: { backgroundColor: colors.bgElevated },
              headerTintColor: colors.textPrimary,
            }}
          />
          <Stack.Screen
            name="task/[id]"
            options={{
              headerShown: true,
              presentation: 'modal',
              title: 'Edit Task',
              headerStyle: { backgroundColor: colors.bgElevated },
              headerTintColor: colors.textPrimary,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              presentation: 'modal',
              title: 'Settings',
              headerStyle: { backgroundColor: colors.bgElevated },
              headerTintColor: colors.textPrimary,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
