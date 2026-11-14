import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Landmark,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useAuctions } from '@/features/auctions/hooks';
import { useThemeStore } from '@/features/theme/themeStore';
import { formatPrice } from '@/lib/format';
import { Countdown } from '@/components/common/Countdown';
import { sanitize } from '@/lib/sanitize';
import { cn } from '@/lib/cn';

const SORTS = [
  { value: 'ending_soon', label: 'Ending soonest' },
  { value: 'highest_bid', label: 'Highest valuation' },
  { value: 'newest', label: 'Recently catalogued' },
  { value: 'most_bids', label: 'Most contested' },
] as const;

export const AntiquesLuxePage = () => {
  const setAntiqueMode = useThemeStore((s) => s.setAntiqueMode);
  useEffect(() => {
    setAntiqueMode(true);
    return () => setAntiqueMode(false);
  }, [setAntiqueMode]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSort, setActiveSort] = useState<'ending_soon' | 'highest_bid' | 'newest' | 'most_bids'>('ending_soon');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING'>('ALL');

  const { data, isLoading } = useAuctions({
    category: 'Antiques',
    q: searchTerm || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    sort: activeSort,
    pageSize: 36,
  });

  const auctions = data?.items ?? [];

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#131C2A] font-sans antialiased">
      {/* ── Top Heritage Ribbon ────────────────────────────────────────────────── */}
      <div className="border-b border-[#B89C6F]/30 bg-[#090F17] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs text-[#C4B7A5]">
        <div className="flex items-center gap-3">
          <Link
            to="/browse"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Marketplace</span>
          </Link>
          <span className="text-[#3E4A5C]">|</span>
          <span className="uppercase text-[11px] tracking-[0.2em] text-[#D4BC94] font-medium">
            AURÉNE ANTIQUES
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="hidden sm:inline-flex items-center gap-1 text-[#A39684]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#B89C6F]" />
            48-Hour Inspection &amp; Escrow Guarantee
          </span>
          <Link
            to="/sell/new"
            className="border border-[#B89C6F]/40 hover:border-[#B89C6F] bg-[#162132] text-[#E8DCC8] hover:text-white px-3 py-1 rounded text-xs transition-colors"
          >
            Sell an Item
          </Link>
        </div>
      </div>

      {/* ── Heritage Masthead ────────────────────────────────────────────────── */}
      <header className="border-b border-[#B89C6F]/30 bg-[#0E1622] px-4 sm:px-8 py-16 sm:py-24 text-center text-[#FBFBF9]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-[#B89C6F] text-xs uppercase tracking-[0.3em] font-medium">
            <span className="h-px w-8 bg-[#B89C6F]/40" />
            <span>AURÉNE ANTIQUES</span>
            <span className="h-px w-8 bg-[#B89C6F]/40" />
          </div>

          <h1 className="mt-5 font-serif text-4xl sm:text-6xl text-[#FBFBF9] font-normal tracking-tight leading-tight">
            Exceptional Antiques, Rare Watches <br />
            <span className="italic font-normal text-[#D4BC94]">&amp; Historic Artifacts</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-sm sm:text-base text-[#C4B7A5] leading-relaxed font-light">
            Live auctions for genuine heirlooms and historic pieces. Backed by documented 
            provenance and our 48-hour escrow inspection guarantee.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="#catalogue-index"
              className="inline-flex items-center justify-center border border-[#B89C6F] bg-[#B89C6F] hover:bg-[#C9B085] text-[#0E1622] px-7 py-3 text-xs uppercase tracking-[0.2em] font-semibold rounded shadow-md transition-all duration-200"
            >
              Browse Antiques
            </a>
          </div>

          <div className="mt-12 pt-6 border-t border-[#B89C6F]/20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-[#C4B7A5]">
            <div>
              <span className="text-[#8E8070] block uppercase text-[10px] tracking-wider">Active Pieces</span>
              <span className="font-serif text-base text-[#FBFBF9] mt-0.5 block font-medium">
                {isLoading ? 'Loading…' : `${auctions.length} Catalogued`}
              </span>
            </div>
            <div>
              <span className="text-[#8E8070] block uppercase text-[10px] tracking-wider">Escrow Protection</span>
              <span className="font-serif text-base text-[#FBFBF9] mt-0.5 block font-medium">
                Payment Held Safely
              </span>
            </div>
            <div>
              <span className="text-[#8E8070] block uppercase text-[10px] tracking-wider">Inspection Window</span>
              <span className="font-serif text-base text-[#FBFBF9] mt-0.5 block font-medium">
                48 Hours In-Person
              </span>
            </div>
            <div>
              <span className="text-[#8E8070] block uppercase text-[10px] tracking-wider">Known Provenance</span>
              <span className="font-serif text-base text-[#FBFBF9] mt-0.5 block font-medium">
                Documented History
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <section className="border-b border-[#E5E0D8] bg-[#F4F1EB] px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          {/* Status Filter (All Items / Live Now / Upcoming) */}
          <div className="flex items-center gap-1.5">
            {(['ALL', 'LIVE', 'UPCOMING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3.5 py-1.5 text-xs rounded transition-all font-medium',
                  statusFilter === st
                    ? 'bg-[#0E1622] text-[#FBFBF9] font-medium shadow-sm'
                    : 'bg-white text-[#5C6675] hover:text-[#0E1622] border border-[#E0DAD0]',
                )}
              >
                {st === 'ALL' ? 'All Items' : st === 'LIVE' ? 'Live Now' : 'Upcoming'}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-40 sm:w-56 rounded border border-[#E0DAD0] bg-white px-3 pr-8 text-xs text-[#0E1622] placeholder:text-[#888] focus:border-[#B89C6F] focus:outline-none"
              />
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-[#888]" />
            </div>

            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as any)}
              className="h-9 rounded border border-[#E0DAD0] bg-white px-2.5 text-xs text-[#0E1622] font-medium focus:border-[#B89C6F] focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Catalogue Grid ─────────────────────────────────────────────── */}
      <main id="catalogue-index" className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-lg border border-[#E5E0D8] bg-white animate-pulse"
              />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="rounded-lg border border-[#E5E0D8] bg-white p-12 text-center shadow-sm">
            <p className="text-xs uppercase tracking-widest text-[#8E8070]">
              No Items Found
            </p>
            <h3 className="font-serif text-2xl mt-2 text-[#0E1622]">No items match this selection</h3>
            <p className="text-sm text-[#5C6675] mt-2">
              Try adjusting your search or list an antique for upcoming auctions.
            </p>
            <div className="mt-6">
              <Link
                to="/sell/new"
                className="border-0 bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] px-5 py-2 text-xs uppercase tracking-wider rounded font-medium inline-block shadow-sm transition-colors"
              >
                + Sell an Item
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {auctions.map((auction, idx) => {
              const currentAmount = auction.currentBid?.amount ?? auction.basePrice;
              const isLive = auction.status === 'LIVE';
              const isUpcoming = auction.status === 'UPCOMING';
              const lotNumber = idx + 1;

              const statusDisplay = isLive
                ? 'Live Now'
                : isUpcoming
                  ? 'Upcoming'
                  : 'Ended';

              return (
                <article
                  key={auction.id}
                  className="group rounded-lg border border-[#E5E0D8] bg-white shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="border-b border-[#F0ECE1] bg-[#FAF8F5] px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-serif font-medium text-[#0E1622] tracking-wide text-xs">
                      Piece {lotNumber}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] rounded font-medium',
                        isLive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isUpcoming
                            ? 'bg-[#FAF7F0] text-[#7A633F] border border-[#B89C6F]/30'
                            : 'bg-neutral-100 text-neutral-700',
                      )}
                    >
                      {statusDisplay}
                    </span>
                  </div>

                  {/* Image Frame */}
                  <Link
                    to={`/auctions/${auction.id}`}
                    className="relative aspect-square w-full overflow-hidden bg-[#F7F5F0] block"
                  >
                    {auction.images?.[0] ? (
                      <img
                        src={auction.images[0].url}
                        alt={auction.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#888]">
                        Photograph pending
                      </div>
                    )}
                  </Link>

                  {/* Specification Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#8E8070] font-medium">
                        {auction.brand} · {auction.size}
                      </div>
                      <h3 className="font-serif text-xl font-normal text-[#0E1622] mt-1 leading-snug line-clamp-2">
                        <Link to={`/auctions/${auction.id}`} className="hover:text-[#8E8070] transition-colors">
                          {sanitize(auction.title)}
                        </Link>
                      </h3>
                    </div>

                    <div className="border-y border-[#F0ECE1] py-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#8E8070] uppercase tracking-wider block font-medium">
                          {auction.currentBid ? 'Current bid' : 'Starting bid'}
                        </span>
                        <span className="font-serif text-lg font-semibold text-[#0E1622] tabular">
                          {formatPrice(currentAmount, true)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8E8070] uppercase tracking-wider block font-medium">
                          {isUpcoming ? 'Opens in' : isLive ? 'Time left' : 'Status'}
                        </span>
                        <Countdown
                          endsAt={isUpcoming ? auction.startsAt : auction.endsAt}
                          className="text-xs font-medium text-[#0E1622]"
                        />
                      </div>
                    </div>

                    <Link
                      to={`/auctions/${auction.id}`}
                      className="rounded border border-[#B89C6F]/40 bg-[#0E1622] text-[#FBFBF9] hover:bg-[#162335] py-2.5 text-center text-xs font-medium tracking-wider block shadow-sm transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Authenticity & Escrow Protection ────────────────────────────────── */}
      <section className="border-t border-[#E5E0D8] bg-[#F4F1EB] px-4 sm:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-[#8E764E] font-semibold text-center mb-2">
            Collector Safeguards
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0E1622] text-center font-normal">
            Authenticity &amp; Escrow Protection
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-center text-sm text-[#5C6675] leading-relaxed">
            How we protect collectors on every auction.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="rounded-lg border border-[#E5E0D8] bg-white p-7 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B89C6F] mb-3">
                <Landmark className="h-4 w-4" />
                <span className="uppercase tracking-[0.1em]">01 — Provenance &amp; Research</span>
              </div>
              <h4 className="font-serif text-lg text-[#0E1622] mb-2 font-medium">Documented History</h4>
              <p className="text-xs text-[#5C6675] leading-relaxed">
                Every piece includes known provenance, previous ownership records, maker hallmarks, 
                and detailed condition disclosures before bidding opens.
              </p>
            </div>

            <div className="rounded-lg border border-[#E5E0D8] bg-white p-7 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B89C6F] mb-3">
                <ShieldCheck className="h-4 w-4" />
                <span className="uppercase tracking-[0.1em]">02 — 48-Hour In-Person Inspection</span>
              </div>
              <h4 className="font-serif text-lg text-[#0E1622] mb-2 font-medium">Protected Escrow</h4>
              <p className="text-xs text-[#5C6675] leading-relaxed">
                Your payment is held safely in escrow. Once your piece arrives, you have two full days 
                to examine it in person before funds are released to the seller.
              </p>
            </div>

            <div className="rounded-lg border border-[#E5E0D8] bg-white p-7 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B89C6F] mb-3">
                <Clock className="h-4 w-4" />
                <span className="uppercase tracking-[0.1em]">03 — Fully Insured Delivery</span>
              </div>
              <h4 className="font-serif text-lg text-[#0E1622] mb-2 font-medium">Tracked Courier Dispatch</h4>
              <p className="text-xs text-[#5C6675] leading-relaxed">
                Sellers ship with protective archival packaging, mandatory signature confirmation, 
                and full transit insurance coverage.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
