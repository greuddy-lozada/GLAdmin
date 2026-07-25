import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VisitedTab {
  path: string;
  key: string;
}

interface TabsState {
  tabs: VisitedTab[];
  addTab: (tab: VisitedTab) => void;
  removeTab: (path: string) => void;
  clearTabs: () => void;
}

const MAX_TABS = 5;

export const useTabsStore = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [],
      addTab: (tab) =>
        set((state) => {
          if (state.tabs.some((t) => t.path === tab.path)) return state;
          const next = [...state.tabs, tab];
          if (next.length > MAX_TABS) next.shift();
          return { tabs: next };
        }),
      removeTab: (path) =>
        set((state) => ({
          tabs: state.tabs.filter((t) => t.path !== path),
        })),
      clearTabs: () => set({ tabs: [] }),
    }),
    {
      name: 'visited-tabs-storage',
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) return { tabs: [] };
        return persisted as TabsState;
      },
      partialize: (state) => ({ tabs: state.tabs }),
    },
  ),
);
