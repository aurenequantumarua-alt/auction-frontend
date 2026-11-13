import { useState } from 'react';
import { toast } from 'sonner';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api, extractApiError } from '@/lib/api';
import { uploadImage } from '@/lib/uploadImage';

const DISPUTE_REASONS = [
  { value: 'COUNTERFEIT', label: 'Counterfeit / Fake item' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'DAMAGED', label: 'Damaged / Defective' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'NOT_DELIVERED', label: 'Item not delivered / Fake tracking' },
] as const;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_PROOF_IMAGES = 10;
const MAX_PROOF_BYTES = 8 * 1024 * 1024;

interface DisputeModalProps {
  settlementId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeModal = ({ settlementId, onClose, onSuccess }: DisputeModalProps) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const selected = Array.from(files);
    if (proofUrls.length + selected.length > MAX_PROOF_IMAGES) {
      toast.error(`You can upload at most ${MAX_PROOF_IMAGES} proof images.`);
      e.target.value = '';
      return;
    }

    for (const file of selected) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        toast.error(`Unsupported file "${file.name}". Upload JPEG, PNG, WebP, or AVIF images.`);
        e.target.value = '';
        return;
      }
      if (file.size > MAX_PROOF_BYTES) {
        toast.error(`"${file.name}" exceeds the 8 MB limit.`);
        e.target.value = '';
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of selected) {
        const url = await uploadImage(file);
        setProofUrls((prev) => [...prev, url]);
      }
      toast.success(selected.length > 1 ? 'Evidence images uploaded' : 'Evidence image uploaded');
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeProof = (idx: number) => {
    setProofUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (!reason) return toast.error('Select a dispute reason');
    if (trimmed.length < 10) {
      return toast.error('Please describe the issue in at least 10 characters');
    }
    if (proofUrls.length === 0) {
      return toast.error('Upload at least one proof image before submitting');
    }

    setSubmitting(true);
    try {
      await api.post(`/settlements/${settlementId}/dispute`, {
        reason,
        description: trimmed,
        proofUrls,
      });
      toast.success('Dispute submitted with proof for admin review');
      onSuccess();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-line bg-canvas p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-ink">
          Report an Issue / Authenticity Dispute
        </h3>
        <p className="mt-1 text-sm text-muted">
          Upload clear photo proof so an admin can review and approve a 100% refund. Funds remain
          locked in Escrow until resolved.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Reason</label>
            <select
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason…</option>
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-ink">Description</label>
              <span className="text-[11px] text-muted">
                {description.trim().length}/2000 (min 10)
              </span>
            </div>
            <textarea
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink"
              rows={3}
              maxLength={2000}
              placeholder="Explain the issue in detail (missing tags, fake label, damage, wrong item, tracking mismatch)…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Photo Proof (required · JPEG, PNG, WebP, or AVIF · max 8 MB each)
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line bg-ink-50/40 px-4 py-3 text-sm text-muted transition hover:border-ink/40 hover:text-ink">
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading evidence…' : 'Choose proof photos (1–10 images)'}</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleUpload}
                disabled={uploading || proofUrls.length >= MAX_PROOF_IMAGES}
                className="sr-only"
              />
            </label>
            {proofUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {proofUrls.map((url, i) => (
                  <div key={`${url}-${i}`} className="relative">
                    <img
                      src={url}
                      alt={`Proof ${i + 1}`}
                      className="h-16 w-16 rounded border border-line object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => removeProof(i)}
                      aria-label={`Remove proof ${i + 1}`}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-canvas shadow hover:bg-danger"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || uploading}
          >
            {submitting ? 'Submitting…' : 'Submit Dispute'}
          </Button>
        </div>
      </div>
    </div>
  );
};
