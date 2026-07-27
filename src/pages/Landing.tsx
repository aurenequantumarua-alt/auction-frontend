import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuctions } from '@/features/auctions/hooks';
import { AuctionCard, AuctionCardSkeleton } from '@/features/auctions/components/AuctionCard';

export const LandingPage = () => {
  const { data, isLoading } = useAuctions({ status: 'LIVE', sort: 'ending_soon', pageSize: 8 });

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="kicker">Curated since 2026</p>
            <h1 className="display-serif mt-4 text-display-xl font-semibold text-ink">
              An auction house <br />
              for the considered <em className="not-italic text-accent">wardrobe</em>.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted">
              Archive pieces, deadstock, and personal pulls — placed in front of an audience that knows the difference. New auctions every week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/browse">Browse live auctions <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/sell">List a piece</Link>
              </Button>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              <img
                src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&q=80"
                alt=""
                className="aspect-[3/4] w-full rounded-lg object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=80"
                alt=""
                className="mt-10 aspect-[3/4] w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="flex items-end justify-between">
          <div>
            <p className="kicker">Live now</p>
            <h2 className="display-serif mt-2 text-display-md font-semibold">Ending soonest</h2>
          </div>
          <Link to="/browse" className="text-sm text-muted hover:text-ink">
            View all →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <AuctionCardSkeleton key={i} />)
            : data?.items.map((a) => <AuctionCard key={a.id} auction={a} />)}
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
