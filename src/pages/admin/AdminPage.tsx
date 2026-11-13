import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/features/admin/api';
import { Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

type StatusFilter = 'ALL' | 'LIVE' | 'ENDED' | 'UPCOMING' | 'SOLD' | 'CANCELLED' | 'DRAFT';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'LIVE', label: 'Live' },
  { value: 'ENDED', label: 'Ended' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DRAFT', label: 'Draft' },
];

const STATUS_COLORS: Record<string, string> = {
  LIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ENDED: 'bg-stone-100 text-stone-600 border-stone-200',
  UPCOMING: 'bg-blue-50 text-blue-700 border-blue-200',
  SOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  DRAFT: 'bg-gray-100 text-gray-500 border-gray-200',
  EXPIRED: 'bg-stone-100 text-stone-500 border-stone-200',
  PAYMENT_PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

/**
 * Compute the effective display status for admin view. Mirrors the
 * client-side logic in AuctionCard to account for lifecycle jobs that
 * haven't fired yet (e.g. when Redis is unavailable).
 */
const effectiveStatus = (auction: any): string => {
  if (auction.status === 'LIVE' && new Date(auction.endsAt).getTime() <= Date.now()) {
    return 'ENDED';
  }
  if (auction.status === 'UPCOMING' && new Date(auction.startsAt).getTime() <= Date.now()) {
    if (new Date(auction.endsAt).getTime() <= Date.now()) return 'ENDED';
    return 'LIVE';
  }
  return auction.status;
};

export const AdminPage = () => {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuctions();
      setAuctions(data);
    } catch (error) {
      toast.error('Failed to fetch auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to completely remove this auction?')) return;
    try {
      await adminApi.deleteAuction(id);
      toast.success('Auction deleted successfully');
      setAuctions(auctions.filter((a) => a.id !== id));
    } catch (error) {
      toast.error('Failed to delete auction');
    }
  };

  // Apply client-side effective status and filter
  const enriched = auctions.map((a) => ({ ...a, _effectiveStatus: effectiveStatus(a) }));
  const filtered = filter === 'ALL'
    ? enriched
    : enriched.filter((a) => a._effectiveStatus === filter);

  const counts = enriched.reduce<Record<string, number>>((acc, a) => {
    acc[a._effectiveStatus] = (acc[a._effectiveStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="kicker">Administration</p>
          <h1 className="display-serif mt-2 text-display-md font-semibold">All Auctions</h1>
          <p className="mt-1 text-sm text-muted">
            {enriched.length} total auction{enriched.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/payouts"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-800"
          >
            Payouts &amp; Profit
          </Link>
          <Link
            to="/admin/disputes"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink-50"
          >
            Disputes
          </Link>
          <Link
            to="/admin/reports"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink-50"
          >
            User Reports
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted" />
        {STATUS_OPTIONS.map((opt) => {
          const count = opt.value === 'ALL' ? enriched.length : (counts[opt.value] || 0);
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`
                inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-ink text-canvas border-ink shadow-sm'
                  : 'bg-canvas text-muted border-line hover:border-ink/30 hover:text-ink'}
              `}
            >
              {opt.label}
              <span className={`
                inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold
                ${isActive ? 'bg-canvas/20 text-canvas' : 'bg-ink-50 text-ink-400'}
              `}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Loading auctions…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-ink-50/40">
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted">Title</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted">Seller</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted">Status</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted">Base Price</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted">Current Bid</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted">Bids</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-kicker text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((auction) => (
                <tr
                  key={auction.id}
                  className="border-b border-line/50 hover:bg-ink-50/30 transition-colors"
                >
                  <td className="p-4">
                    <Link
                      to={`/auctions/${auction.id}`}
                      className="group/link inline-block"
                    >
                      <span className="font-medium text-ink group-hover/link:text-accent transition-colors underline decoration-transparent group-hover/link:decoration-accent underline-offset-2">
                        {auction.title}
                      </span>
                      <span className="block text-[11px] text-muted font-mono truncate max-w-[200px]">
                        {auction.id}
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-ink-600">
                    {auction.seller?.name || 'Unknown'}
                  </td>
                  <td className="p-4">
                    <span className={`
                      inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider
                      ${STATUS_COLORS[auction._effectiveStatus] || 'bg-gray-100 text-gray-500 border-gray-200'}
                    `}>
                      {auction._effectiveStatus === 'LIVE' && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                      )}
                      {auction._effectiveStatus}
                    </span>
                  </td>
                  <td className="p-4 text-sm tabular font-medium text-ink">₹{auction.basePrice}</td>
                  <td className="p-4 text-sm tabular text-ink-600">
                    {auction.currentBid ? `₹${auction.currentBid.amount}` : '—'}
                  </td>
                  <td className="p-4 text-sm tabular text-ink-600">{auction.bidCount ?? 0}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(auction.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                      title="Remove Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted">
                    {auctions.length === 0
                      ? 'No auctions found.'
                      : `No ${filter.toLowerCase()} auctions found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {!loading && enriched.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-6 text-xs text-muted">
          <span>Showing {filtered.length} of {enriched.length} auctions</span>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="text-accent hover:underline underline-offset-2"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};
