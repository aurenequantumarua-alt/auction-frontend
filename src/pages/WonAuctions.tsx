import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useMyWins } from '@/features/auctions/hooks';
import { formatPrice, formatRelative } from '@/lib/format';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, extractApiError } from '@/lib/api';
import { loadRazorpay } from '@/lib/razorpay';
import { useAuthStore } from '@/features/auth/authStore';
import { sanitize } from '@/lib/sanitize';
import { DisputeModal } from '@/features/auctions/components/DisputeModal';

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

// ── Inspection Countdown ──────────────────────────────────────────────────
const InspectionCountdown = ({ deadline }: { deadline: string }) => {
  const [now, setNow] = useState(Date.now());
  // Update every second
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return (() => clearInterval(id)) as unknown as void;
  });
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

// ── Settlement status helpers ─────────────────────────────────────────────
type SettlementStatus = 'AWAITING_PAYMENT' | 'ESCROW_HOLD' | 'DELIVERED_PENDING' | 'DISPUTED' | 'COMPLETED' | 'REFUNDED' | 'EXHAUSTED';

const statusBadgeTone = (status: SettlementStatus): 'warn' | 'accent' | 'neutral' | 'danger' => {
  switch (status) {
    case 'AWAITING_PAYMENT': return 'warn';
    case 'ESCROW_HOLD': return 'accent';
    case 'DELIVERED_PENDING': return 'warn';
    case 'DISPUTED': return 'danger';
    case 'COMPLETED': return 'accent';
    case 'REFUNDED': return 'neutral';
    case 'EXHAUSTED': return 'neutral';
    default: return 'neutral';
  }
};

const statusLabel = (status: SettlementStatus): string => {
  switch (status) {
    case 'AWAITING_PAYMENT': return 'Payment Pending';
    case 'ESCROW_HOLD': return 'Funds in Escrow';
    case 'DELIVERED_PENDING': return 'Inspecting';
    case 'DISPUTED': return 'Under Review';
    case 'COMPLETED': return 'Completed';
    case 'REFUNDED': return 'Refunded';
    case 'EXHAUSTED': return 'Expired';
  }
};

// ── Main Page ─────────────────────────────────────────────────────────────
export const WonAuctionsPage = () => {
  const { data, isLoading, refetch } = useMyWins();
  const user = useAuthStore((s) => s.user);
  const [disputeSettlementId, setDisputeSettlementId] = useState<string | null>(null);

  const handleCheckout = async (settlementId: string) => {
    try {
      const { data: res } = await api.post<CheckoutResponse>(`/payments/checkout/${settlementId}`);

      if (res.provider !== 'razorpay') {
        toast.error('Payment gateway is currently unavailable. Please try again.');
        return;
      }

      await loadRazorpay();
      if (!window.Razorpay) {
        toast.error('Could not load the payment SDK.');
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
            toast.success('Payment secured in Escrow! Wait for the seller to ship.');
          } catch {
            toast.info(
              'Payment received! Your order will be confirmed shortly.',
              { duration: 6000 },
            );
          } finally {
            void refetch();
          }
        },
        modal: { ondismiss: () => toast.info('Payment cancelled.') },
      });
      rzp.on('payment.failed', (r) => toast.error(r.error?.description ?? 'Payment failed.'));
      rzp.open();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const handleMarkDelivered = async (settlementId: string) => {
    try {
      await api.post(`/settlements/${settlementId}/delivered`);
      toast.success('Marked as delivered. Inspection period started.');
      void refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  const handleConfirmRelease = async (settlementId: string) => {
    if (!window.confirm('Confirm that the item is authentic? This will release funds to the seller.')) return;
    try {
      await api.post(`/settlements/${settlementId}/confirm`);
      toast.success('Funds released to the seller!');
      void refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <div className="container py-12">
      <p className="kicker">Won</p>
      <h1 className="display-serif mt-2 text-display-lg font-semibold">Auctions you&apos;ve won</h1>

      <div className="mt-10 space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No wins yet"
            description="Once you win an auction, it appears here for checkout."
            action={<Button asChild><Link to="/browse">Browse</Link></Button>}
          />
        ) : (
          data!.items.map((w) => {
            const settlement = w.auction.settlement;
            const status = settlement?.status;
            const isPending = status === 'AWAITING_PAYMENT';
            const isEscrow = status === 'ESCROW_HOLD';
            const isDeliveredPending = status === 'DELIVERED_PENDING';
            const isDisputed = status === 'DISPUTED';
            const isCompleted = status === 'COMPLETED';
            const isRefunded = status === 'REFUNDED';

            return (
              <div key={w.id} className="rounded-lg border border-line bg-canvas p-5">
                <div className="sm:flex sm:items-center sm:gap-5">
                  <div className="aspect-square h-24 w-24 flex-none overflow-hidden rounded bg-ink-50">
                    {w.auction.images[0] && <img src={w.auction.images[0].url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />}
                  </div>
                  <div className="mt-3 flex-1 sm:mt-0">
                    <p className="kicker">{w.auction.brand}</p>
                    <Link to={`/auctions/${w.auction.id}`} className="block font-display text-lg font-medium hover:underline">
                      {sanitize(w.auction.title)}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      Winning bid <span className="font-medium text-ink">{formatPrice(w.amount, true)}</span>
                      {settlement && isPending && (
                        <> · Pay by <span className="text-warn">{formatRelative(settlement.paymentDeadline)}</span></>
                      )}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0">
                    {settlement && (
                      <Badge tone={statusBadgeTone(status!)}>{statusLabel(status!)}</Badge>
                    )}
                    {isPending && settlement && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => handleCheckout(settlement.id)}>
                          Pay {formatPrice(w.amount, true)}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Escrow status details ─────────────────────────────── */}
                {settlement && isEscrow && (
                  <div className="mt-4 rounded-md border border-accent/30 bg-accent/5 p-4">
                    <p className="text-sm font-medium text-accent">🔒 Funds Protected in Escrow</p>
                    {settlement.shippedAt ? (
                      <div className="mt-2 text-sm text-muted">
                        <p>Shipped via <span className="font-medium text-ink">{settlement.courierName}</span> · Tracking: <span className="font-mono text-ink">{settlement.trackingNumber}</span></p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleMarkDelivered(settlement.id)}>
                            I Received the Item
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setDisputeSettlementId(settlement.id)}>
                            Report Issue / Not Delivered
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted">Waiting for the seller to ship your item…</p>
                    )}
                  </div>
                )}

                {settlement && isDeliveredPending && (
                  <div className="mt-4 rounded-md border border-warn/30 bg-warn/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-warn">⏱ Inspection Window</p>
                        <p className="mt-1 text-sm text-muted">
                          Verify authenticity within{' '}
                          {settlement.inspectionDeadline && (
                            <InspectionCountdown deadline={settlement.inspectionDeadline} />
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleConfirmRelease(settlement.id)}>
                        ✓ Item is Authentic — Release Funds
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDisputeSettlementId(settlement.id)}>
                        ✗ Report Issue / Fake
                      </Button>
                    </div>
                  </div>
                )}

                {settlement && isDisputed && (
                  <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-sm font-medium text-destructive">🛑 Under Admin Review</p>
                    <p className="mt-1 text-sm text-muted">
                      Your dispute is being reviewed. Funds remain locked in escrow until the admin resolves it.
                    </p>
                    {settlement.dispute && (
                      <p className="mt-1 text-xs text-muted">
                        Reason: {settlement.dispute.reason.replace(/_/g, ' ')} · Submitted {formatRelative(settlement.dispute.createdAt)}
                      </p>
                    )}
                  </div>
                )}

                {settlement && isCompleted && (
                  <div className="mt-4 rounded-md border border-accent/30 bg-accent/5 p-4">
                    <p className="text-sm font-medium text-accent">✓ Transaction Complete</p>
                    <p className="mt-1 text-sm text-muted">Funds released to the seller. Enjoy your purchase!</p>
                  </div>
                )}

                {settlement && isRefunded && (
                  <div className="mt-4 rounded-md border border-line bg-ink-50/50 p-4">
                    <p className="text-sm font-medium text-ink">↩ Refunded</p>
                    <p className="mt-1 text-sm text-muted">
                      The payment has been refunded to your wallet.
                      {settlement.dispute?.status === 'RESOLVED_REFUND' && ' Your dispute was approved.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dispute Modal */}
      {disputeSettlementId && (
        <DisputeModal
          settlementId={disputeSettlementId}
          onClose={() => setDisputeSettlementId(null)}
          onSuccess={() => {
            setDisputeSettlementId(null);
            void refetch();
          }}
        />
      )}
    </div>
  );
};
