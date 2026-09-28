import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Scale, Sparkles, Gem, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AboutPage = () => {
  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="border-b border-line bg-subtle/30 py-20 lg:py-28">
        <div className="container max-w-4xl text-center">
          <p className="kicker">The Aurene Manifesto</p>
          <h1 className="display-serif mt-4 text-display-xl font-semibold text-ink leading-tight">
            Where archival fashion finds its rightful next custodian.
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            Aurene was founded on a singular conviction: exceptional garments are cultural artifacts, not disposable apparel. We built a high-transparency auction house designed for rare archive pulls, runway samples, and storied wardrobe pieces.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/browse">
                Explore live drops <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/sell">Apply to sell</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="container py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="kicker">The Auction Model</p>
            <h2 className="display-serif text-display-md font-semibold text-ink">
              The antidote to algorithmic resale.
            </h2>
            <p className="text-muted leading-relaxed">
              Standard resale marketplaces push sellers into lowball haggling and buyers into impulse flash-sales. The true value of a 1999 Martin Margiela artisanal piece or a pristine Lemaire overcoat cannot be dictated by an automated pricing algorithm.
            </p>
            <p className="text-muted leading-relaxed">
              At Aurene, pieces are cataloged with editorial care, exact structural measurements, and condition disclosures. The market decides their true worth through a transparent, time-delimited auction where genuine passion sets the price.
            </p>
          </div>
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80"
                alt="Archival garment curation"
                className="aspect-[3/4] w-full rounded-xl object-cover shadow-sm"
              />
              <div className="rounded-xl border border-line bg-card p-5">
                <div className="font-display font-semibold text-ink">Zero Counterfeits</div>
                <p className="mt-1 text-xs text-muted leading-normal">
                  Strict seller vetting, tag checks, and authenticity guarantees on every listed item.
                </p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-xl border border-line bg-card p-5">
                <div className="font-display font-semibold text-ink">Anti-Sniping Engine</div>
                <p className="mt-1 text-xs text-muted leading-normal">
                  Last-second bids extend the clock by 30 seconds so humans—not automated scripts—win.
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80"
                alt="Textile detail"
                className="aspect-[3/4] w-full rounded-xl object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="border-y border-line bg-subtle/40 py-20">
        <div className="container">
          <div className="max-w-2xl">
            <p className="kicker">Core Principles</p>
            <h2 className="display-serif mt-2 text-display-md font-semibold text-ink">
              Engineered with integrity and rigor.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-line bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">Fair Clock Protocols</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                No bot sniping. Bids placed in the final 30 seconds automatically extend the auction clock, giving real collectors an equal opportunity to respond.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">Fallback Bidder Chain</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                If the winning bidder defaults during the 24-hour payment window, the garment is automatically offered to the runner-up bidder without needing to re-list from scratch.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">Protected Escrow & Ledger</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Payments are securely processed via Razorpay with encrypted bank ledger accounting. Sellers receive their funds seamlessly once settlements are final.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Gem className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">Editorial Quality Standards</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Every listing requires multiple high-fidelity photographs of hardware, care labels, stitching, and honest wear notes so you know exactly what you are bidding on.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">Transparent 10% Economics</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                No hidden buyers' premiums, surprise platform surcharges, or opaque listing fees. We take a flat 10% commission only when an auction sells successfully.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-ink">Curator Community</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                From Tokyo vintage purveyors to private collectors in Mumbai and Delhi, Aurene connects true fashion archivists with respectful new owners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-card p-10 lg:p-14 shadow-sm">
          <p className="kicker">Get Started</p>
          <h2 className="display-serif mt-3 text-display-md font-semibold text-ink">
            Join the next drop.
          </h2>
          <p className="mt-4 text-muted">
            Whether you are hunting for an archival silhouette or parting with a curated gem, Aurene is your venue.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/browse">Browse Auctions</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
