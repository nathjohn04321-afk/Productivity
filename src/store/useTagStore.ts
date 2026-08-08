import { create } from 'zustand';
import type { Tag } from '@/domain/models';
import * as tagRepo from '@/data/repositories/tagRepository';
import { chartPalette } from '@/theme/colors';

interface TagStoreState {
  tags: Tag[];
  hydrate: () => void;
  createTag: (name: string) => Tag;
}

export const useTagStore = create<TagStoreState>((set, get) => ({
  tags: [],

  hydrate: () => {
    set({ tags: tagRepo.listTags() });
  },

  createTag: (name: string) => {
    const color = chartPalette[get().tags.length % chartPalette.length];
    const tag = tagRepo.findOrCreateTag(name, color);
    set({ tags: tagRepo.listTags() });
    return tag;
  },
}));
