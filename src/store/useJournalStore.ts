import { create } from 'zustand';
import type { JournalEntry } from '@/domain/models';
import * as journalRepo from '@/data/repositories/journalRepository';
import { haptics } from '@/utils/haptics';

interface JournalStoreState {
  entries: JournalEntry[];
  isLoading: boolean;
  hydrate: () => void;
  save: (date: string, content: string, mood: number | null) => void;
  entryFor: (date: string) => JournalEntry | null;
}

export const useJournalStore = create<JournalStoreState>((set, get) => ({
  entries: [],
  isLoading: true,

  hydrate: () => {
    set({ entries: journalRepo.listJournalEntries(), isLoading: false });
  },

  save: (date, content, mood) => {
    journalRepo.upsertJournalEntry(date, content, mood);
    haptics.light();
    set({ entries: journalRepo.listJournalEntries() });
  },

  entryFor: (date) => {
    return get().entries.find((e) => e.date === date) ?? null;
  },
}));
