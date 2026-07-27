import { Link } from 'react-router-dom';
import { useWatchlist } from '@/features/watchlist/hooks';
import { AuctionCard, AuctionCardSkeleton } from '@/features/auctions/components/AuctionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';

export const WatchlistPage = () => {
  const { data, isLoading } = useWatchlist();

  return (
    <div className="container py-12">
      <p className="kicker">Saved</p>
      <h1 className="display-serif mt-2 text-display-lg font-semibold">Your watchlist</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Pieces you&apos;re tracking. We&apos;ll notify you when bidding heats up or an auction is ending.
      </p>

      <div className="mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <AuctionCardSkeleton key={i} />)}
          </div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No saved auctions yet"
            description="Tap the heart on any auction to add it here."
            action={<Button asChild><Link to="/browse">Browse auctions</Link></Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data!.items.map((w) => <AuctionCard key={w.auctionId} auction={w.auction} />)}
          </div>
        )}
      </div>
    </div>
  );
};
