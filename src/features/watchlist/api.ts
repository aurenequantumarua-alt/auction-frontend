import { api } from '@/lib/api';
import type { AuctionListItem } from '@/features/auctions/types';

export interface WatchlistItem {
  userId: string;
  auctionId: string;
  createdAt: string;
  auction: AuctionListItem;
}

export const watchlistApi = {
  list: async (): Promise<{ items: WatchlistItem[] }> => {
    const { data } = await api.get<{ items: WatchlistItem[] }>('/watchlist');
    return data;
  },
};
