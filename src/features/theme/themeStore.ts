import { create } from 'zustand';

interface ThemeState {
  isAntiqueMode: boolean;
  setAntiqueMode: (active: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isAntiqueMode: false,
  setAntiqueMode: (active: boolean) => set({ isAntiqueMode: active }),
}));

