import axios from 'axios';
import { api } from '@/lib/api';
import type { AuthUser } from './authStore';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export type LoginResult = AuthResponse | { requiresEmailVerification: true; email: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const authApi = {
  signup: async (input: { email: string; password: string; name: string }): Promise<LoginResult> => {
    const { data } = await api.post<LoginResult>('/auth/signup', input);
    return data;
  },

  login: async (input: { email: string; password: string }): Promise<LoginResult> => {
    const { data } = await api.post<LoginResult>('/auth/login', input);
    return data;
  },

  verifyEmail: async (input: { email: string; code: string }): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/verify-email', input);
    return data;
  },

  forgotPassword: async (input: { email: string }): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>('/auth/forgot-password', input);
    return data;
  },

  resetPassword: async (input: { email: string; code: string; newPassword: string }): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/reset-password', input);
    return data;
  },

  refresh: async (): Promise<AuthResponse | null> => {
    try {
      const { useAuthStore } = await import('./authStore');
      const rt = useAuthStore.getState().refreshToken;
      const { data } = await axios.post<AuthResponse>(
        `${API_BASE}/auth/refresh`,
        { refreshToken: rt ?? undefined },
        { withCredentials: true },
      );
      return data;
    } catch {
      return null;
    }
  },

  me: async (): Promise<{ user: AuthUser }> => {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me');
    return data;
  },
};
