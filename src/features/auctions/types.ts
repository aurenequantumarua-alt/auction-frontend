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
  provenance?: string | null;
  provenanceProofUrls?: string[];
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
    status: 'AWAITING_PAYMENT' | 'ESCROW_HOLD' | 'DELIVERED_PENDING' | 'DISPUTED' | 'COMPLETED' | 'REFUNDED' | 'EXHAUSTED';
    paymentDeadline: string;
    currentWinnerBidId: string | null;
    currentWinnerBid?: {
      id: string;
      bidderId: string;
      amount: string;
    } | null;
    attemptCount: number;
    shippingName?: string | null;
    shippingPhone?: string | null;
    shippingAddress?: string | null;
    shippingCity?: string | null;
    shippingState?: string | null;
    shippingPostalCode?: string | null;
    shippedAt: string | null;
    trackingNumber: string | null;
    courierName: string | null;
    deliveredAt: string | null;
    inspectionDeadline: string | null;
    shippingDeadline: string | null;
    releasedAt: string | null;
    dispute?: {
      id: string;
      reason: string;
      description: string;
      proofUrls: string[];
      status: 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_REJECTED';
      adminNotes: string | null;
      createdAt: string;
    } | null;
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
