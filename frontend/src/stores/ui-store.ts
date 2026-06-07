import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  lastVisitedPath: string;
  setLastVisitedPath: (path: string) => void;
  clearLastVisitedPath: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      lastVisitedPath: '/dashboard',
      setLastVisitedPath: (path) => set({ lastVisitedPath: path }),
      clearLastVisitedPath: () => set({ lastVisitedPath: '/dashboard' }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ lastVisitedPath: state.lastVisitedPath }),
    },
  ),
);
