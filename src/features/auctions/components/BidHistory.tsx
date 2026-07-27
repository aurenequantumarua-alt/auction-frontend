import { formatDateTime, formatPrice } from '@/lib/format';
import { type BidEntry } from '../types';
import { cn } from '@/lib/cn';

interface BidHistoryProps {
  bids: BidEntry[];
  highlightedBidId?: string | null;
}

export const BidHistory = ({ bids, highlightedBidId }: BidHistoryProps) => {
  if (bids.length === 0) {
    return (
      <div className="rounded-lg border border-line p-6 text-sm text-muted">
        No bids yet — be the first to make an offer.
      </div>
    );
  }

  return (
    <ol className="overflow-hidden rounded-lg border border-line">
      {bids.map((b, idx) => {
        const isTop = idx === 0;
        return (
          <li
            key={b.id}
            className={cn(
              'flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0',
              isTop && 'bg-success/5',
              highlightedBidId === b.id && 'animate-pulse-bid',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-medium text-ink-600">
                {b.bidder.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{b.bidder.name}</p>
                <p className="text-xs text-muted">{formatDateTime(b.placedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {b.status === 'WON' && (
                <span className="rounded bg-success/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-kicker text-success">
                  Winning
                </span>
              )}
              {b.status === 'FORFEITED' && (
                <span className="rounded bg-danger/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-kicker text-danger">
                  Forfeited
                </span>
              )}
              <span
                className={cn(
                  'font-display text-base font-semibold tabular',
                  isTop ? 'text-ink' : 'text-muted line-through',
                )}
              >
                {formatPrice(b.amount, true)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
