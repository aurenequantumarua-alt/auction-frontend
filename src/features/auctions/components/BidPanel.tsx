import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Countdown } from '@/components/common/Countdown';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/format';
import { extractApiError } from '@/lib/api';
import { ConnectBankDialog, isBankAccountRequired } from '@/components/common/ConnectBankDialog';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuthStore } from '@/features/auth/authStore';
import { usePlaceBid, useWatchToggle, useBuyNow } from '../hooks';
import type { AuctionDetail } from '../types';
import { ReportDialog } from './ReportDialog';

interface BidPanelProps {
  auction: AuctionDetail;
}

export const BidPanel = ({ auction }: BidPanelProps) => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const placeBid = usePlaceBid(auction.id);
  const watchToggle = useWatchToggle(auction.id);
  const buyNow = useBuyNow(auction.id);
  
  const effectiveStatus = useMemo(() => {
    if (auction.status === 'LIVE' && new Date(auction.endsAt).getTime() <= Date.now()) {
      return 'ENDED';
    }
    if (auction.status === 'UPCOMING' && new Date(auction.startsAt).getTime() <= Date.now()) {
      if (new Date(auction.endsAt).getTime() <= Date.now()) return 'ENDED';
      return 'LIVE';
    }
    return auction.status;
  }, [auction]);

  const isLive = effectiveStatus === 'LIVE';
  const isUpcoming = effectiveStatus === 'UPCOMING';
  const t = useCountdown(isUpcoming ? auction.startsAt : auction.endsAt);

  const currentAmount = auction.currentBid?.amount ?? auction.basePrice;
  const minNext = useMemo(() => {
    const cur = Number(currentAmount);
    const inc = Number(auction.minIncrement);
    return (cur + inc).toFixed(2);
  }, [currentAmount, auction.minIncrement]);

  const [amount, setAmount] = useState(minNext);
  useEffect(() => setAmount(minNext), [minNext]);
  const [bankGateOpen, setBankGateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwner = user?.id === auction.seller.id;
  const ended = !isLive && !isUpcoming;

  // Buy It Now is available when the auction is live, has a buy-now price, and
  // the current bid hasn't already met or exceeded the buy-now price.
  const hasBuyNow =
    isLive &&
    !isOwner &&
    auction.buyNowPrice &&
    Number(auction.buyNowPrice) > Number(currentAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/auctions/${auction.id}` } } });
      return;
    }
    if (Number(amount) < Number(minNext)) {
      toast.error(`Minimum bid is ${formatPrice(minNext, true)}`);
      return;
    }
    try {
      await placeBid.mutateAsync(amount);
      toast.success(`Bid placed at ${formatPrice(amount, true)}`);
    } catch (err) {
      if (isBankAccountRequired(err)) {
        setBankGateOpen(true);
        return;
      }
      toast.error(extractApiError(err).message);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/auctions/${auction.id}` } } });
      return;
    }
    if (
      !window.confirm(
        `Buy this item now for ${formatPrice(auction.buyNowPrice!, true)}? The auction will end immediately and you'll proceed to payment.`,
      )
    )
      return;

    try {
      await buyNow.mutateAsync();
      toast.success('You won! Proceed to payment.');
    } catch (err) {
      if (isBankAccountRequired(err)) {
        setBankGateOpen(true);
        return;
      }
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <aside className="rounded-lg border border-line bg-canvas p-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <p className="kicker">{auction.currentBid ? 'Current bid' : 'Starting at'}</p>
        {isLive && (
          <Badge tone="live" className="bg-success/10">
            <StatusDot tone="live" />
            Live
          </Badge>
        )}
        {effectiveStatus === 'UPCOMING' && <Badge tone="ink">Upcoming</Badge>}
        {effectiveStatus === 'ENDED' && <Badge tone="neutral">Ended</Badge>}
        {effectiveStatus === 'PAYMENT_PENDING' && <Badge tone="warn">Payment pending</Badge>}
        {effectiveStatus === 'SOLD' && <Badge tone="accent">Sold</Badge>}
        {effectiveStatus === 'EXPIRED' && <Badge tone="neutral">Expired</Badge>}
      </div>

      <p className="mt-3 font-display text-4xl font-semibold tabular text-ink">
        {formatPrice(currentAmount, true)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {auction.bidCount} bid{auction.bidCount === 1 ? '' : 's'}
        {auction.currentBid && ' · You can still claim it'}
      </p>

      {/* ── Buy It Now banner ────────────────────────────────── */}
      {auction.buyNowPrice && isLive && !isOwner && (
        <div className="mt-3 flex items-center gap-2 rounded bg-accent/5 px-3 py-2 text-sm">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-muted">Buy It Now:</span>
          <span className="font-semibold text-accent tabular">{formatPrice(auction.buyNowPrice, true)}</span>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-y border-line py-3 text-sm">
        <span className="text-muted">
          {isUpcoming ? 'Bidding opens in' : ended ? 'Auction ended' : 'Time left'}
        </span>
        <Countdown
          endsAt={isUpcoming ? auction.startsAt : auction.endsAt}
          className="font-medium"
        />
      </div>

      {isOwner ? (
        <p className="mt-5 rounded bg-ink-50 px-3 py-2 text-sm text-muted">
          This is your listing. You can&apos;t bid on your own auction.
        </p>
      ) : isUpcoming ? (
        <p className="mt-5 rounded bg-ink-50 px-3 py-2 text-sm text-muted">
          This auction hasn&apos;t started yet. We&apos;ll open bidding the moment it goes live.
        </p>
      ) : ended ? (
        <p className="mt-5 rounded bg-ink-50 px-3 py-2 text-sm text-muted">
          Bidding is closed for this auction.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="kicker mb-1.5 block">Your bid</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
              <Input
                type="number"
                step="0.01"
                min={minNext}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-base font-medium tabular"
                inputMode="decimal"
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Enter {formatPrice(minNext, true)} or more (current bid + {formatPrice(auction.minIncrement, true)} increment)
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={placeBid.isPending}
          >
            {placeBid.isPending ? 'Placing…' : `Place bid · ${formatPrice(amount || minNext, true)}`}
          </Button>

          {/* ── Buy It Now ─────────────────────────────────────── */}
          {hasBuyNow && (
            <div className="pt-1">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-kicker text-muted">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="mt-3 w-full gap-2 border-accent/30 bg-accent/5 text-accent hover:bg-accent/10"
                disabled={buyNow.isPending}
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
                {buyNow.isPending
                  ? 'Processing…'
                  : `Buy It Now · ${formatPrice(auction.buyNowPrice!, true)}`}
              </Button>
              <p className="mt-1.5 text-center text-[11px] text-muted">
                Skip the bidding — purchase immediately at the seller&apos;s fixed price.
              </p>
            </div>
          )}
        </form>
      )}

      {!isOwner && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="mt-3 w-full"
          onClick={() => {
            if (!user) {
              navigate('/login');
              return;
            }
            watchToggle.mutate(!auction.isWatched);
          }}
        >
          <Heart className={auction.isWatched ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
          {auction.isWatched ? 'In watchlist' : 'Add to watchlist'}
        </Button>
      )}

      {t.totalMs > 0 && t.totalMs < 2 * 60 * 1000 && (
        <p className="mt-4 rounded bg-warn/10 px-3 py-2 text-xs text-warn">
          Bids in the last 30 seconds extend the auction by 30 seconds.
        </p>
      )}

      <div className="mt-6 flex justify-center border-t border-line pt-4">
        <button
          type="button"
          onClick={() => {
            if (!user) {
              navigate('/login');
              return;
            }
            setReportOpen(true);
          }}
          className="text-[11px] uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          Report this listing
        </button>
      </div>

      <ConnectBankDialog open={bankGateOpen} onOpenChange={setBankGateOpen} reason="bid" />
      <ReportDialog auctionId={auction.id} open={reportOpen} onOpenChange={setReportOpen} />
    </aside>
  );
};
