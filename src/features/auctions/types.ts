export type AuctionStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'LIVE'
  | 'ENDED'
  | 'PAYMENT_PENDING'
  | 'SOLD'
  | 'EXPIRED'
  | 'CANCELLED';

export type AuctionCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

export interface AuctionImage {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface AuctionSeller {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface CurrentBidLite {
  id: string;
  amount: string;
  bidderId?: string;
  placedAt?: string;
}

export interface AuctionListItem {
  id: string;
  title: string;
  brand: string;
  category: string;
  condition: AuctionCondition;
  size: string;
  basePrice: string;
  minIncrement: string;
  buyNowPrice: string | null;
  startsAt: string;
  endsAt: string;
  status: AuctionStatus;
  tags: string[];
  bidCount: number;
  viewCount: number;
  images: AuctionImage[];
  currentBid: CurrentBidLite | null;
  seller: AuctionSeller;
  _count?: { bids: number; watchlist: number };
}

export interface AuctionDetail extends AuctionListItem {
  description: string;
  bids: BidEntry[];
  isWatched: boolean;
  settlement?: {
    id: string;
    status: 'AWAITING_PAYMENT' | 'PAID' | 'EXHAUSTED';
    paymentDeadline: string;
    currentWinnerBidId: string | null;
    attemptCount: number;
  } | null;
}

export interface BidEntry {
  id: string;
  amount: string;
  status: 'ACTIVE' | 'OUTBID' | 'WON' | 'FORFEITED' | 'REFUNDED';
  placedAt: string;
  bidder: AuctionSeller;
}

export interface AuctionPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
