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

const PHONE_RE = /^(\+?91)?[6-9]\d{9}$/;
const UPI_RE = /^[a-z0-9.\-_]{2,256}@[a-z]{2,64}$/i;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

export const BankAccountPage = () => {
  const { data, isLoading } = useBankAccount();
  const upsert = useUpsertBankAccount();
  const account = data?.bankAccount ?? null;

  const [editing, setEditing] = useState(false);
  const [method, setMethod] = useState<'UPI' | 'BANK'>('UPI');

  const [holder, setHolder] = useState('');
  // UPI
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [upiId, setUpiId] = useState('');
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

  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const resetForm = () => {
    setEditing(false);
    setOtpSent(false);
    setOtp('');
    setPhone('');
    setUpiId('');
    setHolder('');
    setAccountNumber('');
    setIfsc('');
    setBankName('');
    setIfscInfo(null);
    setIfscMissing(false);
    setIfscChecking(false);
    setConfirmationResult(null);
  };

  const sendOtp = async () => {
    const p = phone.replace(/\s/g, '');
    if (!PHONE_RE.test(p)) {
      toast.error('Enter a valid Indian mobile number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const phoneNumber = p.startsWith('+91') ? p : `+91${p}`;
      const appVerifier = window.recaptchaVerifier;

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success('Verification code sent to your phone via SMS');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP. Please try again.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const linkUpi = async () => {
    if (holder.trim().length < 2) return toast.error('Enter the account holder name');
    if (!/^\d{6}$/.test(otp)) return toast.error('Enter the 6-digit code');
    if (upiId.trim() && !UPI_RE.test(upiId.trim())) return toast.error('Enter a valid UPI ID like name@bank');
    if (!confirmationResult) return toast.error('Please request an OTP first');

    try {
      // 1. Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);

      // 2. Get the Firebase ID Token
      const idToken = await result.user.getIdToken();

      // 3. Send it to our backend
      await upsert.mutateAsync({
        type: 'UPI',
        accountHolderName: holder.trim(),
        idToken,
        upiId: upiId.trim() || undefined,
      });
      toast.success('UPI verified & linked');
      resetForm();
    } catch (e: any) {
      if (e.code === 'auth/invalid-verification-code') {
        toast.error('Incorrect code. Please try again.');
      } else {
        toast.error(extractApiError(e).message);
      }
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
        (verified by phone OTP) or a <strong>bank account</strong> — one on file, switch anytime.
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
                      <>
                        <p className="mt-0.5 text-sm text-ink">{account.upiId ?? 'UPI (phone-linked)'}</p>
                        <p className="mt-1 font-mono text-sm tabular text-muted">{account.phone}</p>
                      </>
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
                    onClick={() => {
                      setMethod(m);
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${method === m ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'
                      }`}
                  >
                    {m === 'UPI' ? 'UPI / phone' : 'Bank account'}
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
                    <Label htmlFor="phone">Mobile number</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setOtpSent(false);
                        }}
                        className="tabular"
                        inputMode="tel"
                        placeholder="10-digit mobile"
                        autoComplete="tel"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={isSendingOtp}
                        onClick={sendOtp}
                      >
                        {isSendingOtp ? 'Sending…' : otpSent ? 'Resend' : 'Send OTP'}
                      </Button>
                    </div>
                    <div id="recaptcha-container"></div>
                    <p className="mt-1.5 text-xs text-muted">
                      We verify your number with a one-time code before linking UPI.
                    </p>
                  </div>

                  {otpSent && (
                    <>
                      <div>
                        <Label htmlFor="otp">Verification code</Label>
                        <Input
                          id="otp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="mt-1.5 tabular tracking-[0.4em]"
                          inputMode="numeric"
                          placeholder="6-digit code"
                        />
                      </div>
                      <div>
                        <Label htmlFor="upiId">UPI ID (optional)</Label>
                        <Input
                          id="upiId"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="mt-1.5"
                          placeholder="name@okhdfc"
                          autoCapitalize="none"
                        />
                        <p className="mt-1.5 text-xs text-muted">
                          Leave blank to receive payouts to the UPI linked to this number.
                        </p>
                      </div>
                      <Button type="button" size="md" disabled={upsert.isPending} onClick={linkUpi}>
                        {upsert.isPending ? 'Verifying…' : 'Verify & link UPI'}
                      </Button>
                    </>
                  )}
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
            Bank numbers are encrypted at rest and never returned by our API. UPI is verified by phone OTP.
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
