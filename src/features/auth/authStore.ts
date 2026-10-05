import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrating: boolean;
  setSession: (s: { user: AuthUser; accessToken: string; refreshToken?: string }) => void;
  clear: () => void;
  setHydrating: (v: boolean) => void;
  logout: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrating: true,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          // Keep existing refreshToken if the new one is undefined (e.g. on
          // partial updates that don't rotate the refresh token).
          refreshToken: refreshToken ?? get().refreshToken,
          hydrating: false,
        }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null, hydrating: false }),
      setHydrating: (v) => set({ hydrating: v }),
      logout: async () => {
        const rt = get().refreshToken;
        try {
          await axios.post(
            `${API_BASE}/auth/logout`,
            { refreshToken: rt },
            { withCredentials: true },
          );
        } catch {
          // ignore
        } finally {
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'aurene-auth',
      // Persist user, accessToken AND refreshToken so page refreshes don't
      // lose the session. The refreshToken in localStorage is the fallback
      // for browsers that block cross-origin cookies.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrating(false);
      },
    },
  ),
);
