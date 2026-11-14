import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { api, extractApiError } from '@/lib/api';
import { sanitize } from '@/lib/sanitize';

interface ShipModalProps {
  settlementId: string;
  auctionTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShipModal = ({ settlementId, auctionTitle, onClose, onSuccess }: ShipModalProps) => {
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!courierName.trim()) return toast.error('Enter the courier / carrier name');
    if (!trackingNumber.trim()) return toast.error('Enter the tracking number');
    setSubmitting(true);
    try {
      await api.post(`/settlements/${settlementId}/ship`, { courierName, trackingNumber });
      toast.success('Item marked as shipped!');
      onSuccess();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-line bg-canvas p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink">Dispatch Item</h3>
        <p className="mt-1 text-sm text-muted">
          Ship &ldquo;{sanitize(auctionTitle)}&rdquo; and provide tracking details for the buyer.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Courier / Carrier Name</label>
            <input
              type="text"
              placeholder="e.g. India Post, Blue Dart, DTDC, Delhivery"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tracking Number / AWB</label>
            <input
              type="text"
              placeholder="e.g. EE123456789IN"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Mark as Shipped'}
          </Button>
        </div>
      </div>
    </div>
  );
};
