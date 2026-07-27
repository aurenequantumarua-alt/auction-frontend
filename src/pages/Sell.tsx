import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEarnings, useMyListings } from '@/features/auctions/hooks';
import { useBankAccount } from '@/features/wallet/hooks';
import { formatPrice } from '@/lib/format';
import { AuctionCard } from '@/features/auctions/components/AuctionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/features/auth/authStore';

export const SellPage = () => {
  const user = useAuthStore((s) => s.user);
  const listings = useMyListings();
  const earnings = useEarnings();
  const { data: bankData, isLoading: bankLoading } = useBankAccount(!!user);
  const needsBank = !!user && !bankLoading && !bankData?.bankAccount;

  if (!user) {
    return (
      <div className="container py-20">
        <EmptyState
          title="Sign in to sell on Aurene"
          description="Create an account or sign in to list pieces for auction."
          action={
            <div className="flex gap-3">
              <Button asChild><Link to="/login">Sign in</Link></Button>
              <Button asChild variant="secondary"><Link to="/signup">Create account</Link></Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Seller</p>
          <h1 className="display-serif mt-2 text-display-lg font-semibold">Your listings</h1>
        </div>
        <Button asChild size="lg">
          <Link to="/sell/new">List a new item</Link>
        </Button>
      </div>

      {needsBank && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-ink-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-canvas text-ink">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Link a bank account to sell</p>
              <p className="mt-0.5 text-sm text-muted">
                We pay your earnings here after a sale. You’ll need it before publishing a listing.
              </p>
            </div>
          </div>
          <Button asChild size="md">
            <Link to="/me/bank">Add bank account</Link>
          </Button>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Total earnings" value={earnings.data ? formatPrice(earnings.data.totalEarnings, true) : '—'} />
        <Stat label="Sold" value={earnings.data?.soldCount?.toString() ?? '—'} />
        <Stat label="Active listings" value={(listings.data?.items.filter((a) => a.status === 'LIVE' || a.status === 'UPCOMING').length ?? 0).toString()} />
      </div>

      <div className="mt-12">
        {listings.isLoading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (listings.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="You haven't listed anything yet"
            description="When you list a piece, it shows up here with bids and earnings."
            action={<Button asChild><Link to="/sell/new">Create your first listing</Link></Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.data!.items.map((a) => (
              <div key={a.id} className="space-y-3">
                <AuctionCard auction={a} />
                <Badge tone={a.status === 'DRAFT' ? 'neutral' : a.status === 'LIVE' ? 'live' : 'ink'}>
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-line bg-canvas p-6">
    <p className="kicker">{label}</p>
    <p className="mt-2 font-display text-2xl font-semibold tabular text-ink">{value}</p>
  </div>
);
