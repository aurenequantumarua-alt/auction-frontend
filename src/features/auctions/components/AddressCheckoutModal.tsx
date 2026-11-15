import { useState } from 'react';
import { toast } from 'sonner';
import { MapPin, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { formatPrice } from '@/lib/format';
import { sanitize } from '@/lib/sanitize';
import type { ShippingAddressInfo } from './ShipModal';

interface AddressCheckoutModalProps {
  settlementId: string;
  auctionTitle: string;
  amount: string;
  defaultName?: string;
  existingAddress?: ShippingAddressInfo | null;
  onClose: () => void;
  onProceed: (address: ShippingAddressInfo) => Promise<void>;
}

export const AddressCheckoutModal = ({
  auctionTitle,
  amount,
  defaultName = '',
  existingAddress,
  onClose,
  onProceed,
}: AddressCheckoutModalProps) => {
  const [shippingName, setShippingName] = useState(
    existingAddress?.shippingName || defaultName,
  );
  const [shippingPhone, setShippingPhone] = useState(
    existingAddress?.shippingPhone || '',
  );
  const [shippingAddress, setShippingAddress] = useState(
    existingAddress?.shippingAddress || '',
  );
  const [shippingCity, setShippingCity] = useState(
    existingAddress?.shippingCity || '',
  );
  const [shippingState, setShippingState] = useState(
    existingAddress?.shippingState || '',
  );
  const [shippingPostalCode, setShippingPostalCode] = useState(
    existingAddress?.shippingPostalCode || '',
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingName.trim() || shippingName.trim().length < 2) {
      toast.error('Please enter the recipient full name');
      return;
    }
    const cleanPhone = shippingPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number for delivery');
      return;
    }
    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      toast.error('Please enter complete flat / house number, building and street');
      return;
    }
    if (!shippingCity.trim()) {
      toast.error('Please enter the destination city');
      return;
    }
    if (!shippingState.trim()) {
      toast.error('Please enter state');
      return;
    }
    if (!shippingPostalCode.trim() || !/^\d{6}$/.test(shippingPostalCode.trim())) {
      toast.error('Please enter a valid 6-digit postal PIN code');
      return;
    }

    setLoading(true);
    try {
      await onProceed({
        shippingName: shippingName.trim(),
        shippingPhone: cleanPhone,
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim(),
        shippingState: shippingState.trim(),
        shippingPostalCode: shippingPostalCode.trim(),
      });
    } catch {
      // Error handled by parent handler
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-line bg-canvas p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#0E1622] p-2 text-[#E8DCC8]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">Delivery Address</h3>
            <p className="mt-0.5 text-xs text-muted">
              Where should the seller ship &ldquo;{sanitize(auctionTitle)}&rdquo;?
            </p>
          </div>
        </div>

        {/* ── ESCROW PRIVACY GUARANTEE BANNER ── */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#B89C6F]/30 bg-[#FAF7F0] p-3 text-[11px] text-[#554734]">
          <ShieldCheck className="h-4 w-4 flex-none text-[#8E764E]" />
          <span>
            <strong>Escrow Guaranteed:</strong> Your address is shared only with the verified seller to fulfill tracked delivery. Funds remain locked until you inspect the piece.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="shippingName" className="text-xs">Recipient Full Name</Label>
              <Input
                id="shippingName"
                type="text"
                placeholder="e.g. Deepak Raj"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingPhone" className="text-xs">Contact Mobile Number</Label>
              <Input
                id="shippingPhone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shippingAddress" className="text-xs">
              Flat, House No., Building, Street &amp; Landmark
            </Label>
            <Input
              id="shippingAddress"
              type="text"
              placeholder="e.g. Flat 402, Royal Palms, Heritage Road, Opp. City Museum"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="shippingCity" className="text-xs">City</Label>
              <Input
                id="shippingCity"
                type="text"
                placeholder="e.g. Mumbai"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingState" className="text-xs">State</Label>
              <Input
                id="shippingState"
                type="text"
                placeholder="e.g. Maharashtra"
                value={shippingState}
                onChange={(e) => setShippingState(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingPostalCode" className="text-xs">PIN Code</Label>
              <Input
                id="shippingPostalCode"
                type="text"
                maxLength={6}
                placeholder="e.g. 400001"
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
                className="mt-1 font-mono"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-line">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-2">
              <Lock className="h-3.5 w-3.5" />
              {loading ? 'Securing…' : `Proceed to Pay ${formatPrice(amount, true)}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
