import { create } from 'zustand';
import type { DailyGoal } from '@/domain/models';
import * as goalRepo from '@/data/repositories/goalRepository';
import { todayKey } from '@/utils/date';
import { haptics } from '@/utils/haptics';

interface GoalStoreState {
  todayGoal: DailyGoal;
  hydrate: () => void;
  setTargets: (targetTasks: number, targetFocusMinutes: number) => void;
}

export const useGoalStore = create<GoalStoreState>((set) => ({
  todayGoal: {
    date: todayKey(),
    targetTasks: goalRepo.DEFAULT_TARGET_TASKS,
    targetFocusMinutes: goalRepo.DEFAULT_TARGET_FOCUS_MINUTES,
  },

  hydrate: () => {
    set({ todayGoal: goalRepo.getDailyGoal(todayKey()) });
  },

  setTargets: (targetTasks, targetFocusMinutes) => {
    const goal = goalRepo.setDailyGoal(todayKey(), targetTasks, targetFocusMinutes);
    haptics.light();
    set({ todayGoal: goal });
  },
}));
