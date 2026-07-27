import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice, formatDateTime } from '@/lib/format';
import { extractApiError } from '@/lib/api';
import {
  useBankAccount,
  useRequestWithdrawal,
  useWallet,
  useWalletTransactions,
  useWithdrawals,
  useDepositCheckout,
  useDepositVerify,
} from '@/features/wallet/hooks';
import { loadRazorpay } from '@/lib/razorpay';
import { useAuthStore } from '@/features/auth/authStore';
import type {
  WalletTransaction,
  WalletTransactionType,
  Withdrawal,
  WithdrawalStatus,
} from '@/features/wallet/api';

// Keep in sync with backend WITHDRAWAL_MIN default (rupees).
const WITHDRAWAL_MIN = 100;

const TXN_LABEL: Record<WalletTransactionType, string> = {
  SALE_CREDIT: 'Sale earnings',
  WITHDRAWAL_DEBIT: 'Withdrawal to bank',
  REFUND_CREDIT: 'Refund',
  ADJUSTMENT: 'Adjustment',
  DEPOSIT_CREDIT: 'Deposit via Razorpay',
};

const WITHDRAWAL_TONE: Record<WithdrawalStatus, 'live' | 'warn' | 'danger' | 'neutral'> = {
  COMPLETED: 'live',
  PROCESSING: 'warn',
  REQUESTED: 'warn',
  FAILED: 'danger',
};

export const WalletPage = () => {
  const wallet = useWallet();
  const transactions = useWalletTransactions();
  const withdrawals = useWithdrawals();
  const { data: bankData } = useBankAccount();
  const acct = bankData?.bankAccount ?? null;
  const hasBank = !!acct;
  const payoutLabel = acct
    ? acct.type === 'UPI'
      ? acct.upiId ?? acct.phone
      : `•••• ${acct.last4}`
    : null;

  const [open, setOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  const balance = wallet.data?.balance ?? '0';

  return (
    <div className="container max-w-3xl py-12">
      <p className="kicker">Wallet</p>
      <h1 className="display-serif mt-2 text-display-md font-semibold">Your balance</h1>

      <div className="mt-8 rounded-lg border border-line bg-canvas p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Available balance</p>
            <p className="mt-2 font-display text-4xl font-semibold tabular text-ink">
              {wallet.isLoading ? '—' : formatPrice(balance, true)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Earnings from completed sales, ready to withdraw.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="md" variant="secondary" onClick={() => setDepositOpen(true)}>
              <ArrowDownLeft className="h-4 w-4" />
              Deposit
            </Button>
            <WithdrawButton
              balance={balance}
              hasBank={hasBank}
              onOpen={() => setOpen(true)}
            />
          </div>
        </div>
      </div>

      <WithdrawDialog
        open={open}
        onOpenChange={setOpen}
        balance={balance}
        hasBank={hasBank}
        destination={payoutLabel}
      />

      <DepositDialog open={depositOpen} onOpenChange={setDepositOpen} />

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink">Transactions</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          {transactions.isLoading ? (
            <div className="p-5 text-sm text-muted">Loading…</div>
          ) : (transactions.data?.items.length ?? 0) === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No transactions yet"
                description="When a sale completes, your earnings land here."
              />
            </div>
          ) : (
            <ul>
              {transactions.data!.items.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink">Withdrawals</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          {withdrawals.isLoading ? (
            <div className="p-5 text-sm text-muted">Loading…</div>
          ) : (withdrawals.data?.items.length ?? 0) === 0 ? (
            <div className="p-5 text-sm text-muted">No withdrawals yet.</div>
          ) : (
            <ul>
              {withdrawals.data!.items.map((w) => (
                <WithdrawalRow key={w.id} withdrawal={w} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

const WithdrawButton = ({
  balance,
  hasBank,
  onOpen,
}: {
  balance: string;
  hasBank: boolean;
  onOpen: () => void;
}) => {
  const navigate = useNavigate();
  const canWithdraw = Number(balance) >= WITHDRAWAL_MIN;

  if (!hasBank) {
    return (
      <Button size="md" variant="secondary" onClick={() => navigate('/me/bank')}>
        <Landmark className="h-4 w-4" />
        Add a payout method
      </Button>
    );
  }

  return (
    <Button size="md" onClick={onOpen} disabled={!canWithdraw}>
      <ArrowUpRight className="h-4 w-4" />
      Withdraw
    </Button>
  );
};

const WithdrawDialog = ({
  open,
  onOpenChange,
  balance,
  hasBank,
  destination,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  balance: string;
  hasBank: boolean;
  destination: string | null;
}) => {
  const navigate = useNavigate();
  const request = useRequestWithdrawal();
  const [amount, setAmount] = useState('');

  const balanceNum = Number(balance);
  const amountNum = Number(amount);

  const error =
    amount === ''
      ? null
      : Number.isNaN(amountNum)
        ? 'Enter a valid amount'
        : amountNum < WITHDRAWAL_MIN
          ? `Minimum withdrawal is ${formatPrice(WITHDRAWAL_MIN, true)}`
          : amountNum > balanceNum
            ? `You can withdraw at most ${formatPrice(balance, true)}`
            : null;

  const canSubmit = !error && amount !== '' && !request.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBank) {
      onOpenChange(false);
      navigate('/me/bank');
      return;
    }
    if (!canSubmit) return;
    try {
      await request.mutateAsync(amountNum.toFixed(2));
      toast.success(`Withdrawal of ${formatPrice(amountNum, true)} requested`);
      setAmount('');
      onOpenChange(false);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setAmount('');
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw funds</DialogTitle>
          <DialogDescription>
            {destination
              ? `Funds will be sent to ${destination}.`
              : 'Funds will be sent to your linked payout method.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="kicker mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
              <Input
                type="number"
                step="0.01"
                min={WITHDRAWAL_MIN}
                max={balanceNum}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-base font-medium tabular"
                inputMode="decimal"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className={error ? 'text-danger' : 'text-muted'}>
                {error ??
                  `Minimum ${formatPrice(WITHDRAWAL_MIN, true)} · Available ${formatPrice(balance, true)}`}
              </span>
              <button
                type="button"
                className="text-ink underline-offset-2 hover:underline disabled:opacity-50"
                onClick={() => setAmount(balanceNum.toFixed(2))}
                disabled={balanceNum < WITHDRAWAL_MIN}
              >
                Max
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {request.isPending ? 'Requesting…' : 'Confirm withdrawal'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DepositDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [amount, setAmount] = useState('');
  const checkout = useDepositCheckout();
  const verify = useDepositVerify();
  const user = useAuthStore((s) => s.user);

  const amountNum = Number(amount);
  const error = amount === '' ? null : Number.isNaN(amountNum) || amountNum <= 0 ? 'Enter a valid amount' : null;
  const canSubmit = !error && amount !== '' && !checkout.isPending && !verify.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const res = await checkout.mutateAsync(amountNum.toFixed(2));

      if (res.provider !== 'razorpay') {
        toast.info(res.message ?? 'Payments are in mock mode.');
        onOpenChange(false);
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
            await verify.mutateAsync({
              amount: amountNum.toFixed(2),
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success(`Successfully deposited ${formatPrice(amountNum, true)}`);
            setAmount('');
            onOpenChange(false);
          } catch (err) {
            toast.error(extractApiError(err).message);
          }
        },
        modal: { ondismiss: () => toast.info('Deposit cancelled.') },
      });
      rzp.on('payment.failed', (r) => toast.error(r.error?.description ?? 'Payment failed.'));
      rzp.open();
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setAmount(''); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit funds</DialogTitle>
          <DialogDescription>Add funds to your wallet using Razorpay.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="kicker mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">₹</span>
              <Input
                type="number"
                step="0.01"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-base font-medium tabular"
                inputMode="decimal"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {checkout.isPending || verify.isPending ? 'Processing…' : 'Proceed to Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TransactionRow = ({ txn }: { txn: WalletTransaction }) => {
  const isCredit = !txn.amount.trim().startsWith('-');
  return (
    <li className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
      <div
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
          isCredit ? 'bg-success/10 text-success' : 'bg-ink-50 text-ink-600'
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {txn.description || TXN_LABEL[txn.type]}
        </p>
        <p className="text-xs text-muted">{formatDateTime(txn.createdAt)}</p>
      </div>
      <div className="text-right">
        <p
          className={`tabular text-sm font-semibold ${
            isCredit ? 'text-success' : 'text-ink'
          }`}
        >
          {isCredit ? '+' : '−'}
          {formatPrice(Math.abs(Number(txn.amount)), true)}
        </p>
        <p className="text-xs text-muted tabular">
          {formatPrice(txn.balanceAfter, true)}
        </p>
      </div>
    </li>
  );
};

const WithdrawalRow = ({ withdrawal }: { withdrawal: Withdrawal }) => (
  <li className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0">
    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink-50 text-ink-600">
      <Landmark className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-ink">
        To {withdrawal.bankLast4}
      </p>
      <p className="text-xs text-muted">
        {formatDateTime(withdrawal.completedAt ?? withdrawal.requestedAt)}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <p className="tabular text-sm font-semibold text-ink">
        {formatPrice(withdrawal.amount, true)}
      </p>
      <Badge tone={WITHDRAWAL_TONE[withdrawal.status]}>{withdrawal.status}</Badge>
    </div>
  </li>
);
