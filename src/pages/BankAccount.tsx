import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Landmark, Smartphone, Lock, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { extractApiError } from '@/lib/api';
import { useBankAccount, useUpsertBankAccount } from '@/features/wallet/hooks';
import { walletApi, type IfscInfo } from '@/features/wallet/api';

const UPI_RE = /^[a-z0-9.\-_]{2,256}@[a-z]{2,64}$/i;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const BankAccountPage = () => {
  const { data, isLoading } = useBankAccount();
  const upsert = useUpsertBankAccount();
  const account = data?.bankAccount ?? null;

  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<'UPI' | 'BANK'>('UPI');

  const [holder, setHolder] = useState('');
  // UPI
  const [upiId, setUpiId] = useState('');
  const [confirmUpiId, setConfirmUpiId] = useState('');
  // BANK
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscInfo, setIfscInfo] = useState<IfscInfo | null>(null);
  const [ifscChecking, setIfscChecking] = useState(false);
  const [ifscMissing, setIfscMissing] = useState(false);

  // Live IFSC → bank/branch lookup (debounced) against the public IFSC directory.
  useEffect(() => {
    const code = ifsc.trim().toUpperCase();
    setIfscInfo(null);
    setIfscMissing(false);
    if (!IFSC_RE.test(code)) {
      setIfscChecking(false);
      return;
    }
    setIfscChecking(true);
    const t = setTimeout(async () => {
      const info = await walletApi.lookupIfsc(code);
      setIfscChecking(false);
      if (info) {
        setIfscInfo(info);
        setBankName((prev) => prev || info.bank);
      } else {
        setIfscMissing(true);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [ifsc]);

  const showForm = !account || editing;

  const resetForm = () => {
    setEditing(false);
    setUpiId('');
    setConfirmUpiId('');
    setHolder('');
    setAccountNumber('');
    setIfsc('');
    setBankName('');
    setIfscInfo(null);
    setIfscMissing(false);
    setIfscChecking(false);
  };

  const linkUpi = async () => {
    if (holder.trim().length < 2) return toast.error('Enter the account holder name');
    if (!UPI_RE.test(upiId.trim())) return toast.error('Enter a valid UPI ID like name@bank');
    if (upiId.trim().toLowerCase() !== confirmUpiId.trim().toLowerCase())
      return toast.error('UPI IDs do not match — please re-check');

    try {
      await upsert.mutateAsync({
        type: 'UPI',
        accountHolderName: holder.trim(),
        upiId: upiId.trim(),
      });
      toast.success('UPI ID linked successfully');
      resetForm();
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  const linkBank = async () => {
    if (holder.trim().length < 2) return toast.error('Enter the account holder name');
    if (!/^\d{9,18}$/.test(accountNumber)) return toast.error('Account number must be 9–18 digits');
    if (!IFSC_RE.test(ifsc.toUpperCase())) return toast.error('Enter a valid IFSC (e.g. HDFC0001234)');
    if (!ifscInfo) return toast.error("We couldn't verify that IFSC — check the code");
    try {
      await upsert.mutateAsync({
        type: 'BANK',
        accountHolderName: holder.trim(),
        accountNumber,
        ifsc: ifsc.toUpperCase(),
        bankName: bankName.trim() || undefined,
      });
      toast.success('Bank account linked');
      resetForm();
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  return (
    <div className="container max-w-2xl py-12">
      <p className="kicker">Payouts</p>
      <h1 className="display-serif mt-2 text-display-md font-semibold">Payout method</h1>
      <p className="mt-3 text-sm text-muted">
        Aurene pays your sale earnings here, and withdrawals go here too. Link a <strong>UPI ID</strong>{' '}
        or a <strong>bank account</strong> — one on file, switch anytime.
      </p>

      {isLoading ? (
        <div className="mt-10 text-sm text-muted">Loading…</div>
      ) : (
        <div className="mt-10 space-y-6">
          {account && (
            <div className="rounded-lg border border-line bg-canvas p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink-50 text-ink">
                    {account.type === 'UPI' ? <Smartphone className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{account.accountHolderName}</p>
                    {account.type === 'UPI' ? (
                      <p className="mt-0.5 text-sm text-ink">{account.upiId}</p>
                    ) : (
                      <>
                        <p className="mt-0.5 font-mono text-sm tabular text-muted">•••• •••• {account.last4}</p>
                        <p className="mt-1 text-sm text-muted">
                          {account.bankName ? `${account.bankName} · ` : ''}
                          {account.ifsc}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Badge tone={account.status === 'VERIFIED' ? 'live' : 'warn'}>{account.status}</Badge>
              </div>
              {!editing && (
                <div className="mt-5 border-t border-line pt-5">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setEditing(true);
                      setMethod(account.type);
                      setHolder(account.accountHolderName);
                    }}
                  >
                    Update / change method
                  </Button>
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="space-y-5 rounded-lg border border-line bg-canvas p-6">
              <h2 className="font-display text-xl font-semibold text-ink">
                {account ? 'Change payout method' : 'Link a payout method'}
              </h2>

              <div className="inline-flex rounded-lg border border-line p-1">
                {(['UPI', 'BANK'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${method === m ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'
                      }`}
                  >
                    {m === 'UPI' ? 'UPI ID' : 'Bank account'}
                  </button>
                ))}
              </div>

              <div>
                <Label htmlFor="holder">Account holder name</Label>
                <Input
                  id="holder"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  className="mt-1.5"
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>

              {method === 'UPI' ? (
                <>
                  <div>
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="mt-1.5"
                      placeholder="name@okhdfc"
                      autoCapitalize="none"
                    />
                    <p className="mt-1.5 text-xs text-muted">
                      Your UPI address — works with GPay, PhonePe, Paytm, BHIM, etc.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="confirmUpiId">Confirm UPI ID</Label>
                    <Input
                      id="confirmUpiId"
                      value={confirmUpiId}
                      onChange={(e) => setConfirmUpiId(e.target.value)}
                      className="mt-1.5"
                      placeholder="Re-enter your UPI ID"
                      autoCapitalize="none"
                    />
                  </div>
                  <Button type="button" size="md" disabled={upsert.isPending} onClick={linkUpi}>
                    {upsert.isPending ? 'Saving…' : 'Link UPI ID'}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="accountNumber">Account number</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="mt-1.5 tabular"
                      inputMode="numeric"
                      placeholder="9–18 digits"
                      autoComplete="off"
                    />
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                      <Lock className="h-3 w-3" />
                      Stored encrypted (AES-256). We only ever display the last four digits.
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ifsc">IFSC</Label>
                      <Input
                        id="ifsc"
                        value={ifsc}
                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                        className="mt-1.5 uppercase tabular"
                        placeholder="SBIN0000300"
                      />
                      {ifscChecking && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking IFSC…
                        </p>
                      )}
                      {ifscInfo && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          {ifscInfo.bank} · {ifscInfo.branch}, {ifscInfo.city}
                        </p>
                      )}
                      {ifscMissing && (
                        <p className="mt-1.5 text-xs text-danger">IFSC not found — check the code.</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bankName">Bank name (optional)</Label>
                      <Input
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="mt-1.5"
                        placeholder="HDFC Bank"
                      />
                    </div>
                  </div>
                  <Button type="button" size="md" disabled={upsert.isPending} onClick={linkBank}>
                    {upsert.isPending ? 'Saving…' : 'Link bank account'}
                  </Button>
                </>
              )}

              {account && (
                <Button type="button" variant="ghost" size="md" disabled={upsert.isPending} onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          )}

          <p className="flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            Bank numbers are encrypted at rest and never returned by our API.
          </p>

          <div className="text-sm">
            <Link to="/me/wallet" className="text-ink underline-offset-4 hover:underline">
              Back to wallet
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

