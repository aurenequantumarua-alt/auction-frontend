import { useState } from 'react';
import { toast } from 'sonner';
import { MapPin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api, extractApiError } from '@/lib/api';
import { sanitize } from '@/lib/sanitize';

export interface ShippingAddressInfo {
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
}

interface ShipModalProps {
  settlementId: string;
  auctionTitle: string;
  shippingAddress?: ShippingAddressInfo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShipModal = ({
  settlementId,
  auctionTitle,
  shippingAddress,
  onClose,
  onSuccess,
}: ShipModalProps) => {
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasAddress = Boolean(
    shippingAddress?.shippingAddress ||
      shippingAddress?.shippingCity ||
      shippingAddress?.shippingPostalCode,
  );

  const fullAddressString = [
    shippingAddress?.shippingName,
    shippingAddress?.shippingAddress,
    `${shippingAddress?.shippingCity || ''}, ${shippingAddress?.shippingState || ''} - ${shippingAddress?.shippingPostalCode || ''}`.trim(),
    shippingAddress?.shippingPhone ? `Contact: ${shippingAddress.shippingPhone}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopyAddress = () => {
    if (!fullAddressString) return;
    void navigator.clipboard.writeText(fullAddressString);
    setCopied(true);
    toast.success('Buyer delivery address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!courierName.trim()) return toast.error('Enter the courier / carrier name');
    if (!trackingNumber.trim()) return toast.error('Enter the tracking number / AWB');
    setSubmitting(true);
    try {
      await api.post(`/settlements/${settlementId}/ship`, {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim(),
      });
      toast.success('Item marked as shipped! Tracking details sent to buyer.');
      onSuccess();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-line bg-canvas p-6 shadow-2xl">
        <h3 className="font-display text-lg font-semibold text-ink">Dispatch Item</h3>
        <p className="mt-1 text-sm text-muted">
          Ship &ldquo;{sanitize(auctionTitle)}&rdquo; to the buyer below and enter tracking details.
        </p>

        {/* ── BUYER DELIVERY ADDRESS DOSSIER ── */}
        <div className="mt-4 rounded-lg border border-[#B89C6F]/40 bg-[#FAF7F0] p-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0DAD0]">
            <span className="font-semibold uppercase tracking-wider text-[#8E764E] text-[11px] flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#B89C6F]" />
              Buyer Shipping Destination
            </span>
            {hasAddress && (
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A633F] hover:text-[#0E1622] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            )}
          </div>

          {hasAddress ? (
            <div className="pt-2.5 space-y-1 text-[#0E1622]">
              <p className="font-semibold text-sm">
                {shippingAddress?.shippingName ? sanitize(shippingAddress.shippingName) : 'Buyer'}
              </p>
              <p className="text-[#4A3B29] whitespace-pre-line leading-relaxed">
                {shippingAddress?.shippingAddress ? sanitize(shippingAddress.shippingAddress) : ''}
              </p>
              <p className="text-[#4A3B29] font-medium">
                {[shippingAddress?.shippingCity, shippingAddress?.shippingState]
                  .filter(Boolean)
                  .map((s) => sanitize(s!))
                  .join(', ')}
                {shippingAddress?.shippingPostalCode
                  ? ` — ${sanitize(shippingAddress.shippingPostalCode)}`
                  : ''}
              </p>
              {shippingAddress?.shippingPhone && (
                <p className="pt-1 text-[#7A633F] font-semibold text-[11px] flex items-center gap-1">
                  📞 Contact: {sanitize(shippingAddress.shippingPhone)}
                </p>
              )}
            </div>
          ) : (
            <div className="pt-2 text-muted italic">
              Delivery address has not been provided yet or is pending payment.
            </div>
          )}
        </div>

        {/* ── COURIER & DISPATCH INPUTS ── */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Courier / Carrier Name
            </label>
            <input
              type="text"
              placeholder="e.g. Blue Dart, Delhivery, DTDC, India Post Speed Post"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-[#B89C6F] focus:outline-none"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Tracking Number / AWB Consignment No.
            </label>
            <input
              type="text"
              placeholder="e.g. EE123456789IN or BLU987654321"
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-[#B89C6F] focus:outline-none font-mono"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Updating Escrow…' : 'Mark as Shipped'}
          </Button>
        </div>
      </div>
    </div>
  );
};
