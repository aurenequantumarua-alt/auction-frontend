import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useMyWins } from '@/features/auctions/hooks';
import { formatPrice, formatRelative } from '@/lib/format';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, extractApiError } from '@/lib/api';
import { loadRazorpay } from '@/lib/razorpay';
import { useAuthStore } from '@/features/auth/authStore';

type CheckoutResponse =
  | { provider: 'mock'; message?: string; settlementId: string; amountDue: string }
  | {
      provider: 'razorpay';
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      settlementId: string;
      name: string;
      description?: string;
    };

export const WonAuctionsPage = () => {
  const { data, isLoading, refetch } = useMyWins();
  const user = useAuthStore((s) => s.user);

  const handleCheckout = async (settlementId: string) => {
    try {
      const { data: res } = await api.post<CheckoutResponse>(`/payments/checkout/${settlementId}`);

      // Mock mode — no real gateway configured. Nudge to the simulate flow.
      if (res.provider !== 'razorpay') {
        toast.info(res.message ?? 'Payments are in mock mode — use “Simulate paid”.');
        return;
      }

      await loadRazorpay();
      if (!window.Razorpay) {
        toast.error('Could not load the payment SDK.');
        return;
      }

      const rzp = new window.Razorpay({
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        name: res.name,
        description: res.description,
        order_id: res.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#1c1917' },
        handler: async (resp) => {
          try {
            await api.post(`/payments/verify/${settlementId}`, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success('Payment successful — your item is on the way!');
            void refetch();
          } catch (err) {
            toast.error(extractApiError(err).message);
          }
        },
        modal: { ondismiss: () => toast.info('Payment cancelled.') },
      });
      rzp.on('payment.failed', (r) => toast.error(r.error?.description ?? 'Payment failed.'));
      rzp.open();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <div className="container py-12">
      <p className="kicker">Won</p>
      <h1 className="display-serif mt-2 text-display-lg font-semibold">Auctions you&apos;ve won</h1>

      <div className="mt-10 space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted">Loading…</div>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No wins yet"
            description="Once you win an auction, it appears here for checkout."
            action={<Button asChild><Link to="/browse">Browse</Link></Button>}
          />
        ) : (
          data!.items.map((w) => {
            const settlement = w.auction.settlement;
            const isPending = settlement?.status === 'AWAITING_PAYMENT';
            return (
              <div key={w.id} className="rounded-lg border border-line bg-canvas p-5 sm:flex sm:items-center sm:gap-5">
                <div className="aspect-square h-24 w-24 flex-none overflow-hidden rounded bg-ink-50">
                  {w.auction.images[0] && <img src={w.auction.images[0].url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="mt-3 flex-1 sm:mt-0">
                  <p className="kicker">{w.auction.brand}</p>
                  <Link to={`/auctions/${w.auction.id}`} className="block font-display text-lg font-medium hover:underline">
                    {w.auction.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    Winning bid <span className="font-medium text-ink">{formatPrice(w.amount, true)}</span>
                    {settlement && isPending && (
                      <> · Pay by <span className="text-warn">{formatRelative(settlement.paymentDeadline)}</span></>
                    )}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 sm:mt-0">
                  {settlement && (
                    <Badge tone={isPending ? 'warn' : settlement.status === 'PAID' ? 'accent' : 'neutral'}>
                      {settlement.status.replace('_', ' ')}
                    </Badge>
                  )}
                  {isPending && settlement && (
                    <Button size="sm" onClick={() => handleCheckout(settlement.id)}>
                      Pay {formatPrice(w.amount, true)} with Razorpay
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
