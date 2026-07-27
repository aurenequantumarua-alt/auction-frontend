import { api } from '@/lib/api';

export interface AppNotification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: async (): Promise<{ items: AppNotification[]; unread: number }> => {
    const { data } = await api.get<{ items: AppNotification[]; unread: number }>('/notifications');
    return data;
  },
  markRead: async (ids: string[]): Promise<void> => {
    await api.post('/notifications/read', { ids });
  },
  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },
};
