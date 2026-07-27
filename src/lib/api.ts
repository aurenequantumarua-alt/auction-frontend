import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const data = res.data as { accessToken: string; user: unknown };
      useAuthStore.getState().setSession({
        accessToken: data.accessToken,
        user: data.user as never,
      });
      return data.accessToken;
    } catch {
      useAuthStore.getState().clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as AxiosRequestConfig & { _retried?: boolean };
    if (
      err.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes('/auth/')
    ) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api.request(original);
      }
    }
    return Promise.reject(err);
  },
);

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export const extractApiError = (err: unknown): ApiError => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: ApiError } | undefined;
    if (data?.error) return data.error;
    return {
      code: 'network_error',
      message: err.message || 'Network error',
    };
  }
  return { code: 'unknown', message: 'Something went wrong' };
};
