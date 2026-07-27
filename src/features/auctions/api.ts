import { api } from '@/lib/api';
import type {
  AuctionDetail,
  AuctionListItem,
  AuctionPage,
  BidEntry,
} from './types';

export interface AuctionListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  brand?: string;
  condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  status?: 'UPCOMING' | 'LIVE' | 'ENDED' | 'SOLD';
  sort?: 'ending_soon' | 'newest' | 'highest_bid' | 'most_bids';
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateAuctionInput {
  title: string;
  description: string;
  category: string;
  brand: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  size: string;
  basePrice: string;
  minIncrement: string;
  startsAt: string;
  endsAt: string;
  tags: string[];
  images: { url: string; isCover?: boolean }[];
  publish: boolean;
}

export const auctionsApi = {
  list: async (query: AuctionListQuery): Promise<AuctionPage<AuctionListItem>> => {
    const { data } = await api.get<AuctionPage<AuctionListItem>>('/auctions', { params: query });
    return data;
  },

  detail: async (id: string): Promise<AuctionDetail> => {
    const { data } = await api.get<AuctionDetail>(`/auctions/${id}`);
    return data;
  },

  create: async (input: CreateAuctionInput): Promise<AuctionListItem> => {
    const { data } = await api.post<AuctionListItem>('/auctions', input);
    return data;
  },

  update: async (id: string, input: Partial<CreateAuctionInput>): Promise<AuctionListItem> => {
    const { data } = await api.patch<AuctionListItem>(`/auctions/${id}`, input);
    return data;
  },

  publish: async (id: string): Promise<AuctionListItem> => {
    const { data } = await api.post<AuctionListItem>(`/auctions/${id}/publish`);
    return data;
  },

  cancel: async (id: string): Promise<AuctionListItem> => {
    const { data } = await api.post<AuctionListItem>(`/auctions/${id}/cancel`);
    return data;
  },

  endNow: async (id: string): Promise<AuctionListItem> => {
    const { data } = await api.post<AuctionListItem>(`/auctions/${id}/end-now`);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/auctions/${id}`);
  },

  myListings: async (): Promise<{ items: AuctionListItem[] }> => {
    const { data } = await api.get<{ items: AuctionListItem[] }>('/auctions/me/listings');
    return data;
  },

  earnings: async (): Promise<{ soldCount: number; totalEarnings: string }> => {
    const { data } = await api.get('/auctions/me/earnings');
    return data;
  },

  myBids: async (): Promise<{ items: { id: string; amount: string; status: string; placedAt: string; auction: AuctionListItem }[] }> => {
    const { data } = await api.get('/auctions/me/bids');
    return data;
  },

  myWins: async (): Promise<{
    items: { id: string; amount: string; status: string; placedAt: string; auction: AuctionListItem & { settlement?: AuctionDetail['settlement'] } }[];
  }> => {
    const { data } = await api.get('/auctions/me/wins');
    return data;
  },

  bids: async (id: string): Promise<{ items: BidEntry[] }> => {
    const { data } = await api.get<{ items: BidEntry[] }>(`/auctions/${id}/bids`);
    return data;
  },

  placeBid: async (id: string, amount: string): Promise<{ id: string; amount: string; placedAt: string }> => {
    const { data } = await api.post(`/auctions/${id}/bids`, { amount });
    return data;
  },

  watch: async (id: string): Promise<void> => {
    await api.post(`/auctions/${id}/watch`);
  },

  unwatch: async (id: string): Promise<void> => {
    await api.delete(`/auctions/${id}/watch`);
  },

  report: async (id: string, reason: string, details: string): Promise<void> => {
    await api.post(`/auctions/${id}/report`, { reason, details });
  },
};
