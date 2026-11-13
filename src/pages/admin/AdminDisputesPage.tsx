import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { api, extractApiError } from '@/lib/api';
import { formatDateTime, formatPrice, formatRelative } from '@/lib/format';
import { sanitize } from '@/lib/sanitize';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DisputeItem {
  id: string;
  reason: string;
  description: string;
  proofUrls: string[];
  status: 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_REJECTED';
  adminNotes: string | null;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  settlement: {
    id: string;
    trackingNumber: string | null;
    courierName: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    currentWinnerBid: { amount: string } | null;
    auction: {
      id: string;
      title: string;
      brand: string;
      images: { url: string }[];
      seller: { id: string; name: string; email: string };
    };
  };
}

const useDisputes = (statusFilter?: string) => {
  return useQuery({
    queryKey: ['admin', 'disputes', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get<{ items: DisputeItem[] }>(`/admin/disputes${params}`);
      return data;
    },
  });
};

const reasonLabel = (reason: string) => {
  switch (reason) {
    case 'COUNTERFEIT':
      return 'Counterfeit / Fake';
    case 'NOT_AS_DESCRIBED':
      return 'Not As Described';
    case 'DAMAGED':
      return 'Damaged';
    case 'WRONG_ITEM':
      return 'Wrong Item';
    case 'NOT_DELIVERED':
      return 'Not Delivered';
    default:
      return reason.replace(/_/g, ' ');
  }
};

export const AdminDisputesPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading, refetch } = useDisputes(statusFilter || undefined);
  const qc = useQueryClient();
  const [resolving, setResolving] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [proofViewer, setProofViewer] = useState<{ urls: string[]; index: number } | null>(null);

  const handleResolve = async (disputeId: string, action: 'APPROVE_REFUND' | 'DISMISS_DISPUTE') => {
    const confirmed = window.confirm(
      action === 'APPROVE_REFUND'
        ? 'Approve 100% refund to the buyer? Funds will be credited back to the buyer and cancelled for the seller.'
        : 'Dismiss dispute and release funds (90% seller / 10% admin wallet)? This cannot be undone.',
    );
    if (!confirmed) return;

    setResolving(disputeId);
    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, {
        action,
        adminNotes: adminNotes[disputeId]?.trim() || undefined,
      });
      toast.success(
        action === 'APPROVE_REFUND'
          ? '100% refund approved for buyer'
          : 'Dispute dismissed, funds released',
      );
      void refetch();
      qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Administration</p>
          <h1 className="display-serif mt-2 text-display-md font-semibold">Escrow Disputes</h1>
          <p className="mt-1 text-sm text-muted">
            Inspect buyer photo proof before approving a 100% refund or releasing funds.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink-50"
          >
            ← Back to Auctions
          </Link>
          <Link
            to="/admin/payouts"
            className="inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-800"
          >
            Payouts &amp; Profit
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['', 'OPEN', 'RESOLVED_REFUND', 'RESOLVED_REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-ink text-canvas'
                  : 'bg-ink-100 text-muted hover:bg-ink-200'
              }`}
            >
              {s === '' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No disputes"
            description="No disputes found matching the selected filter."
          />
        ) : (
          data!.items.map((d) => {
            const amount = d.settlement.currentWinnerBid?.amount ?? '0';
            const isOpen = d.status === 'OPEN';

            return (
              <div key={d.id} className="rounded-lg border border-line bg-canvas p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {d.settlement.auction.images[0] && (
                      <img
                        src={d.settlement.auction.images[0].url}
                        alt=""
                        className="h-16 w-16 flex-none rounded border border-line object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <Link
                        to={`/auctions/${d.settlement.auction.id}`}
                        className="inline-flex items-center gap-1.5 font-display text-base font-medium hover:underline"
                      >
                        {sanitize(d.settlement.auction.title)}
                        <ExternalLink className="h-3.5 w-3.5 text-muted" />
                      </Link>
                      <p className="text-xs text-muted">{d.settlement.auction.brand}</p>
                      <p className="mt-1 text-sm">
                        Held Amount:{' '}
                        <span className="font-semibold tabular">{formatPrice(amount, true)}</span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    tone={isOpen ? 'danger' : d.status === 'RESOLVED_REFUND' ? 'warn' : 'accent'}
                  >
                    {d.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-md bg-ink-50/50 p-3">
                    <p className="text-xs font-medium text-muted">Buyer</p>
                    <p className="text-sm font-medium">{sanitize(d.buyer.name)}</p>
                    <p className="text-xs text-muted">{d.buyer.email}</p>
                  </div>
                  <div className="rounded-md bg-ink-50/50 p-3">
                    <p className="text-xs font-medium text-muted">Seller</p>
                    <p className="text-sm font-medium">{sanitize(d.settlement.auction.seller.name)}</p>
                    <p className="text-xs text-muted">{d.settlement.auction.seller.email}</p>
                  </div>
                  <div className="rounded-md bg-ink-50/50 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-muted">
                      <Truck className="h-3.5 w-3.5" />
                      Shipment
                    </p>
                    {d.settlement.trackingNumber ? (
                      <>
                        <p className="text-sm font-medium">{d.settlement.courierName}</p>
                        <p className="font-mono text-xs text-ink">
                          {d.settlement.trackingNumber}
                        </p>
                        {d.settlement.shippedAt && (
                          <p className="mt-0.5 text-[11px] text-muted">
                            Shipped {formatDateTime(d.settlement.shippedAt)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted">No tracking submitted</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-muted">
                    Reason: <span className="text-ink">{reasonLabel(d.reason)}</span>
                    <span className="ml-2 text-muted">
                      · Submitted {formatRelative(d.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-ink">{sanitize(d.description)}</p>
                </div>

                {d.proofUrls.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted">
                      Buyer Proof ({d.proofUrls.length}{' '}
                      {d.proofUrls.length === 1 ? 'image' : 'images'} — click to inspect full size)
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {d.proofUrls.map((url, i) => (
                        <button
                          key={`${url}-${i}`}
                          type="button"
                          onClick={() => setProofViewer({ urls: d.proofUrls, index: i })}
                          className="group relative overflow-hidden rounded border border-line focus:outline-none focus:ring-2 focus:ring-ink"
                        >
                          <img
                            src={url}
                            alt={`Proof ${i + 1}`}
                            className="h-24 w-24 object-cover transition group-hover:opacity-80"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-warn">No proof images attached.</p>
                )}

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-line pt-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Admin Notes
                      </label>
                      <textarea
                        className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Decision notes (visible in dispute resolution history)…"
                        value={adminNotes[d.id] ?? ''}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({ ...prev, [d.id]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={resolving === d.id}
                        onClick={() => handleResolve(d.id, 'APPROVE_REFUND')}
                      >
                        Approve Full Refund ({formatPrice(amount, true)})
                      </Button>
                      <Button
                        size="sm"
                        disabled={resolving === d.id}
                        onClick={() => handleResolve(d.id, 'DISMISS_DISPUTE')}
                      >
                        Dismiss &amp; Release (90% / 10%)
                      </Button>
                    </div>
                  </div>
                )}

                {d.adminNotes && (
                  <div className="mt-3 rounded-md bg-ink-50/50 p-3">
                    <p className="text-xs font-medium text-muted">Admin Notes</p>
                    <p className="text-sm">{d.adminNotes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Full-size proof viewer */}
      {proofViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setProofViewer(null)}
        >
          <div
            className="w-full max-w-4xl rounded-xl bg-canvas p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">
                Evidence {proofViewer.index + 1} of {proofViewer.urls.length}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={proofViewer.urls[proofViewer.index]}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-ink-50"
                >
                  Open Original <ExternalLink className="h-3 w-3" />
                </a>
                <Button size="sm" variant="secondary" onClick={() => setProofViewer(null)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded bg-black/5">
              <img
                src={proofViewer.urls[proofViewer.index]}
                alt={`Proof ${proofViewer.index + 1}`}
                className="max-h-[68vh] w-auto rounded object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {proofViewer.urls.length > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={proofViewer.index === 0}
                  onClick={() =>
                    setProofViewer((prev) =>
                      prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null,
                    )
                  }
                >
                  ← Previous
                </Button>
                <div className="flex gap-1.5 overflow-x-auto">
                  {proofViewer.urls.map((url, idx) => (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => setProofViewer((prev) => (prev ? { ...prev, index: idx } : null))}
                      className={`h-10 w-10 overflow-hidden rounded border-2 ${
                        idx === proofViewer.index ? 'border-ink' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={proofViewer.index >= proofViewer.urls.length - 1}
                  onClick={() =>
                    setProofViewer((prev) =>
                      prev
                        ? { ...prev, index: Math.min(prev.urls.length - 1, prev.index + 1) }
                        : null,
                    )
                  }
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
