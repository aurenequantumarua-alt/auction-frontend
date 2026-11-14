import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Heart,
  Zap,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Countdown } from '@/components/common/Countdown';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatRelative } from '@/lib/format';
import { api, extractApiError } from '@/lib/api';
import { loadRazorpay } from '@/lib/razorpay';
import { useCountdown } from '@/hooks/useCountdown';
import { useAuthStore } from '@/features/auth/authStore';
import { usePlaceBid, useWatchToggle, useBuyNow, auctionKeys } from '../hooks';
import type { AuctionDetail } from '../types';
import { ReportDialog } from './ReportDialog';
import { DisputeModal } from './DisputeModal';
import { ShipModal } from './ShipModal';

interface BidPanelProps {
  auction: AuctionDetail;
}

type CheckoutResponse =
  | { provider: 'mock'; message?: string; settlementId: string; amountDue: string }
  | {
      provider: 'razorpay';
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      settlementId: string;
      name: string;
      description?: string;
    };

const InspectionCountdown = ({ deadline }: { deadline: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return <span className="text-warn font-medium">Expired</span>;
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return (
    <span className="font-mono text-sm font-medium text-warn">
      {hours}h {mins}m {secs}s
    </span>
  );
};

export const BidPanel = ({ auction }: BidPanelProps) => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
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
  const isAntique = auction.category === 'Antiques';
  const t = useCountdown(isUpcoming ? auction.startsAt : auction.endsAt);

  const currentAmount = auction.currentBid?.amount ?? auction.basePrice;
  const minNext = useMemo(() => {
    const cur = Number(currentAmount);
    const inc = Number(auction.minIncrement);
    return (cur + inc).toFixed(2);
  }, [currentAmount, auction.minIncrement]);

  const [amount, setAmount] = useState(minNext);
  useEffect(() => setAmount(minNext), [minNext]);

  const [reportOpen, setReportOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const isOwner = user?.id === auction.seller.id;
  const ended = !isLive && !isUpcoming;

  // Check if current user is the winning bidder
  const isWinner = Boolean(
    user &&
      (auction.settlement?.currentWinnerBid?.bidderId === user.id ||
        auction.currentBid?.bidderId === user.id),
  );

  const winnerBidderId =
    auction.settlement?.currentWinnerBid?.bidderId ??
    auction.currentBid?.bidderId ??
    auction.bids?.find((b) => b.status === 'WON')?.bidder.id;

  // Identify runner-up (highest bid by a different bidder that wasn't forfeited)
  const runnerUpBid = useMemo(() => {
    if (!auction.bids || auction.bids.length === 0) return null;
    return (
      auction.bids.find(
        (b) => b.bidder.id !== winnerBidderId && b.status !== 'FORFEITED',
      ) ?? null
    );
  }, [auction.bids, winnerBidderId]);

  const isRunnerUp = Boolean(
    user &&
      !isWinner &&
      runnerUpBid &&
      runnerUpBid.bidder.id === user.id,
  );

  const isLeading = isLive && Boolean(user && auction.currentBid?.bidderId === user.id);
  const isOutbidLive =
    isLive &&
    Boolean(user && !isLeading && auction.bids?.some((b) => b.bidder.id === user.id));

  const settlement = auction.settlement;
  const settlementStatus = settlement?.status;
  const isPaymentPending =
    effectiveStatus === 'PAYMENT_PENDING' || settlementStatus === 'AWAITING_PAYMENT';
  const isPaymentExpired = Boolean(
    settlement?.paymentDeadline && new Date(settlement.paymentDeadline).getTime() <= Date.now(),
  );

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
      toast.error(extractApiError(err).message);
    }
  };

  // Payment Checkout handler
  const handleCheckout = async (settlementId?: string) => {
    if (!settlementId) {
      toast.error('Settlement details not found. Please refresh.');
      return;
    }
    setPaying(true);
    try {
      const { data: res } = await api.post<CheckoutResponse>(`/payments/checkout/${settlementId}`);

      if (res.provider !== 'razorpay') {
        toast.error('Payment gateway is currently unavailable. Please try again.');
        return;
      }

      await loadRazorpay();
      if (!window.Razorpay) {
        toast.error('Could not load payment gateway SDK.');
        return;
      }

      const rzp = new window.Razorpay({
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        name: res.name,
        description: res.description,
        order_id: res.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#1c1917' },
        handler: async (resp) => {
          try {
            await api.post(`/payments/verify/${settlementId}`, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success('Payment secured in Escrow! Waiting for seller to dispatch.');
          } catch {
            toast.info('Payment received! Order confirmation in progress.', { duration: 6000 });
          } finally {
            qc.invalidateQueries({ queryKey: auctionKeys.detail(auction.id) });
            qc.invalidateQueries({ queryKey: auctionKeys.myWins() });
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled.');
          },
        },
      });

      rzp.on('payment.failed', (r) => {
        toast.error(r.error?.description ?? 'Payment failed.');
      });

      rzp.open();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setPaying(false);
    }
  };

  const handleMarkDelivered = async (settlementId?: string) => {
    if (!settlementId) return;
    try {
      await api.post(`/settlements/${settlementId}/delivered`);
      toast.success('Marked as delivered! 48h Inspection window has begun.');
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auction.id) });
      qc.invalidateQueries({ queryKey: auctionKeys.myWins() });
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const handleConfirmRelease = async (settlementId?: string) => {
    if (!settlementId) return;
    if (
      !window.confirm(
        'Confirm that the item is authentic and satisfactory? This will release 90% funds to the seller and complete the sale.',
      )
    )
      return;
    try {
      await api.post(`/settlements/${settlementId}/confirm`);
      toast.success('Funds released to seller! Transaction completed.');
      qc.invalidateQueries({ queryKey: auctionKeys.detail(auction.id) });
      qc.invalidateQueries({ queryKey: auctionKeys.myWins() });
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <aside
      className={cn(
        'p-6 lg:sticky lg:top-24 transition-colors rounded-xl',
        isAntique
          ? 'border border-[#B89C6F]/40 bg-white text-[#131C2A] shadow-md'
          : 'border border-line bg-canvas',
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn(isAntique ? 'text-xs uppercase tracking-wider text-[#8E764E] font-medium' : 'kicker')}>
          {auction.currentBid ? 'Current bid' : 'Starting bid'}
        </p>
        {isLive && (
          <span
            className={cn(
              isAntique
                ? 'rounded px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'rounded bg-success/10 text-success text-xs px-2 py-0.5 font-medium',
            )}
          >
            ● Live
          </span>
        )}
        {effectiveStatus === 'UPCOMING' && (
          <span
            className={cn(
              isAntique
                ? 'rounded px-2.5 py-0.5 text-xs font-semibold bg-[#FAF7F0] text-[#7A633F] border border-[#B89C6F]/40'
                : 'rounded bg-ink-100 text-ink text-xs px-2 py-0.5 font-medium',
            )}
          >
            Upcoming
          </span>
        )}
        {effectiveStatus === 'ENDED' && <Badge tone="neutral">Ended</Badge>}
        {effectiveStatus === 'PAYMENT_PENDING' && <Badge tone="warn">Payment Pending</Badge>}
        {effectiveStatus === 'SOLD' && <Badge tone="accent">Sold</Badge>}
        {effectiveStatus === 'EXPIRED' && <Badge tone="neutral">Ended</Badge>}
      </div>

      <p
        className={cn(
          'mt-3 tabular',
          isAntique ? 'font-serif text-4xl sm:text-5xl font-semibold text-[#0E1622]' : 'font-display text-4xl font-semibold text-ink',
        )}
      >
        {formatPrice(currentAmount, true)}
      </p>
      <p className={cn('mt-1', isAntique ? 'text-xs text-[#5C6675]' : 'text-sm text-muted')}>
        {auction.bidCount} bid{auction.bidCount === 1 ? '' : 's'} placed
        {isLive && ' · Bidding in progress'}
        {ended && isWinner && ' · You won this auction'}
        {ended && isRunnerUp && ' · You placed 2nd (Next in Line)'}
      </p>

      {/* ── Buy It Now banner ────────────────────────────────── */}
      {auction.buyNowPrice && isLive && !isOwner && (
        <div className="mt-3 flex items-center gap-2 rounded bg-accent/5 px-3 py-2 text-sm">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-muted">Buy It Now:</span>
          <span className="font-semibold text-accent tabular">
            {formatPrice(auction.buyNowPrice, true)}
          </span>
        </div>
      )}

      <div className={cn('mt-5 flex items-center justify-between py-3', isAntique ? 'border-y border-[#F0ECE1] text-xs' : 'border-y border-line text-sm')}>
        <span className={cn(isAntique ? 'text-[#8E8070] font-medium' : 'text-muted')}>
          {isUpcoming ? 'Bidding opens in' : ended ? 'Auction ended' : 'Time left'}
        </span>
        <Countdown
          endsAt={isUpcoming ? auction.startsAt : auction.endsAt}
          className={cn(isAntique ? 'text-xs font-semibold text-[#0E1622]' : 'font-medium')}
        />
      </div>

      {/* ── WINNER FLOW: PAYMENT & ESCROW ACTIONS ─────────────────────────── */}
      {ended && isWinner ? (
        <div className="mt-5 space-y-4">
          {/* Status 1: Pending payment */}
          {isPaymentPending && !isPaymentExpired && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>You won this auction!</span>
              </div>
              <p className="text-xs leading-relaxed text-ink-700">
                Complete your payment to secure this item. Your money is held in <strong>secure escrow</strong> and 
                is only released after your piece is delivered and your 48-hour in-person inspection period ends.
              </p>
              {settlement?.paymentDeadline && (
                <div className="flex items-center justify-between text-xs text-muted border-t border-amber-500/20 pt-2">
                  <span>Pay within:</span>
                  <span className="font-medium text-warn">
                    {formatRelative(settlement.paymentDeadline)}
                  </span>
                </div>
              )}
              <Button
                type="button"
                size="lg"
                className="w-full gap-2 bg-ink text-canvas hover:bg-ink/90 font-medium text-base shadow-sm"
                disabled={paying}
                onClick={() => handleCheckout(settlement?.id)}
              >
                <CreditCard className="h-4 w-4" />
                {paying ? 'Processing…' : `Pay ${formatPrice(currentAmount, true)} Now`}
              </Button>
              <p className="text-[11px] text-center text-muted">
                🔒 Backed by our 48-Hour Escrow Inspection Guarantee
              </p>
            </div>
          )}

          {isPaymentPending && isPaymentExpired && (
            <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 space-y-2 text-xs text-muted">
              <p className="font-medium text-warn flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Payment Window Expired
              </p>
              <p>The payment deadline for this auction has lapsed. This item has been offered to the next highest bidder.</p>
            </div>
          )}

          {/* Status 2: Funds in Escrow, waiting for seller shipping */}
          {settlement && settlementStatus === 'ESCROW_HOLD' && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Payment Protected in Escrow</span>
              </div>
              {settlement.shippedAt ? (
                <div className="space-y-2 text-sm text-ink">
                  <p>
                    Shipped via <strong>{settlement.courierName}</strong>
                  </p>
                  <p className="text-xs text-muted">
                    Tracking: <span className="font-mono text-ink">{settlement.trackingNumber}</span>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 w-full gap-2"
                    onClick={() => handleMarkDelivered(settlement.id)}
                  >
                    <Truck className="h-4 w-4" />
                    I Received the Item
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="w-full"
                    onClick={() => setDisputeOpen(true)}
                  >
                    Report Issue / Not Delivered
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  The seller has been notified to ship your item. Tracking details will appear here once dispatched.
                </p>
              )}
            </div>
          )}

          {/* Status 3: Delivered, 48h Inspection Window */}
          {settlement && settlementStatus === 'DELIVERED_PENDING' && (
            <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-warn">
                <span>⏱ 48-Hour Inspection Period</span>
                {settlement.inspectionDeadline && (
                  <InspectionCountdown deadline={settlement.inspectionDeadline} />
                )}
              </div>
              <p className="text-xs text-muted">
                Please examine the piece to verify that it matches the catalogue description.
              </p>
              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-accent text-white hover:bg-accent/90"
                  onClick={() => handleConfirmRelease(settlement.id)}
                >
                  ✓ Approve &amp; Release Payment
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="w-full"
                  onClick={() => setDisputeOpen(true)}
                >
                  Report a Problem
                </Button>
              </div>
            </div>
          )}

          {/* Status 4: Disputed */}
          {settlementStatus === 'DISPUTED' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Under Support Review
              </p>
              <p className="text-xs text-muted">
                Our support team is reviewing your report. Escrow funds remain safely locked.
              </p>
            </div>
          )}

          {/* Status 5: Completed */}
          {settlementStatus === 'COMPLETED' && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-1">
              <p className="font-semibold text-sm text-accent">✓ Order Completed</p>
              <p className="text-xs text-muted">
                Item approved and payment released to the seller.
              </p>
            </div>
          )}

          {/* Status 6: Refunded */}
          {settlementStatus === 'REFUNDED' && (
            <div className="rounded-xl border border-line bg-ink-50/50 p-4 space-y-1">
              <p className="font-semibold text-sm text-ink flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Payment Refunded
              </p>
              <p className="text-xs text-muted">The funds have been returned to your balance.</p>
            </div>
          )}
        </div>
      ) : isOwner ? (
        /* ── SELLER VIEW ─────────────────────────────────────────────── */
        <div className="mt-5 space-y-3">
          <p
            className={cn(
              'p-3 text-xs',
              isAntique
                ? 'rounded border border-[#B89C6F]/30 bg-[#FAF7F0] text-[#7A633F]'
                : 'rounded bg-ink-50 px-3 py-2 text-sm text-muted',
            )}
          >
            This is your listing.
          </p>
          {isPaymentPending && !isPaymentExpired && (
            <div className={cn('p-3 text-xs rounded', isAntique ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'rounded-md border border-warn/30 bg-warn/5 text-muted')}>
              <p className="font-semibold">⏳ Payment Pending</p>
              <p className="mt-1">
                The winning bidder has 24 hours to complete payment into escrow.
              </p>
            </div>
          )}
          {isPaymentPending && isPaymentExpired && (
            <div className={cn('p-3 text-xs rounded', isAntique ? 'border border-red-200 bg-red-50 text-red-900' : 'rounded-md border border-warn/30 bg-warn/5 text-muted')}>
              <p className="font-semibold">⏳ Payment Window Expired</p>
              <p className="mt-1">
                The winning bidder did not complete payment within the deadline.
              </p>
            </div>
          )}
          {settlement && settlementStatus === 'ESCROW_HOLD' && (
            <div className={cn('p-3 text-xs space-y-2 rounded', isAntique ? 'border border-emerald-200 bg-emerald-50 text-emerald-900' : 'rounded-md border border-accent/30 bg-accent/5 text-muted')}>
              <p className="font-semibold">🔒 Buyer Paid — Funds in Escrow</p>
              {!settlement.shippedAt ? (
                <>
                  <p>Please dispatch the item and enter courier tracking details.</p>
                  <Button
                    type="button"
                    size="sm"
                    className={cn('w-full gap-2', isAntique && 'bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] rounded')}
                    onClick={() => setShipOpen(true)}
                  >
                    <Truck className="h-4 w-4" />
                    Ship Item &amp; Enter Tracking
                  </Button>
                </>
              ) : (
                <p>
                  Shipped via <strong>{settlement.courierName}</strong> ({settlement.trackingNumber}).
                  Awaiting buyer delivery and inspection.
                </p>
              )}
            </div>
          )}
          {settlementStatus === 'DELIVERED_PENDING' && (
            <div className={cn('p-3 text-xs rounded', isAntique ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'rounded-md border border-warn/30 bg-warn/5 text-muted')}>
              <p className="font-semibold">📦 Item Delivered</p>
              <p className="mt-1">Buyer 48-hour inspection period is in progress.</p>
            </div>
          )}
          {settlementStatus === 'COMPLETED' && (
            <div className={cn('p-3 text-xs rounded', isAntique ? 'border border-emerald-200 bg-emerald-50 text-emerald-900' : 'rounded-md border border-accent/30 bg-accent/5 text-muted')}>
              <p className="font-semibold">✓ Sale Completed</p>
              <p className="mt-1">Net proceeds (90%) have been credited to your balance.</p>
            </div>
          )}
        </div>
      ) : isUpcoming ? (
        <p
          className={cn(
            'mt-5 p-3 text-xs',
            isAntique
              ? 'rounded border border-[#B89C6F]/30 bg-[#FAF7F0] text-[#7A633F]'
              : 'rounded bg-ink-50 px-3 py-2 text-sm text-muted',
          )}
        >
          This auction hasn&apos;t started yet. Bidding opens at the appointed start time.
        </p>
      ) : ended && isRunnerUp ? (
        <div className="mt-5 space-y-4">
          {isPaymentPending && !isPaymentExpired && (
            <div
              className={cn(
                'rounded-xl p-5 space-y-3',
                isAntique
                  ? 'border border-[#B89C6F]/50 bg-[#FAF7F0] text-[#131C2A]'
                  : 'border border-amber-500/30 bg-amber-500/10 text-ink',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-400">
                  <span className="text-base">🥈</span>
                  <span>2nd Place · You&apos;re Next in Line</span>
                </div>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded',
                    isAntique
                      ? 'border border-[#B89C6F]/40 bg-[#F4EFE6] text-[#7A633F]'
                      : 'bg-amber-500/20 text-amber-800 dark:text-amber-300',
                  )}
                >
                  Backup Winner
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink-700">
                The winning bidder has 24 hours to complete payment. If they forfeit or fail to pay within the deadline, this piece will immediately be offered to you at your highest bid of{' '}
                <strong className="text-ink font-semibold">
                  {formatPrice(runnerUpBid?.amount ?? currentAmount, true)}
                </strong>
                .
              </p>

              {settlement?.paymentDeadline && (
                <div className="flex items-center justify-between text-xs border-t border-amber-500/20 pt-2 text-muted">
                  <span>Winner&apos;s payment deadline:</span>
                  <span className="font-medium text-warn">
                    {formatRelative(settlement.paymentDeadline)}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  'rounded-lg p-2.5 text-[11px] text-muted flex items-start gap-2',
                  isAntique ? 'bg-white/80 border border-[#E0DAD0]' : 'bg-white/60 dark:bg-black/20',
                )}
              >
                <span>💡</span>
                <span>
                  No action needed right now. If the winning bidder forfeits, you will receive an instant notification and 24 hours to complete your purchase.
                </span>
              </div>
            </div>
          )}

          {isPaymentPending && isPaymentExpired && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-800 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Winner Payment Deadline Lapsed</span>
              </div>
              <p className="text-xs text-ink-700 leading-relaxed">
                The winning bidder did not complete payment within 24 hours. The piece is being offered to you as the runner-up! Please refresh in a moment to complete checkout.
              </p>
            </div>
          )}

          {(settlementStatus === 'ESCROW_HOLD' || settlementStatus === 'COMPLETED' || effectiveStatus === 'SOLD') && (
            <div
              className={cn(
                'rounded-xl p-4 text-xs space-y-1',
                isAntique
                  ? 'border border-[#E0DAD0] bg-[#FAF8F5] text-[#5C6675]'
                  : 'border border-line bg-ink-50/50 text-muted',
              )}
            >
              <p className="font-semibold text-ink">Finished in 2nd Place</p>
              <p>The winning bidder completed payment into escrow and acquired this piece. Thank you for your bids!</p>
            </div>
          )}
        </div>
      ) : ended ? (
        <div
          className={cn(
            'mt-5 p-3 text-xs',
            isAntique
              ? 'rounded border border-[#B89C6F]/30 bg-[#FAF7F0] text-[#7A633F]'
              : 'rounded bg-ink-50 px-3 py-2 text-sm text-muted',
          )}
        >
          {effectiveStatus === 'PAYMENT_PENDING'
            ? 'Bidding is closed. Pending checkout from winning bidder.'
            : effectiveStatus === 'SOLD'
              ? 'This item has been sold.'
              : effectiveStatus === 'EXPIRED'
                ? 'This auction has expired.'
                : 'Bidding is closed for this auction.'}
        </div>
      ) : (
        /* ── LIVE BIDDING FORM ─────────────────────────────────────────── */
        <div className="mt-5 space-y-3">
          {isLeading && (
            <div
              className={cn(
                'rounded-lg p-3 text-xs flex items-center gap-2 font-medium',
                isAntique
                  ? 'border border-[#B89C6F]/40 bg-[#FAF7F0] text-[#7A633F]'
                  : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400',
              )}
            >
              <CheckCircle2 className="h-4 w-4 flex-none" />
              <span>You are currently the leading bidder at {formatPrice(currentAmount, true)}</span>
            </div>
          )}

          {isOutbidLive && (
            <div
              className={cn(
                'rounded-lg p-3 text-xs flex items-center gap-2 font-medium',
                isAntique
                  ? 'border border-amber-300 bg-amber-50 text-amber-900'
                  : 'border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400',
              )}
            >
              <AlertTriangle className="h-4 w-4 flex-none" />
              <span>You’ve been outbid! Place a new bid below to reclaim the lead.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={cn(isAntique ? 'text-xs uppercase tracking-wider text-[#8E764E] font-medium block mb-1.5' : 'kicker mb-1.5 block')}>
              {isAntique ? 'Your Bid' : 'Your bid'}
            </label>
            <div className="relative">
              <span className={cn('absolute left-3 top-1/2 -translate-y-1/2', isAntique ? 'text-[#8E764E] font-medium' : 'text-muted')}>₹</span>
              <Input
                type="number"
                step="0.01"
                min={minNext}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(
                  'pl-7 tabular',
                  isAntique
                    ? 'border border-[#E0DAD0] bg-white text-base font-medium text-[#0E1622] rounded focus:border-[#B89C6F]'
                    : 'text-base font-medium',
                )}
                inputMode="decimal"
                required
              />
            </div>
            <p className={cn('mt-1.5 text-xs', isAntique ? 'text-[#8E8070]' : 'text-muted')}>
              Enter {formatPrice(minNext, true)} or more (current bid +{' '}
              {formatPrice(auction.minIncrement, true)} increment)
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            className={cn(
              'w-full',
              isAntique
                ? 'border-0 bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] rounded font-medium text-xs tracking-wider uppercase py-3.5 shadow-sm'
                : '',
            )}
            disabled={placeBid.isPending}
          >
            {placeBid.isPending ? 'Placing bid…' : `Place Bid · ${formatPrice(amount || minNext, true)}`}
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
                className={cn(
                  'mt-3 w-full gap-2',
                  isAntique
                    ? 'border border-[#B89C6F]/40 bg-[#FAF7F0] text-[#7A633F] hover:bg-[#F3EDE0] rounded text-xs py-3 font-medium'
                    : 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10',
                )}
                disabled={buyNow.isPending}
                onClick={handleBuyNow}
              >
                <Zap className="h-4 w-4" />
                {buyNow.isPending
                  ? 'Processing…'
                  : `Buy Now · ${formatPrice(auction.buyNowPrice!, true)}`}
              </Button>
              <p className="mt-1.5 text-center text-[11px] text-muted">
                Buy instantly without waiting for the auction to end.
              </p>
            </div>
          )}
        </form>
      </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="md"
        className={cn(
          'mt-3 w-full gap-2',
          isAntique
            ? 'border border-[#E0DAD0] bg-white text-[#0E1622] hover:bg-[#FAF8F5] rounded text-xs py-3 font-medium'
            : '',
        )}
        disabled={watchToggle.isPending}
        onClick={() => {
          if (!user) {
            navigate('/login');
            return;
          }
          watchToggle.mutate(!auction.isWatched);
        }}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            auction.isWatched ? 'fill-rose-500 text-rose-500' : isAntique ? 'text-[#8E764E]' : '',
          )}
        />
        {auction.isWatched ? 'Saved to Watchlist' : 'Add to Watchlist'}
      </Button>

      {t.totalMs > 0 && t.totalMs < 2 * 60 * 1000 && (
        <p className={cn('mt-4 px-3 py-2 text-xs', isAntique ? 'rounded border border-amber-200 bg-amber-50 text-amber-900' : 'rounded bg-warn/10 text-warn')}>
          Bids in the last 30 seconds extend the auction by 30 seconds.
        </p>
      )}

      <div className={cn('mt-6 flex justify-center pt-4', isAntique ? 'border-t border-[#F0ECE1]' : 'border-t border-line')}>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              navigate('/login');
              return;
            }
            setReportOpen(true);
          }}
          className={cn(
            'text-[11px] uppercase tracking-wider transition-colors',
            isAntique ? 'text-[#8E8070] hover:text-[#0E1622]' : 'text-muted hover:text-ink',
          )}
        >
          Report this item
        </button>
      </div>

      <ReportDialog auctionId={auction.id} open={reportOpen} onOpenChange={setReportOpen} />
      {settlement && (
        <>
          {disputeOpen && (
            <DisputeModal
              settlementId={settlement.id}
              onClose={() => setDisputeOpen(false)}
              onSuccess={() => {
                setDisputeOpen(false);
                qc.invalidateQueries({ queryKey: auctionKeys.detail(auction.id) });
                qc.invalidateQueries({ queryKey: auctionKeys.myWins() });
              }}
            />
          )}
          {shipOpen && (
            <ShipModal
              settlementId={settlement.id}
              auctionTitle={auction.title}
              onClose={() => setShipOpen(false)}
              onSuccess={() => {
                setShipOpen(false);
                qc.invalidateQueries({ queryKey: auctionKeys.detail(auction.id) });
              }}
            />
          )}
        </>
      )}
    </aside>
  );
};
