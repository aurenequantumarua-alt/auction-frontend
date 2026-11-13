import { api } from '@/lib/api';

export interface ShillAlert {
  auctionId: string;
  auctionTitle: string;
  auctionStatus: string;
  seller: { name: string; email: string } | null;
  sharedIp: string;
  bidders: { id: string; name: string; email: string }[];
  bidCount: number;
  sellerIsBidder: boolean;
  severity: 'CRITICAL' | 'WARNING';
}

export interface PlatformProfitSummary {
  totalProfitFormatted: string;
  totalProfit: number;
  completedCount: number;
  pendingEscrowProfit: number;
  pendingEscrowProfitFormatted: string;
  pendingEscrowCount: number;
  adminWalletBalance: number;
  adminWalletBalanceFormatted: string;
  adminUserId: string;
}

export interface AdminWithdrawal {
  id: string;
  amount: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  provider: string;
  externalRef: string | null;
  failureReason: string | null;
  bankLast4: string;
  requestedAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  destinationDetails:
    | {
        type: 'UPI';
        upiId: string | null;
        name: string;
      }
    | {
        type: 'BANK';
        accountHolderName: string;
        accountNumber: string | null;
        ifsc: string | null;
        bankName: string | null;
      }
    | null;
}

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
  getPlatformProfit: async (): Promise<PlatformProfitSummary> => {
    const { data } = await api.get<PlatformProfitSummary>('/admin/platform-profit');
    return data;
  },
  getWithdrawals: async (status?: string): Promise<AdminWithdrawal[]> => {
    const params = status && status !== 'ALL' ? { status } : undefined;
    const { data } = await api.get<{ items: AdminWithdrawal[] }>('/admin/withdrawals', { params });
    return data.items;
  },
  completeWithdrawal: async (id: string, externalRef: string): Promise<AdminWithdrawal> => {
    const { data } = await api.post<{ item: AdminWithdrawal }>(`/admin/withdrawals/${id}/complete`, {
      externalRef,
    });
    return data.item;
  },
  rejectWithdrawal: async (id: string, reason: string): Promise<AdminWithdrawal> => {
    const { data } = await api.post<{ item: AdminWithdrawal }>(`/admin/withdrawals/${id}/reject`, {
      reason,
    });
    return data.item;
  },
  getShillAlerts: async () => {
    const { data } = await api.get<{ alerts: ShillAlert[]; count: number }>('/admin/shill-alerts');
    return data;
  },
};
