import { create } from 'zustand';
import type { PomodoroSession } from '@/domain/models';
import * as pomodoroRepo from '@/data/repositories/pomodoroRepository';
import { haptics } from '@/utils/haptics';

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

const PHASE_MINUTES: Record<PomodoroPhase, number> = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

interface PomodoroStoreState {
  sessions: PomodoroSession[];
  phase: PomodoroPhase;
  isRunning: boolean;
  remainingSeconds: number;
  completedFocusCount: number;
  activeTaskId: string | null;

  hydrate: () => void;
  setActiveTask: (taskId: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  skip: () => void;
}

function secondsFor(phase: PomodoroPhase): number {
  return PHASE_MINUTES[phase] * 60;
}

export const usePomodoroStore = create<PomodoroStoreState>((set, get) => ({
  sessions: [],
  phase: 'focus',
  isRunning: false,
  remainingSeconds: secondsFor('focus'),
  completedFocusCount: 0,
  activeTaskId: null,

  hydrate: () => {
    set({ sessions: pomodoroRepo.listPomodoroSessions() });
  },

  setActiveTask: (taskId) => set({ activeTaskId: taskId }),

  start: () => {
    haptics.medium();
    set({ isRunning: true });
  },

  pause: () => {
    haptics.light();
    set({ isRunning: false });
  },

  reset: () => {
    const { phase } = get();
    set({ isRunning: false, remainingSeconds: secondsFor(phase) });
  },

  skip: () => {
    finishPhase(set, get, false);
  },

  tick: () => {
    const { remainingSeconds } = get();
    if (remainingSeconds <= 1) {
      finishPhase(set, get, true);
      return;
    }
    set({ remainingSeconds: remainingSeconds - 1 });
  },
}));

function finishPhase(
  set: (partial: Partial<PomodoroStoreState>) => void,
  get: () => PomodoroStoreState,
  completed: boolean
) {
  const { phase, activeTaskId, completedFocusCount } = get();

  if (phase === 'focus') {
    pomodoroRepo.logPomodoroSession(activeTaskId, PHASE_MINUTES.focus, completed);
    haptics.success();
  }

  const nextFocusCount = phase === 'focus' ? completedFocusCount + 1 : completedFocusCount;
  const nextPhase: PomodoroPhase =
    phase !== 'focus' ? 'focus' : nextFocusCount % 4 === 0 ? 'longBreak' : 'shortBreak';

  set({
    phase: nextPhase,
    remainingSeconds: secondsFor(nextPhase),
    isRunning: false,
    completedFocusCount: nextFocusCount,
    sessions: pomodoroRepo.listPomodoroSessions(),
  });
}

export function pomodoroPhaseMinutes(phase: PomodoroPhase): number {
  return PHASE_MINUTES[phase];
}
