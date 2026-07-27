import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type AuctionListItem } from '../types';
import { formatPrice } from '@/lib/format';
import { Countdown } from '@/components/common/Countdown';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface AuctionCardProps {
  auction: AuctionListItem;
  className?: string;
}

/**
 * Compute the effective display status. If the server says LIVE but `endsAt`
 * has already passed (e.g. because the lifecycle job hasn't run yet), we treat
 * the auction as ENDED on the client side.
 */
const effectiveStatus = (auction: AuctionListItem): AuctionListItem['status'] => {
  if (auction.status === 'LIVE' && new Date(auction.endsAt).getTime() <= Date.now()) {
    return 'ENDED';
  }
  if (auction.status === 'UPCOMING' && new Date(auction.startsAt).getTime() <= Date.now()) {
    // Start time passed but server hasn't flipped to LIVE yet
    if (new Date(auction.endsAt).getTime() <= Date.now()) return 'ENDED';
    return 'LIVE';
  }
  return auction.status;
};

export const AuctionCard = ({ auction, className }: AuctionCardProps) => {
  const cover = auction.images.find((i) => i.isCover) ?? auction.images[0];
  const currentAmount = auction.currentBid?.amount ?? auction.basePrice;
  const status = effectiveStatus(auction);
  const isLive = status === 'LIVE';
  const isUpcoming = status === 'UPCOMING';
  const isEnded = status === 'ENDED' || status === 'EXPIRED';

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('group relative', className)}
    >
      <Link
        to={`/auctions/${auction.id}`}
        className="block focus:outline-none"
        aria-label={`${auction.brand} ${auction.title}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-ink-50">
          {cover && (
            <img
              src={cover.url}
              alt={`${auction.brand} ${auction.title}`}
              className={cn(
                'h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
                isEnded && 'opacity-70 grayscale-[30%]',
              )}
              loading="lazy"
            />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {isLive && (
              <Badge tone="live" className="backdrop-blur bg-canvas/85">
                <StatusDot tone="live" />
                Live
              </Badge>
            )}
            {isUpcoming && (
              <Badge tone="ink" className="backdrop-blur">Upcoming</Badge>
            )}
            {isEnded && (
              <Badge tone="neutral" className="backdrop-blur bg-canvas/85">Ended</Badge>
            )}
            {status === 'SOLD' && <Badge tone="accent">Sold</Badge>}
            {status === 'CANCELLED' && <Badge tone="danger">Cancelled</Badge>}
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="kicker">{auction.brand}</p>
          <h3 className="font-display text-lg font-medium leading-tight text-ink line-clamp-2">
            {auction.title}
          </h3>
          <div className="flex items-baseline justify-between pt-1.5">
            <div>
              <p className="text-[11px] uppercase tracking-kicker text-muted">
                {isEnded ? 'Final bid' : auction.currentBid ? 'Current bid' : 'Starting at'}
              </p>
              <p className="font-display text-xl font-semibold tabular text-ink">
                {formatPrice(currentAmount, true)}
              </p>
            </div>
            <div className="text-right">
              {isEnded ? (
                <p className="text-sm font-medium text-muted">Ended</p>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-kicker text-muted">
                    {isUpcoming ? 'Starts' : 'Ends'}
                  </p>
                  {isUpcoming ? (
                    <Countdown endsAt={auction.startsAt} compact className="text-sm font-medium" />
                  ) : (
                    <Countdown endsAt={auction.endsAt} compact className="text-sm font-medium" />
                  )}
                </>
              )}
            </div>
          </div>
          {auction.bidCount > 0 && (
            <p className="text-xs text-muted">
              {auction.bidCount} bid{auction.bidCount === 1 ? '' : 's'} · Size {auction.size}
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
};

export const AuctionCardSkeleton = () => (
  <div className="space-y-4">
    <div className="aspect-[4/5] animate-pulse rounded-lg bg-ink-50" />
    <div className="space-y-2">
      <div className="h-3 w-20 animate-pulse rounded bg-ink-50" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-ink-50" />
      <div className="flex justify-between pt-2">
        <div className="h-6 w-24 animate-pulse rounded bg-ink-50" />
        <div className="h-6 w-20 animate-pulse rounded bg-ink-50" />
      </div>
    </div>
  </div>
);
