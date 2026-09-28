import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { AuctionListQuery } from '../api';

const CATEGORIES = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Bags', 'Suits', 'Knitwear', 'Denim', 'Vintage'];
const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
] as const;

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending soon' },
  { value: 'highest_bid', label: 'Highest bid' },
  { value: 'most_bids', label: 'Most bids' },
] as const;

interface AuctionFiltersProps {
  value: AuctionListQuery;
  onChange: (next: AuctionListQuery) => void;
}

export const AuctionFilters = ({ value, onChange }: AuctionFiltersProps) => {
  const update = (patch: Partial<AuctionListQuery>) => onChange({ ...value, ...patch, page: 1 });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <Input
          placeholder="Search by title, brand, or keyword"
          value={value.q ?? ''}
          onChange={(e) => update({ q: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={value.category ?? '__any'}
          onValueChange={(v) => update({ category: v === '__any' ? undefined : v })}
        >
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.condition ?? '__any'}
          onValueChange={(v) =>
            update({ condition: v === '__any' ? undefined : (v as AuctionListQuery['condition']) })
          }
        >
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Any condition</SelectItem>
            {CONDITIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.status ?? '__any'}
          onValueChange={(v) =>
            update({ status: v === '__any' ? undefined : (v as AuctionListQuery['status']) })
          }
        >
          <SelectTrigger className="h-10 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">All statuses</SelectItem>
            <SelectItem value="LIVE">Live now</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
            <SelectItem value="SOLD">Sold</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-muted" />
          <Select
            value={value.sort ?? 'newest'}
            onValueChange={(v) => update({ sort: v as AuctionListQuery['sort'] })}
          >
            <SelectTrigger className="h-10 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(value.q || value.category || value.condition || value.status) && (
        <Button
          variant="link"
          size="sm"
          onClick={() => onChange({ sort: value.sort, page: 1, pageSize: value.pageSize })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
};
