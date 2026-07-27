import { api } from '@/lib/api';

export const adminApi = {
  getAuctions: async () => {
    const { data } = await api.get('/admin/auctions');
    return data.items;
  },
  deleteAuction: async (id: string) => {
    await api.delete(`/admin/auctions/${id}`);
  },
  getReports: async (status?: string) => {
    const params = status && status !== 'ALL' ? { status } : undefined;
    const { data } = await api.get('/admin/reports', { params });
    return data.items;
  },
  updateReport: async (id: string, update: { status: string; adminNote?: string }) => {
    const { data } = await api.patch(`/admin/reports/${id}`, update);
    return data;
  },
};
