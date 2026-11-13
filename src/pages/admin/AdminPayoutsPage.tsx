import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, CheckCircle2, XCircle, Landmark, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminApi,
  type AdminWithdrawal,
  type PlatformProfitSummary,
} from '@/features/admin/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/common/EmptyState';
import { extractApiError } from '@/lib/api';
import { formatDateTime, formatPrice } from '@/lib/format';

type WithdrawalFilter = 'ALL' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

const FILTER_OPTIONS: { value: WithdrawalFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PROCESSING', label: 'Pending payout' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Rejected / Failed' },
];

const STATUS_TONE: Record<AdminWithdrawal['status'], 'live' | 'warn' | 'danger' | 'neutral'> = {
  COMPLETED: 'live',
  PROCESSING: 'warn',
  REQUESTED: 'warn',
  FAILED: 'danger',
};

export const AdminPayoutsPage = () => {
  const [profit, setProfit] = useState<PlatformProfitSummary | null>(null);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WithdrawalFilter>('ALL');
  const [utrMap, setUtrMap] = useState<Record<string, string>>({});
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (statusFilter: WithdrawalFilter = filter) => {
    try {
      setLoading(true);
      const [profitRes, withdrawalsRes] = await Promise.all([
        adminApi.getPlatformProfit(),
        adminApi.getWithdrawals(statusFilter),
      ]);
      setProfit(profitRes);
      setWithdrawals(withdrawalsRes);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleComplete = async (id: string) => {
    const utr = (utrMap[id] ?? '').trim();
    if (!utr) {
      toast.error('Enter the UTR / bank transfer reference first.');
      return;
    }
    try {
      setBusyId(id);
      await adminApi.completeWithdrawal(id, utr);
      toast.success('Withdrawal marked as paid.');
      setUtrMap((prev) => ({ ...prev, [id]: '' }));
      await load(filter);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = (reasonMap[id] ?? '').trim();
    if (!reason) {
      toast.error('Enter a rejection reason first.');
      return;
    }
    try {
      setBusyId(id);
      await adminApi.rejectWithdrawal(id, reason);
      toast.success('Withdrawal rejected and refunded to wallet.');
      setReasonMap((prev) => ({ ...prev, [id]: '' }));
      await load(filter);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Administration</p>
          <h1 className="display-serif mt-2 text-display-md font-semibold">Payouts &amp; Profit</h1>
          <p className="mt-1 text-sm text-muted">
            Claim your accumulated 10% platform commissions and process manual seller withdrawals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink-50"
          >
            ← Back to Auctions
          </Link>
          <Link
            to="/me/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink-800"
          >
            <Wallet className="h-4 w-4" />
            Claim Admin Wallet
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Profit & Admin Wallet Summary Cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-canvas p-5">
          <p className="kicker">Claimable in Admin Wallet</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular text-ink">
            {profit ? profit.adminWalletBalanceFormatted : '—'}
          </p>
          <p className="mt-1 text-xs text-muted">
            10% commissions ready to withdraw from{' '}
            <Link to="/me/wallet" className="underline underline-offset-2 hover:text-ink">
              your Wallet
            </Link>
          </p>
        </div>

        <div className="rounded-lg border border-line bg-canvas p-5">
          <p className="kicker flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pending in Escrow
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tabular text-ink">
            {profit ? profit.pendingEscrowProfitFormatted : '—'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {profit ? `${profit.pendingEscrowCount} active order(s) awaiting delivery/inspection` : ''}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-canvas p-5">
          <p className="kicker">Total Released Profit</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular text-ink">
            {profit ? profit.totalProfitFormatted : '—'}
          </p>
          <p className="mt-1 text-xs text-muted">
            {profit ? `Across ${profit.completedCount} completed settlement(s)` : ''}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Withdrawal Requests</h2>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line bg-canvas text-muted hover:border-ink/30 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Withdrawals List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Loading payouts…</div>
      ) : withdrawals.length === 0 ? (
        <EmptyState
          title="No withdrawal requests"
          description="Seller withdrawals and your own admin wallet claims will appear here."
        />
      ) : (
        <div className="space-y-4">
          {withdrawals.map((w) => {
            const isPending = w.status === 'PROCESSING' || w.status === 'REQUESTED';
            const isBusy = busyId === w.id;
            const dest = w.destinationDetails;

            return (
              <div key={w.id} className="rounded-lg border border-line bg-canvas p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <p className="font-display text-xl font-semibold tabular text-ink">
                        {formatPrice(w.amount, true)}
                      </p>
                      <Badge tone={STATUS_TONE[w.status]}>{w.status}</Badge>
                      <span className="rounded bg-ink-50 px-2 py-0.5 text-[11px] font-mono text-muted">
                        {w.provider}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink">
                      {w.user.name} <span className="text-muted">({w.user.email})</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Requested {formatDateTime(w.requestedAt)}
                      {w.completedAt ? ` · Completed ${formatDateTime(w.completedAt)}` : ''}
                      {w.externalRef ? ` · Ref: ${w.externalRef}` : ''}
                    </p>
                    {w.failureReason && (
                      <p className="mt-1 text-xs text-danger">Reason: {w.failureReason}</p>
                    )}
                  </div>

                  <div className="rounded-md border border-line bg-ink-50/40 px-4 py-3 text-xs">
                    <p className="kicker mb-1 flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5" />
                      Payout Destination
                    </p>
                    {dest ? (
                      dest.type === 'UPI' ? (
                        <div className="space-y-0.5">
                          <p className="font-medium text-ink">{dest.name}</p>
                          <p className="font-mono text-ink">{dest.upiId}</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="font-medium text-ink">{dest.accountHolderName}</p>
                          <p className="font-mono text-ink">{dest.accountNumber ?? w.bankLast4}</p>
                          <p className="text-muted">
                            IFSC: <span className="font-mono text-ink">{dest.ifsc}</span>
                            {dest.bankName ? ` · ${dest.bankName}` : ''}
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-muted">Snapshot: {w.bankLast4}</p>
                    )}
                  </div>
                </div>

                {isPending && (
                  <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter UTR / UPI Ref ID"
                        value={utrMap[w.id] ?? ''}
                        onChange={(e) => setUtrMap((prev) => ({ ...prev, [w.id]: e.target.value }))}
                        disabled={isBusy}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComplete(w.id)}
                        disabled={isBusy}
                        className="shrink-0 gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Paid
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Rejection reason (refunds wallet)"
                        value={reasonMap[w.id] ?? ''}
                        onChange={(e) =>
                          setReasonMap((prev) => ({ ...prev, [w.id]: e.target.value }))
                        }
                        disabled={isBusy}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReject(w.id)}
                        disabled={isBusy}
                        className="shrink-0 gap-1.5 text-danger"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

