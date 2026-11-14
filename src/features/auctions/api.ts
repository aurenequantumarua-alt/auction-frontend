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
  sort?: 'newest' | 'ending_soon' | 'highest_bid' | 'most_bids';
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
  buyNowPrice?: string;
  startsAt: string;
  endsAt: string;
  tags: string[];
  provenance?: string;
  provenanceProofUrls?: string[];
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

  buyNow: async (id: string): Promise<AuctionListItem> => {
    const { data } = await api.post<AuctionListItem>(`/auctions/${id}/buy-now`);
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

  myBids: async (): Promise<{ items: { id: string; amount: string; status: string; isRunnerUp?: boolean; placedAt: string; auction: AuctionListItem }[] }> => {
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

// ---------------------------------------------------------------------------
// Auction Q&A / Inquiries
// ---------------------------------------------------------------------------

export interface Inquiry {
  id: string;
  auctionId: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  asker: { id: string; name: string; avatarUrl: string | null };
}

export const inquiriesApi = {
  list: async (auctionId: string): Promise<{ items: Inquiry[] }> => {
    const { data } = await api.get<{ items: Inquiry[] }>(`/auctions/${auctionId}/inquiries`);
    return data;
  },

  ask: async (auctionId: string, question: string): Promise<Inquiry> => {
    const { data } = await api.post<Inquiry>(`/auctions/${auctionId}/inquiries`, { question });
    return data;
  },

  answer: async (inquiryId: string, answer: string, imageUrl?: string): Promise<Inquiry> => {
    const { data } = await api.post<Inquiry>(`/inquiries/${inquiryId}/answer`, { answer, imageUrl });
    return data;
  },

  pin: async (inquiryId: string): Promise<Inquiry> => {
    const { data } = await api.post<Inquiry>(`/inquiries/${inquiryId}/pin`);
    return data;
  },
};
