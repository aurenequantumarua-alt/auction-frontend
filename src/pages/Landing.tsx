import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuctions } from '@/features/auctions/hooks';
import { AuctionCard, AuctionCardSkeleton } from '@/features/auctions/components/AuctionCard';

export const LandingPage = () => {
  const { data: newestData, isLoading: isNewestLoading } = useAuctions({
    status: 'LIVE',
    sort: 'newest',
    pageSize: 8,
  });

  const { data: endingSoonData, isLoading: isEndingSoonLoading } = useAuctions({
    status: 'LIVE',
    sort: 'ending_soon',
    pageSize: 8,
  });

  const newestAuctions = (newestData?.items ?? []).filter(
    (a) => a.status === 'LIVE' && new Date(a.endsAt).getTime() > Date.now(),
  );

  const endingSoonAuctions = (endingSoonData?.items ?? []).filter(
    (a) => a.status === 'LIVE' && new Date(a.endsAt).getTime() > Date.now(),
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="kicker">Curated since 2026</p>
            <h1 className="display-serif mt-4 text-display-xl font-semibold text-ink">
              An auction house <br />
              for exceptional <em className="not-italic text-accent">antiques &amp; storied pieces</em>.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted">
              Documented provenance, verified authenticity, and our 48-hour escrow inspection guarantee. Discover extraordinary pieces with history.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/browse?sort=newest">Explore Live Auctions <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/antiques">Antiques</Link>
              </Button>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80"
                alt="Fine Horology & Antiques"
                className="aspect-[3/4] w-full rounded-lg object-cover shadow-sm"
              />
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&q=80"
                alt="Heritage Art & Artifacts"
                className="mt-10 aspect-[3/4] w-full rounded-lg object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 1. First: Newest listings */}
      <section className="container py-16 lg:py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="kicker">Recently Catalogued</p>
            <h2 className="display-serif mt-2 text-display-md font-semibold">Newest listings</h2>
          </div>
          <Link to="/browse?sort=newest" className="text-sm text-muted hover:text-ink">
            View all newest →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {isNewestLoading ? (
            Array.from({ length: 4 }).map((_, i) => <AuctionCardSkeleton key={i} />)
          ) : newestAuctions.length > 0 ? (
            newestAuctions.map((a) => <AuctionCard key={a.id} auction={a} />)
          ) : (
            <div className="col-span-full rounded-xl border border-line bg-canvas p-12 text-center">
              <p className="font-display text-lg font-medium text-ink">No live auctions right now</p>
              <p className="mt-2 text-sm text-muted">Check back soon for upcoming auctions, or list an item.</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Then: Ending soonest */}
      <section className="container border-t border-line py-16 lg:py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="kicker">Live now</p>
            <h2 className="display-serif mt-2 text-display-md font-semibold">Ending soonest</h2>
          </div>
          <Link to="/browse?sort=ending_soon" className="text-sm text-muted hover:text-ink">
            View all ending soon →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {isEndingSoonLoading ? (
            Array.from({ length: 4 }).map((_, i) => <AuctionCardSkeleton key={i} />)
          ) : endingSoonAuctions.length > 0 ? (
            endingSoonAuctions.map((a) => <AuctionCard key={a.id} auction={a} />)
          ) : (
            <div className="col-span-full rounded-xl border border-line bg-canvas p-12 text-center">
              <p className="font-display text-lg font-medium text-ink">No auctions ending soon</p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-ink-50/40 py-20">
        <div className="container grid gap-10 lg:grid-cols-3">
          {[
            { kicker: '01', title: 'Bid in real time', body: 'Live updates, anti-snipe extensions, and transparent bid history. The auction floor, on your screen.' },
            { kicker: '02', title: 'Authenticated by curators', body: 'Every listing is reviewed before going live. We turn away anything we wouldn’t buy ourselves.' },
            { kicker: '03', title: 'A real fallback chain', body: 'If the winner doesn’t pay in time, the next-highest bidder is offered the piece. No relisting friction.' },
          ].map((f) => (
            <div key={f.kicker}>
              <p className="kicker">{f.kicker}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{f.title}</h3>
              <p className="mt-3 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
