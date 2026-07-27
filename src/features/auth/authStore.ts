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
  hydrating: boolean;
  setSession: (s: { user: AuthUser; accessToken: string }) => void;
  clear: () => void;
  setHydrating: (v: boolean) => void;
  logout: () => Promise<void>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrating: true,
      setSession: ({ user, accessToken }) => set({ user, accessToken, hydrating: false }),
      clear: () => set({ user: null, accessToken: null, hydrating: false }),
      setHydrating: (v) => set({ hydrating: v }),
      logout: async () => {
        try {
          await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
        } catch {
          // ignore
        } finally {
          set({ user: null, accessToken: null });
        }
      },
    }),
    {
      name: 'aurene-auth',
      // Persist both user AND accessToken so page refreshes don't lose the session.
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrating(false);
      },
    },
  ),
);
