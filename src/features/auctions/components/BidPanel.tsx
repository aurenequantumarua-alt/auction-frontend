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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Countdown } from '@/components/common/Countdown';
import { Badge, StatusDot } from '@/components/ui/Badge';
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
        {isLive && ' · You can still claim it'}
        {ended && isWinner && ' · You won this auction'}
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

      <div className="mt-5 flex items-center justify-between border-y border-line py-3 text-sm">
        <span className="text-muted">
          {isUpcoming ? 'Bidding opens in' : ended ? 'Auction ended' : 'Time left'}
        </span>
        <Countdown
          endsAt={isUpcoming ? auction.startsAt : auction.endsAt}
          className="font-medium"
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
                Complete your payment to secure this item. Your funds are protected in{' '}
                <strong>platform Escrow</strong> and will only be released after you receive and
                inspect the item.
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
                🔒 Protected by Aurene Escrow Guarantee
              </p>
            </div>
          )}

          {isPaymentPending && isPaymentExpired && (
            <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 space-y-2 text-xs text-muted">
              <p className="font-medium text-warn flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Payment Window Expired
              </p>
              <p>The payment deadline for this auction has lapsed. This claim has been forfeited.</p>
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
                    ✗ Report Issue / Not Delivered
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  The seller has been notified to ship your item. Tracking info will be shown here
                  once dispatched.
                </p>
              )}
            </div>
          )}

          {/* Status 3: Delivered, 48h Inspection Window */}
          {settlement && settlementStatus === 'DELIVERED_PENDING' && (
            <div className="rounded-xl border border-warn/30 bg-warn/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-warn">
                <span>⏱ 48h Inspection Window</span>
                {settlement.inspectionDeadline && (
                  <InspectionCountdown deadline={settlement.inspectionDeadline} />
                )}
              </div>
              <p className="text-xs text-muted">
                Please verify that the item is authentic and as described.
              </p>
              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-accent text-white hover:bg-accent/90"
                  onClick={() => handleConfirmRelease(settlement.id)}
                >
                  ✓ Item is Authentic — Release Funds
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="w-full"
                  onClick={() => setDisputeOpen(true)}
                >
                  ✗ Report Issue / Counterfeit
                </Button>
              </div>
            </div>
          )}

          {/* Status 4: Disputed */}
          {settlementStatus === 'DISPUTED' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <p className="font-semibold text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Dispute Under Admin Review
              </p>
              <p className="text-xs text-muted">
                Our support team is reviewing your dispute evidence. Escrow funds will remain safely
                locked until resolution.
              </p>
            </div>
          )}

          {/* Status 5: Completed */}
          {settlementStatus === 'COMPLETED' && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-1">
              <p className="font-semibold text-sm text-accent">✓ Order Completed</p>
              <p className="text-xs text-muted">
                Item confirmed authentic & funds released to seller.
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
              <p className="text-xs text-muted">The funds have been returned to your wallet.</p>
            </div>
          )}
        </div>
      ) : isOwner ? (
        /* ── SELLER VIEW ───────────────────────────────────────────────── */
        <div className="mt-5 space-y-3">
          <p className="rounded bg-ink-50 px-3 py-2 text-sm text-muted">
            This is your listing.
          </p>
          {isPaymentPending && !isPaymentExpired && (
            <div className="rounded-md border border-warn/30 bg-warn/5 p-3 text-xs text-muted">
              <p className="font-medium text-warn">⏳ Payment Pending</p>
              <p className="mt-1">
                The winning bidder has 24 hours to complete checkout into platform Escrow.
              </p>
            </div>
          )}
          {isPaymentPending && isPaymentExpired && (
            <div className="rounded-md border border-warn/30 bg-warn/5 p-3 text-xs text-muted">
              <p className="font-medium text-warn">⏳ Payment Window Expired</p>
              <p className="mt-1">
                The winning bidder did not complete payment within the deadline.
              </p>
            </div>
          )}
          {settlement && settlementStatus === 'ESCROW_HOLD' && (
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-xs text-muted space-y-2">
              <p className="font-medium text-accent">🔒 Buyer Paid — Funds in Escrow</p>
              {!settlement.shippedAt ? (
                <>
                  <p>Please dispatch the item and enter the tracking details.</p>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShipOpen(true)}
                  >
                    <Truck className="h-4 w-4" />
                    Dispatch Item & Enter Tracking
                  </Button>
                </>
              ) : (
                <p>
                  Shipped via <strong>{settlement.courierName}</strong> ({settlement.trackingNumber}).
                  Waiting for buyer inspection.
                </p>
              )}
            </div>
          )}
          {settlementStatus === 'DELIVERED_PENDING' && (
            <div className="rounded-md border border-warn/30 bg-warn/5 p-3 text-xs text-muted">
              <p className="font-medium text-warn">📦 Item Delivered</p>
              <p className="mt-1">Buyer 48-hour inspection period is in progress.</p>
            </div>
          )}
          {settlementStatus === 'COMPLETED' && (
            <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-xs text-muted">
              <p className="font-medium text-accent">✓ Sale Completed</p>
              <p className="mt-1">90% sale funds have been credited to your wallet balance.</p>
            </div>
          )}
        </div>
      ) : isUpcoming ? (
        <p className="mt-5 rounded bg-ink-50 px-3 py-2 text-sm text-muted">
          This auction hasn&apos;t started yet. We&apos;ll open bidding the moment it goes live.
        </p>
      ) : ended ? (
        <div className="mt-5 rounded bg-ink-50 px-3 py-2 text-sm text-muted">
          {effectiveStatus === 'PAYMENT_PENDING'
            ? 'Bidding is closed. Pending payment from winning bidder.'
            : effectiveStatus === 'SOLD'
              ? 'This item has been sold.'
              : effectiveStatus === 'EXPIRED'
                ? 'This auction has expired.'
                : 'Bidding is closed for this auction.'}
        </div>
      ) : (
        /* ── LIVE BIDDING FORM ─────────────────────────────────────────── */
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
              Enter {formatPrice(minNext, true)} or more (current bid +{' '}
              {formatPrice(auction.minIncrement, true)} increment)
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={placeBid.isPending}>
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
