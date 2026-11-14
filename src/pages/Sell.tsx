import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useEarnings, useMyListings } from '@/features/auctions/hooks';
import { useBankAccount } from '@/features/wallet/hooks';
import { formatPrice } from '@/lib/format';
import { AuctionCard } from '@/features/auctions/components/AuctionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/features/auth/authStore';
import { api, extractApiError } from '@/lib/api';

// ── Ship Item Modal ───────────────────────────────────────────────────────
const ShipModal = ({
  settlementId,
  auctionTitle,
  onClose,
  onSuccess,
}: {
  settlementId: string;
  auctionTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!courierName.trim()) return toast.error('Enter the courier / carrier name');
    if (!trackingNumber.trim()) return toast.error('Enter the tracking number');
    setSubmitting(true);
    try {
      await api.post(`/settlements/${settlementId}/ship`, { courierName, trackingNumber });
      toast.success('Item marked as shipped!');
      onSuccess();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-canvas p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold">Dispatch Item</h3>
        <p className="mt-1 text-sm text-muted">
          Ship &ldquo;{auctionTitle}&rdquo; and provide tracking details.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Courier / Carrier Name</label>
            <input
              type="text"
              placeholder="e.g. India Post, Blue Dart, DTDC"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tracking Number / AWB</label>
            <input
              type="text"
              placeholder="e.g. EE123456789IN"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Mark as Shipped'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const SellPage = () => {
  const user = useAuthStore((s) => s.user);
  const listings = useMyListings();
  const earnings = useEarnings();
  const { data: bankData, isLoading: bankLoading } = useBankAccount(!!user);
  const needsBank = !!user && !bankLoading && !bankData?.bankAccount;
  const [shipModal, setShipModal] = useState<{ settlementId: string; title: string } | null>(null);

  const handleMarkDelivered = async (settlementId: string) => {
    try {
      await api.post(`/settlements/${settlementId}/delivered`);
      toast.success('Marked as delivered. Buyer inspection period started.');
      void listings.refetch();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  if (!user) {
    return (
      <div className="container py-20">
        <EmptyState
          title="Sign in to sell on Auréne"
          description="Join Auréne or sign in to list items for auction."
          action={
            <div className="flex gap-3">
              <Button asChild><Link to="/login">Sign In</Link></Button>
              <Button asChild variant="secondary"><Link to="/signup">Join Auréne</Link></Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Seller Dashboard</p>
          <h1 className="display-serif mt-2 text-display-lg font-semibold">My Listings</h1>
        </div>
        <Button asChild size="lg">
          <Link to="/sell/new">List an Item</Link>
        </Button>
      </div>

      {needsBank && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-ink-50/50 p-5">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 text-muted" />
            <div>
              <p className="font-medium">Link a bank account or UPI to receive payout proceeds</p>
              <p className="mt-0.5 text-sm text-muted">
                Required for payout disbursement following buyer inspection.
              </p>
            </div>
          </div>
          <Button asChild size="md">
            <Link to="/me/bank">Add bank account</Link>
          </Button>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Total Proceeds" value={earnings.data ? formatPrice(earnings.data.totalEarnings, true) : '—'} />
        <Stat label="Items Sold" value={earnings.data?.soldCount?.toString() ?? '—'} />
        <Stat label="Active Listings" value={(listings.data?.items.filter((a) => a.status === 'LIVE' || a.status === 'UPCOMING').length ?? 0).toString()} />
      </div>

      <div className="mt-12">
        {listings.isLoading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (listings.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No listings yet"
            description="When you list an item, it will appear here with live bidding and settlement tracking."
            action={<Button asChild><Link to="/sell/new">List an Item</Link></Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.data!.items.map((a) => {
              const settlement = (a as any).settlement as {
                id: string;
                status: string;
                shippedAt: string | null;
                trackingNumber: string | null;
                courierName: string | null;
                deliveredAt: string | null;
                shippingDeadline: string | null;
              } | undefined;

              const isEscrow = settlement?.status === 'ESCROW_HOLD';
              const isDelivered = settlement?.status === 'DELIVERED_PENDING';
              const isDisputed = settlement?.status === 'DISPUTED';
              const isCompleted = settlement?.status === 'COMPLETED';

              return (
                <div key={a.id} className="space-y-3">
                  <AuctionCard auction={a} />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={a.status === 'DRAFT' ? 'neutral' : a.status === 'LIVE' ? 'live' : a.status === 'SOLD' ? 'accent' : 'ink'}>
                      {a.status}
                    </Badge>
                    {isEscrow && <Badge tone="accent">Escrow</Badge>}
                    {isDisputed && <Badge tone="danger">Disputed</Badge>}
                    {isCompleted && <Badge tone="accent">Paid Out</Badge>}
                  </div>

                  {/* Escrow actions for the seller */}
                  {settlement && isEscrow && !settlement.shippedAt && (
                    <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
                      <p className="text-xs text-muted">
                        Buyer&apos;s payment is secured in escrow. Ship the item to receive your payout.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setShipModal({ settlementId: settlement.id, title: a.title })}
                      >
                        Dispatch Item
                      </Button>
                    </div>
                  )}

                  {settlement && isEscrow && settlement.shippedAt && (
                    <div className="rounded-md border border-line bg-ink-50/50 p-3">
                      <p className="text-xs text-muted">
                        Shipped via {settlement.courierName} · {settlement.trackingNumber}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => handleMarkDelivered(settlement.id)}
                      >
                        Mark as Delivered
                      </Button>
                    </div>
                  )}

                  {settlement && isDelivered && (
                    <div className="rounded-md border border-warn/30 bg-warn/5 p-3">
                      <p className="text-xs text-muted">
                        Buyer is inspecting the item. Funds will be released after verification.
                      </p>
                    </div>
                  )}

                  {settlement && isDisputed && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <p className="text-xs text-muted">
                        The buyer has raised a dispute. An admin is reviewing it.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ship Modal */}
      {shipModal && (
        <ShipModal
          settlementId={shipModal.settlementId}
          auctionTitle={shipModal.title}
          onClose={() => setShipModal(null)}
          onSuccess={() => {
            setShipModal(null);
            void listings.refetch();
          }}
        />
      )}
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-line bg-canvas p-6">
    <p className="kicker">{label}</p>
    <p className="mt-2 font-display text-2xl font-semibold tabular text-ink">{value}</p>
  </div>
);
