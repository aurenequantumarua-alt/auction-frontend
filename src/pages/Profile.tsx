import { useNotifications, useMarkAllRead } from '@/features/notifications/hooks';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/authStore';
import { formatRelative } from '@/lib/format';
import { Link } from 'react-router-dom';

const notifTitle: Record<string, string> = {
  OUTBID: 'You’ve been outbid',
  WON: 'You won an auction',
  AUCTION_LIVE: 'Auction is live',
  AUCTION_ENDING: 'Auction ending soon',
  AUCTION_ENDED: 'Auction ended',
  PAYMENT_DUE: 'Payment due',
  WINNER_FORFEITED: 'Winner forfeited',
  AUCTION_EXPIRED: 'Auction expired',
  AUCTION_SOLD: 'Auction sold',
  NEW_INQUIRY: 'New question on your listing',
  INQUIRY_ANSWERED: 'Your question was answered',
};

export const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllRead();

  return (
    <div className="container max-w-3xl py-12">
      <p className="kicker">Profile</p>
      <h1 className="display-serif mt-2 text-display-lg font-semibold">{user?.name}</h1>
      <p className="mt-1 text-sm text-muted">{user?.email}</p>

      <div className="mt-10 flex flex-wrap gap-2">
        <Button asChild variant="secondary"><Link to="/me/wallet">Wallet</Link></Button>
        <Button asChild variant="secondary"><Link to="/me/bank">Bank account</Link></Button>
        <Button asChild variant="secondary"><Link to="/me/bids">Bid history</Link></Button>
        <Button asChild variant="secondary"><Link to="/me/wins">Won auctions</Link></Button>
        <Button asChild variant="secondary"><Link to="/me/listings">My listings</Link></Button>
      </div>

      <div className="mt-12 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Notifications</h2>
        {(data?.unread ?? 0) > 0 && (
          <Button variant="link" size="sm" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      <ul className="mt-4 overflow-hidden rounded-lg border border-line">
        {isLoading ? (
          <li className="p-5 text-sm text-muted">Loading…</li>
        ) : (data?.items.length ?? 0) === 0 ? (
          <li className="p-5 text-sm text-muted">No notifications yet.</li>
        ) : (
          data!.items.map((n) => {
            const auctionId = n.payload?.auctionId as string | undefined;
            const auctionTitle = n.payload?.auctionTitle as string | undefined;
            const preview =
              (n.payload?.question as string | undefined) ??
              (n.payload?.answerPreview as string | undefined);

            const content = (
              <>
                <p className="text-sm font-medium text-ink">
                  {notifTitle[n.type] ?? n.type}
                  {auctionTitle && (
                    <span className="font-normal text-muted"> · {auctionTitle}</span>
                  )}
                </p>
                {preview && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted/90 italic">
                    "{preview}"
                  </p>
                )}
                <p className="mt-1 text-[11px] text-muted">{formatRelative(n.createdAt)}</p>
              </>
            );

            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 border-b border-line px-5 py-4 last:border-b-0 transition-colors ${n.readAt ? '' : 'bg-accent/5'}`}
              >
                <div className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${n.readAt ? 'bg-line' : 'bg-accent'}`} />
                <div className="flex-1">
                  {auctionId ? (
                    <Link to={`/auctions/${auctionId}`} className="block hover:opacity-80">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
