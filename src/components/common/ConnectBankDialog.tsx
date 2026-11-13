import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { extractApiError } from '@/lib/api';

export const BANK_ACCOUNT_REQUIRED = 'bank_account_required';

/** Returns true when the given error is the bank-account gating error. */
export const isBankAccountRequired = (err: unknown): boolean =>
  extractApiError(err).code === BANK_ACCOUNT_REQUIRED;

interface ConnectBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Context-specific copy: what the user was trying to do. */
  reason?: 'bid' | 'sell';
}

const REASON_COPY: Record<NonNullable<ConnectBankDialogProps['reason']>, string> = {
  bid: 'To place a bid you need a verified payout method — link a UPI ID or a bank account, so we can pay or refund you safely.',
  sell: 'To list an item you need a verified payout method — link a UPI ID or a bank account, where your earnings are paid out after a sale.',
};

export const ConnectBankDialog = ({
  open,
  onOpenChange,
  reason = 'bid',
}: ConnectBankDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-ink">
          <Landmark className="h-5 w-5" />
        </div>
        <DialogHeader>
          <DialogTitle>Link a payout method</DialogTitle>
          <DialogDescription>{REASON_COPY[reason]}</DialogDescription>
        </DialogHeader>
        <p className="mb-6 text-sm text-muted">
          Link your UPI ID (GPay, PhonePe, Paytm, BHIM) or a bank account. Bank numbers are stored
          encrypted and never shown back in full.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
          <Button
            size="md"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              navigate('/me/bank');
            }}
          >
            Add payout method
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Convenience hook: owns the dialog open state and exposes a guard you can wrap
 * around an async action. If the action throws the gating error, the dialog opens
 * and the error is swallowed; any other error is re-thrown for the caller to handle.
 */
export const useConnectBankGate = () => {
  const [open, setOpen] = useState(false);

  const guard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (err) {
      if (isBankAccountRequired(err)) {
        setOpen(true);
        return undefined;
      }
      throw err;
    }
  }, []);

  return { open, setOpen, guard };
};
