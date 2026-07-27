import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useReportAuction } from '../hooks';

interface ReportDialogProps {
  auctionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASON_OPTIONS = [
  { value: 'FRAUD', label: 'Fraudulent listing' },
  { value: 'COUNTERFEIT', label: 'Counterfeit item' },
  { value: 'MISLEADING_DESCRIPTION', label: 'Misleading description' },
  { value: 'WRONG_IMAGES', label: 'Images don\'t match item' },
  { value: 'PROHIBITED_ITEM', label: 'Prohibited item' },
  { value: 'OTHER', label: 'Other' },
];

export const ReportDialog = ({ auctionId, open, onOpenChange }: ReportDialogProps) => {
  const [reason, setReason] = useState(REASON_OPTIONS[0]!.value);
  const [details, setDetails] = useState('');
  const reportAuction = useReportAuction(auctionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 10) {
      toast.error('Please provide more details (at least 10 characters).');
      return;
    }
    
    try {
      await reportAuction.mutateAsync({ reason, details });
      toast.success('Report submitted successfully. Our team will review it.');
      onOpenChange(false);
      // Reset form
      setReason(REASON_OPTIONS[0]!.value);
      setDetails('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-canvas p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <AlertTriangle className="h-5 w-5 text-warn" />
              Report Auction
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-1.5 text-muted hover:bg-ink-50 hover:text-ink transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          
          <Dialog.Description className="mt-2 text-sm text-muted">
            If you believe this listing violates our policies, please let us know. We take reports seriously.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="kicker mb-1.5 block">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink"
                required
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="kicker mb-1.5 block">Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide specific details..."
                className="h-24 w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-ink"
                required
                minLength={10}
                maxLength={2000}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={reportAuction.isPending}>
                {reportAuction.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
