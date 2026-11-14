import { formatDateTime, formatPrice } from '@/lib/format';
import { type BidEntry } from '../types';
import { cn } from '@/lib/cn';
import { sanitize } from '@/lib/sanitize';

interface BidHistoryProps {
  bids: BidEntry[];
  highlightedBidId?: string | null;
  isAntique?: boolean;
}

export const BidHistory = ({ bids, highlightedBidId, isAntique }: BidHistoryProps) => {
  if (bids.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg p-6 text-sm',
          isAntique
            ? 'border border-[#E5E0D8] bg-white text-[#5C6675] shadow-sm'
            : 'border border-line text-muted',
        )}
      >
        {isAntique
          ? 'No bids placed yet. Be the first to bid on this piece.'
          : 'No bids placed yet — be the first to bid.'}
      </div>
    );
  }

  const topBid = bids[0];
  const runnerUpBid = bids.find(
    (b) => b.bidder.id !== topBid?.bidder.id && b.status !== 'FORFEITED',
  );

  return (
    <ol
      className={cn(
        'overflow-hidden rounded-lg',
        isAntique
          ? 'border border-[#E5E0D8] bg-white shadow-sm'
          : 'border border-line',
      )}
    >
      {bids.map((b, idx) => {
        const isTop = idx === 0;
        const isRunnerUp = b.id === runnerUpBid?.id && b.status === 'OUTBID';
        return (
          <li
            key={b.id}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              isAntique
                ? 'border-b border-[#F0ECE1] last:border-b-0 text-sm'
                : 'border-b border-line last:border-b-0',
              isTop && (isAntique ? 'bg-[#FAF7F0]' : 'bg-success/5'),
              isRunnerUp && (isAntique ? 'bg-[#FAF9F5]' : 'bg-amber-500/5'),
              highlightedBidId === b.id && 'animate-pulse-bid',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center text-xs font-medium rounded-full',
                  isAntique
                    ? 'border border-[#B89C6F]/40 bg-[#0E1622] text-[#E8DCC8]'
                    : 'bg-ink-100 text-ink-600',
                )}
              >
                {b.bidder.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={cn('font-medium', isAntique ? 'text-[#0E1622]' : 'text-sm text-ink')}>
                  {sanitize(b.bidder.name)}
                  {isAntique && isTop && (
                    <span className="ml-2 text-[10px] uppercase font-sans tracking-wider border border-[#B89C6F]/40 bg-[#F4EFE6] text-[#7A633F] px-1.5 py-0.5 rounded font-medium">
                      Leading Bid
                    </span>
                  )}
                  {isRunnerUp && (
                    <span
                      className={cn(
                        'ml-2 text-[10px] uppercase font-sans tracking-wider px-1.5 py-0.5 rounded font-medium',
                        isAntique
                          ? 'border border-[#B89C6F]/40 bg-[#FAF7F0] text-[#7A633F]'
                          : 'border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400',
                      )}
                    >
                      🥈 2nd Place · Next in Line
                    </span>
                  )}
                </p>
                <p className={cn('text-xs', isAntique ? 'text-[#7A8699]' : 'text-muted')}>
                  {formatDateTime(b.placedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {b.status === 'WON' && (
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-kicker',
                    isAntique
                      ? 'border border-[#B89C6F]/40 bg-emerald-50 text-emerald-800'
                      : 'bg-success/10 text-success',
                  )}
                >
                  Acquired
                </span>
              )}
              {b.status === 'FORFEITED' && (
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-kicker',
                    isAntique
                      ? 'border border-red-200 bg-red-50 text-red-800'
                      : 'bg-danger/10 text-danger',
                  )}
                >
                  Forfeited
                </span>
              )}
              <span
                className={cn(
                  'tabular font-semibold',
                  isAntique
                    ? isTop
                      ? 'font-serif text-lg text-[#0E1622]'
                      : 'text-sm text-[#7A8699] line-through'
                    : isTop
                      ? 'font-display text-base text-ink'
                      : 'font-display text-base text-muted line-through',
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
