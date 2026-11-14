import { Link } from 'react-router-dom';
import { useMyBids } from '@/features/auctions/hooks';
import { formatDateTime, formatPrice } from '@/lib/format';
import { sanitize } from '@/lib/sanitize';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const badgeTone: Record<string, 'live' | 'neutral' | 'accent' | 'warn' | 'danger'> = {
  ACTIVE: 'live',
  OUTBID: 'neutral',
  WON: 'accent',
  FORFEITED: 'danger',
  REFUNDED: 'warn',
};

export const BidHistoryPage = () => {
  const { data, isLoading } = useMyBids();

  return (
    <div className="container py-12">
      <p className="kicker">Activity</p>
      <h1 className="display-serif mt-2 text-display-lg font-semibold">My Bids</h1>

      <div className="mt-10">
        {isLoading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No bids yet"
            description="When you place a bid on an auction, it will appear here."
            action={<Button asChild><Link to="/browse">Explore Auctions</Link></Button>}
          />
        ) : (
          <ol className="overflow-hidden rounded-lg border border-line">
            {data!.items.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="aspect-square h-16 w-16 flex-none overflow-hidden rounded bg-ink-50">
                    {b.auction.images[0] && (
                      <img src={b.auction.images[0].url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="kicker">{b.auction.brand}</p>
                    <Link to={`/auctions/${b.auction.id}`} className="block truncate font-display text-base font-medium hover:underline">
                      {sanitize(b.auction.title)}
                    </Link>
                    {b.isRunnerUp && (
                      <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Winner has 24h to pay · You are next in line if they forfeit
                      </p>
                    )}
                    <p className="text-xs text-muted">{formatDateTime(b.placedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {b.isRunnerUp ? (
                    <span className="rounded px-2.5 py-1 text-xs font-medium uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      🥈 2nd Place · Next in Line
                    </span>
                  ) : (
                    <Badge tone={badgeTone[b.status] ?? 'neutral'}>{b.status}</Badge>
                  )}
                  <span className="font-display text-lg font-semibold tabular text-ink">
                    {formatPrice(b.amount, true)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
