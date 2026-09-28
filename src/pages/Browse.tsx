import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuctions } from '@/features/auctions/hooks';
import { AuctionCard, AuctionCardSkeleton } from '@/features/auctions/components/AuctionCard';
import { AuctionFilters } from '@/features/auctions/components/AuctionFilters';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import type { AuctionListQuery } from '@/features/auctions/api';

const queryFromParams = (sp: URLSearchParams): AuctionListQuery => ({
  q: sp.get('q') ?? undefined,
  category: sp.get('category') ?? undefined,
  condition: (sp.get('condition') as AuctionListQuery['condition']) ?? undefined,
  status: (sp.get('status') as AuctionListQuery['status']) ?? undefined,
  sort: (sp.get('sort') as AuctionListQuery['sort']) ?? 'newest',
  page: Number(sp.get('page') ?? 1),
  pageSize: 24,
});

export const BrowsePage = () => {
  const [sp, setSp] = useSearchParams();
  const [query, setQuery] = useState<AuctionListQuery>(() => queryFromParams(sp));

  const update = (next: AuctionListQuery) => {
    setQuery(next);
    const newParams = new URLSearchParams();
    if (next.q) newParams.set('q', next.q);
    if (next.category) newParams.set('category', next.category);
    if (next.condition) newParams.set('condition', next.condition);
    if (next.status) newParams.set('status', next.status);
    if (next.sort) newParams.set('sort', next.sort);
    if (next.page && next.page > 1) newParams.set('page', String(next.page));
    setSp(newParams, { replace: true });
  };

  const { data, isLoading, isFetching } = useAuctions(query);

  return (
    <div className="container py-12">
      <div className="mb-10">
        <p className="kicker">Marketplace</p>
        <h1 className="display-serif mt-2 text-display-lg font-semibold text-ink">Browse auctions</h1>
      </div>

      <AuctionFilters value={query} onChange={update} />

      <div className="mt-10">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <AuctionCardSkeleton key={i} />)}
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="No auctions match those filters"
            description="Try widening your search — clear a filter or change the category."
            action={<Button onClick={() => update({ sort: 'newest', page: 1 })}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between text-sm text-muted">
              <span>{data?.total ?? 0} result{(data?.total ?? 0) === 1 ? '' : 's'}</span>
              {isFetching && <span>Refreshing…</span>}
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.items.map((a) => <AuctionCard key={a.id} auction={a} />)}
            </div>

            {data && data.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={query.page === 1}
                  onClick={() => update({ ...query, page: (query.page ?? 1) - 1 })}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={data.page >= data.totalPages}
                  onClick={() => update({ ...query, page: (query.page ?? 1) + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
