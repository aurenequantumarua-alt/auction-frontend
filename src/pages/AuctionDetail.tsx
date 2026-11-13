import { useParams, Link } from 'react-router-dom';
import { Eye, Tag, Ruler, Box } from 'lucide-react';
import { toast } from 'sonner';
import { useAuction, useAuctionBids, useEndAuctionNow, useCancelAuction } from '@/features/auctions/hooks';
import { AuctionGallery } from '@/features/auctions/components/AuctionGallery';
import { BidPanel } from '@/features/auctions/components/BidPanel';
import { BidHistory } from '@/features/auctions/components/BidHistory';
import { AuctionInquiries } from '@/features/auctions/components/AuctionInquiries';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useAuctionSubscription } from '@/app/useRealtimeBridge';
import { useAuthStore } from '@/features/auth/authStore';
import { extractApiError } from '@/lib/api';
import { sanitize } from '@/lib/sanitize';
import type { AuctionDetail } from '@/features/auctions/types';

const conditionLabel: Record<string, string> = {
  NEW: 'New with tags',
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
};

/** Controls shown to the seller on their own auction: close it early or cancel. */
const SellerControls = ({ auction }: { auction: AuctionDetail }) => {
  const user = useAuthStore((s) => s.user);
  const endNow = useEndAuctionNow(auction.id);
  const cancel = useCancelAuction(auction.id);

  if (!user || user.id !== auction.seller.id) return null;
  const isLive = auction.status === 'LIVE';
  const isPreLive = auction.status === 'UPCOMING' || auction.status === 'DRAFT';
  if (!isLive && !isPreLive) return null;

  const bids = auction._count?.bids ?? 0;

  const onEnd = () => {
    const msg =
      bids > 0
        ? 'End this auction now and sell to the current highest bidder? They will then have the payment window to pay.'
        : 'End this auction now? With no bids it will simply close.';
    if (!window.confirm(msg)) return;
    endNow.mutate(undefined, {
      onSuccess: () => toast.success(bids > 0 ? 'Closed — sold to the top bidder.' : 'Auction closed.'),
      onError: (e) => toast.error(extractApiError(e).message),
    });
  };
  const onCancel = () => {
    if (!window.confirm('Cancel this listing? This cannot be undone.')) return;
    cancel.mutate(undefined, {
      onSuccess: () => toast.success('Listing cancelled.'),
      onError: (e) => toast.error(extractApiError(e).message),
    });
  };

  return (
    <div className="mt-6 rounded-lg border border-line bg-canvas p-4">
      <p className="kicker mb-2">Seller controls</p>
      {isLive && (
        <Button onClick={onEnd} disabled={endNow.isPending} className="w-full">
          {bids > 0 ? 'End now & sell to top bidder' : 'End auction now'}
        </Button>
      )}
      {(isPreLive || (isLive && bids === 0)) && (
        <Button variant="secondary" onClick={onCancel} disabled={cancel.isPending} className="mt-2 w-full">
          Cancel listing
        </Button>
      )}
      <p className="mt-2 text-xs text-muted">
        {bids > 0
          ? 'Ending now locks in the current highest bid. If that buyer doesn’t pay in time, it automatically rolls to the next-highest bidder.'
          : 'No bids yet — you can end or cancel this listing anytime.'}
      </p>
    </div>
  );
};

export const AuctionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: auction, isLoading, error } = useAuction(id ?? '');
  const { data: bidsData } = useAuctionBids(id ?? '');
  useAuctionSubscription(id);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Skeleton className="aspect-square w-full" />
          </div>
          <div className="space-y-6 lg:col-span-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container py-20 text-center">
        <p className="kicker">Not found</p>
        <h1 className="display-serif mt-2 text-display-md font-semibold">This auction is unavailable</h1>
        <p className="mt-3 text-muted">It may have been removed or never existed.</p>
        <Link to="/browse" className="mt-6 inline-block text-sm underline">
          Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to="/browse" className="text-sm text-muted hover:text-ink">
        ← Back to browse
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AuctionGallery images={auction.images} alt={`${auction.brand} ${sanitize(auction.title)}`} />

          <div className="mt-12">
            <p className="kicker">Description</p>
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink-700">
              {sanitize(auction.description)}
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4">
            <div>
              <dt className="kicker">Brand</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Tag className="h-3.5 w-3.5 text-muted" />
                {auction.brand}
              </dd>
            </div>
            <div>
              <dt className="kicker">Size</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Ruler className="h-3.5 w-3.5 text-muted" />
                {auction.size}
              </dd>
            </div>
            <div>
              <dt className="kicker">Condition</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Box className="h-3.5 w-3.5 text-muted" />
                {conditionLabel[auction.condition] ?? auction.condition}
              </dd>
            </div>
            <div>
              <dt className="kicker">Watching</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Eye className="h-3.5 w-3.5 text-muted" />
                {auction._count?.watchlist ?? 0}
              </dd>
            </div>
          </dl>

          <div className="mt-12">
            <p className="kicker">Bid history</p>
            <div className="mt-4">
              <BidHistory bids={bidsData?.items ?? auction.bids} />
            </div>
          </div>

          {/* Q&A Section */}
          <AuctionInquiries auctionId={auction.id} sellerId={auction.seller.id} />
        </div>

        <div className="lg:col-span-5">
          <p className="kicker">{auction.brand}</p>
          <h1 className="display-serif mt-2 text-display-md font-semibold leading-tight text-ink">
            {sanitize(auction.title)}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted">
            <span>Listed by {sanitize(auction.seller.name)}</span>
          </div>
          <div className="mt-6">
            <BidPanel auction={auction} />
          </div>
          <SellerControls auction={auction} />
        </div>
      </div>
    </div>
  );
};
