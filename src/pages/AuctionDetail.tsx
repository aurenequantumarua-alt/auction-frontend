import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, Ruler, Box, Landmark, Heart } from 'lucide-react';
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
import { useThemeStore } from '@/features/theme/themeStore';
import { extractApiError } from '@/lib/api';
import { sanitize } from '@/lib/sanitize';
import { cn } from '@/lib/cn';
import type { AuctionDetail } from '@/features/auctions/types';

const conditionLabel: Record<string, string> = {
  NEW: 'New / Mint museum state',
  LIKE_NEW: 'Like new / Pristine antique',
  GOOD: 'Good / Period patina',
  FAIR: 'Fair / Historic wear',
};

/** Controls shown to the seller on their own auction: close it early or cancel. */
const SellerControls = ({
  auction,
  isAntique,
}: {
  auction: AuctionDetail;
  isAntique?: boolean;
}) => {
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
        ? 'End this auction now and award the item to the top bidder? They will have 24 hours to complete payment.'
        : 'End this auction now? With no bids placed, this auction will simply close.';
    if (!window.confirm(msg)) return;
    endNow.mutate(undefined, {
      onSuccess: () =>
        toast.success(bids > 0 ? 'Closed — awarded to top bidder.' : 'Auction closed.'),
      onError: (e) => toast.error(extractApiError(e).message),
    });
  };
  const onCancel = () => {
    if (!window.confirm('Cancel this listing? This action cannot be undone.')) return;
    cancel.mutate(undefined, {
      onSuccess: () => toast.success('Listing cancelled.'),
      onError: (e) => toast.error(extractApiError(e).message),
    });
  };

  return (
    <div
      className={cn(
        'mt-6 p-5 rounded-lg border',
        isAntique
          ? 'border-[#E5E0D8] bg-white text-[#131C2A] shadow-sm'
          : 'border-line bg-canvas text-ink',
      )}
    >
      <p className={cn(isAntique ? 'text-xs uppercase tracking-wider text-[#8E764E] font-medium mb-3' : 'kicker mb-2')}>
        Seller Options
      </p>
      {isLive && (
        <Button
          onClick={onEnd}
          disabled={endNow.isPending}
          className={cn(
            'w-full',
            isAntique
              ? 'border-0 bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] rounded font-medium text-xs tracking-wider uppercase py-3 shadow-sm'
              : '',
          )}
        >
          {bids > 0 ? 'Accept Top Bid & End Auction' : 'End Auction Early'}
        </Button>
      )}
      {(isPreLive || (isLive && bids === 0)) && (
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={cancel.isPending}
          className={cn(
            'mt-2 w-full',
            isAntique
              ? 'border border-[#E0DAD0] bg-white text-[#0E1622] hover:bg-[#FAF8F5] rounded text-xs py-2.5 font-medium'
              : '',
          )}
        >
          Cancel Listing
        </Button>
      )}
      <p className={cn('mt-2 text-xs', isAntique ? 'text-[#7A8699]' : 'text-muted')}>
        {bids > 0
          ? 'Ending now locks in the highest bid. If that buyer does not pay in time, the item is offered to the next highest bidder.'
          : 'No bids placed yet — you can cancel or close this listing anytime.'}
      </p>
    </div>
  );
};

export const AuctionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: auction, isLoading, error } = useAuction(id ?? '');
  const { data: bidsData } = useAuctionBids(id ?? '');
  const setAntiqueMode = useThemeStore((s) => s.setAntiqueMode);
  useAuctionSubscription(id);

  const isAntique = auction?.category === 'Antiques';

  useEffect(() => {
    if (isAntique) {
      setAntiqueMode(true);
    }
    return () => {
      setAntiqueMode(false);
    };
  }, [isAntique, setAntiqueMode]);

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

  // ───────────────────────────────────────────────────────────────────────────
  // THE CLASSIC HERITAGE GALLERY (M.S. Rau Antiques Style)
  // ───────────────────────────────────────────────────────────────────────────
  if (isAntique) {
    const lotId = auction.id.slice(-6).toUpperCase();

    return (
      <div className="min-h-screen bg-[#FBFBF9] text-[#131C2A] font-sans antialiased py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          {/* Top Heritage Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4 mb-8 text-xs">
            <div className="flex items-center gap-2 text-[#8E8070]">
              <Link
                to="/antiques"
                className="hover:text-[#0E1622] font-medium transition-colors"
              >
                ← Back to Antiques
              </Link>
              <span>/</span>
              <span className="text-[#0E1622] font-medium tracking-wide">Item #{lotId}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-[#8E764E] font-medium">
                Documented Provenance
              </span>
              <span className="rounded border border-[#B89C6F]/40 bg-[#FAF7F0] text-[#7A633F] px-2.5 py-0.5 font-medium">
                48-Hour Inspection Guarantee
              </span>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left 7 columns: Gallery, Catalogue Note, Dossier, Escrow Guarantee, Ledger, Inquiries */}
            <div className="lg:col-span-7 space-y-8">
              {/* Museum Gallery */}
              <AuctionGallery
                images={auction.images}
                alt={`${auction.brand} ${sanitize(auction.title)}`}
                isAntique={true}
              />

              {/* Catalogue Note & History */}
              <div className="rounded-lg border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-sm">
                <div className="text-xs uppercase tracking-widest text-[#8E764E] font-medium mb-1.5">
                  About This Piece
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#0E1622] mb-4">
                  {sanitize(auction.title)}
                </h3>
                <p className="text-sm sm:text-base text-[#2E384D] leading-relaxed whitespace-pre-line font-light">
                  {sanitize(auction.description)}
                </p>

                {auction.tags && auction.tags.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[#F0ECE1] flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-[#8E8070] font-medium mr-1">Tags:</span>
                    {auction.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-[#FAF7F0] border border-[#E0DAD0] px-2.5 py-0.5 text-xs text-[#6B5A42] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Specification Details */}
              <div className="rounded-lg border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-sm">
                <div className="border-b border-[#F0ECE1] pb-3 mb-6 flex items-center justify-between text-xs">
                  <span className="font-serif text-base text-[#0E1622] font-medium">
                    Item Details
                  </span>
                  <span className="text-[#8E8070]">Catalogued Specifications</span>
                </div>
                <dl className="grid grid-cols-2 gap-y-6 gap-x-6 sm:grid-cols-3 text-xs">
                  <div>
                    <dt className="text-[#8E8070] uppercase text-[10px] tracking-wider">Department</dt>
                    <dd className="mt-1 font-serif text-sm font-medium text-[#0E1622]">Antiques &amp; Relics</dd>
                  </div>
                  <div>
                    <dt className="text-[#8E8070] uppercase text-[10px] tracking-wider">Period / Maker</dt>
                    <dd className="mt-1 font-medium text-sm text-[#0E1622] flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#B89C6F]" />
                      {auction.brand}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#8E8070] uppercase text-[10px] tracking-wider">Dimensions</dt>
                    <dd className="mt-1 font-medium text-sm text-[#0E1622] flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5 text-[#B89C6F]" />
                      {auction.size}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#8E8070] uppercase text-[10px] tracking-wider">Condition</dt>
                    <dd className="mt-1 font-medium text-sm text-[#0E1622] flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5 text-[#B89C6F]" />
                      {conditionLabel[auction.condition] ?? auction.condition}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#8E8070] uppercase text-[10px] tracking-wider">Seller</dt>
                    <dd className="mt-1 font-medium text-sm text-[#0E1622] truncate">
                      {sanitize(auction.seller.name)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#8E8070] uppercase text-[10px] tracking-wider">Watchlist</dt>
                    <dd className="mt-1 font-medium text-sm text-[#0E1622] flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-[#B89C6F]" />
                      {auction._count?.watchlist ?? 0} watching
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Provenance & Historical Records */}
              {(auction.provenance || (auction.provenanceProofUrls && auction.provenanceProofUrls.length > 0)) && (
                <div className="rounded-lg border border-[#E5E0D8] bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-[#8E764E]" />
                      <h3 className="font-serif text-lg font-medium text-[#0E1622]">
                        Provenance &amp; Historical Documentation
                      </h3>
                    </div>
                    {auction.provenanceProofUrls && auction.provenanceProofUrls.length > 0 && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold border border-[#B89C6F]/40 bg-[#FAF7F0] text-[#7A633F] px-2 py-0.5 rounded">
                        ✓ Documentation Attached ({auction.provenanceProofUrls.length})
                      </span>
                    )}
                  </div>

                  {auction.provenance && (
                    <p className="text-sm text-[#4A5568] leading-relaxed whitespace-pre-wrap">
                      {sanitize(auction.provenance)}
                    </p>
                  )}

                  {auction.provenanceProofUrls && auction.provenanceProofUrls.length > 0 && (
                    <div className="pt-2 border-t border-[#F0ECE1]">
                      <span className="text-[11px] uppercase tracking-wider text-[#8E8070] font-medium block mb-2.5">
                        Supporting Documents &amp; Certificates
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {auction.provenanceProofUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative h-20 w-20 rounded-md overflow-hidden border border-[#D5CBBF] hover:border-[#B89C6F] shadow-xs transition-all"
                            title="Click to view full certificate or document"
                          >
                            <img src={url} alt={`Document ${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 48-Hour Inspection & Escrow Guarantee Card */}
              <div className="rounded-lg border border-[#B89C6F]/30 bg-[#FAF7F0] p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wider text-[#7A633F] font-semibold mb-1.5">
                  48-Hour Inspection &amp; Escrow Guarantee
                </div>
                <p className="text-xs text-[#5C4F3B] leading-relaxed">
                  Your payment is held safely in escrow. Once your item arrives, you have two full days 
                  to inspect it in person. If it does not match this catalogue description, you can open 
                  a report for a full refund before funds are released to the seller.
                </p>
              </div>

              {/* Bidding History */}
              <div className="space-y-3">
                <div className="font-serif text-lg text-[#0E1622] font-medium">
                  Bidding History
                </div>
                <BidHistory bids={bidsData?.items ?? auction.bids} isAntique={true} />
              </div>

              {/* Questions for Seller */}
              <AuctionInquiries
                auctionId={auction.id}
                sellerId={auction.seller.id}
                isAntique={true}
              />
            </div>

            {/* Right 5 columns: Sticky Header, Bidding Console, Seller Controls */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Item Header Box */}
                <div className="rounded-lg border border-[#E5E0D8] bg-white p-6 shadow-sm">
                  <div className="text-xs uppercase tracking-widest text-[#8E764E] font-medium">
                    {auction.brand} · Item #{lotId}
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl text-[#0E1622] font-normal leading-tight mt-1.5">
                    {sanitize(auction.title)}
                  </h1>
                  <div className="text-xs text-[#7A8699] mt-3">
                    Seller: <span className="font-medium text-[#0E1622]">{sanitize(auction.seller.name)}</span>
                  </div>
                </div>

                {/* Bidding Console */}
                <BidPanel auction={auction} />

                {/* Seller Controls */}
                <SellerControls auction={auction} isAntique={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STANDARD CONTEMPORARY VIEW (Fashion / Sneakers / Watches / Electronics)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="container py-12">
      <Link to="/browse" className="text-sm text-muted hover:text-ink">
        ← Return to Auctions
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
              <dt className="kicker">Brand / Maker</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Tag className="h-3.5 w-3.5 text-muted" />
                {auction.brand}
              </dd>
            </div>
            <div>
              <dt className="kicker">Dimensions</dt>
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
              <dt className="kicker">Watchlist</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Heart className="h-3.5 w-3.5 text-muted" />
                {auction._count?.watchlist ?? 0} watching
              </dd>
            </div>
          </dl>

          <div className="mt-12">
            <p className="kicker">Bidding History</p>
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
            <span>Seller: {sanitize(auction.seller.name)}</span>
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
