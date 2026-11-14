import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Link2, X, UploadCloud, Loader2, ShieldCheck } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useCreateAuction } from '@/features/auctions/hooks';
import { extractApiError } from '@/lib/api';
import { uploadImage } from '@/lib/uploadImage';

/**
 * Extracts a Google Drive file ID from various link formats:
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID&export=view
 * Returns null if the link isn't a recognised Drive URL.
 */
const extractDriveFileId = (url: string): string | null => {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.endsWith('drive.google.com') && !u.hostname.endsWith('docs.google.com')) {
      return null;
    }
    // /file/d/FILE_ID/...
    const fileMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1] ?? null;
    // ?id=FILE_ID (open or uc links)
    const idParam = u.searchParams.get('id');
    if (idParam) return idParam;
    return null;
  } catch {
    return null;
  }
};

/** Convert a Google Drive file ID to a direct-embeddable image URL. */
const driveDirectUrl = (fileId: string): string =>
  `https://lh3.googleusercontent.com/d/${fileId}`;

export const CATEGORIES = [
  'Antiques',
  'Collectibles & Art',
  'Clothing & Fashion',
  'Footwear & Sneakers',
  'Watches & Jewellery',
  'Bags & Accessories',
  'Electronics & Gadgets',
  'Home & Furniture',
  'Books & Media',
  'Automobilia & Vehicle Parts',
  'Other',
] as const;

const Schema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(20).max(4000),
  category: z.enum(CATEGORIES),
  brand: z.string().min(1).max(80),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  size: z.string().min(1).max(20),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  minIncrement: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  buyNowPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount').optional().or(z.literal('')),
  startsAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
    .refine(
      (v) => Date.parse(v) >= Date.now() + 24 * 60 * 60 * 1000 - 5 * 60 * 1000,
      'Auction cannot start immediately. Must be scheduled at least 24 hours (1 day) in advance.',
    )
    .refine(
      (v) => Date.parse(v) <= Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000,
      'Auction cannot be scheduled more than 30 days (1 month) in advance.',
    ),
  endsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  tags: z.string().optional(),
});
type FormData = z.infer<typeof Schema>;
const CONDITIONS = [
  { value: 'NEW', label: 'New with tags' },
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
] as const;

export const CreateAuctionPage = () => {
  const navigate = useNavigate();
  const create = useCreateAuction();
  const [images, setImages] = useState<{ url: string; isCover: boolean }[]>([]);
  const [driveLink, setDriveLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [provenance, setProvenance] = useState('');
  const [provenanceProofUrls, setProvenanceProofUrls] = useState<string[]>([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const proofFileInputRef = useRef<HTMLInputElement>(null);

  const handleProofFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    if (provenanceProofUrls.length + fileArray.length > 5) {
      toast.error('You can upload at most 5 documentation proof files.');
      return;
    }

    const validFiles = fileArray.filter((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        toast.error(`${file.name}: Unsupported image format (use JPG, PNG, WebP, or AVIF)`);
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: File exceeds 8 MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingProof(true);
    const toastId = toast.loading(`Uploading ${validFiles.length} documentation proof file${validFiles.length > 1 ? 's' : ''}…`);
    try {
      const uploadedUrls: string[] = [];
      for (const file of validFiles) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }
      setProvenanceProofUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success('Documentation proof uploaded successfully', { id: toastId });
    } catch {
      toast.error('Failed to upload proof files. Please try again.', { id: toastId });
    } finally {
      setIsUploadingProof(false);
      if (proofFileInputRef.current) proofFileInputRef.current.value = '';
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const validFiles = fileArray.filter((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        toast.error(`${file.name}: Unsupported image format (use JPG, PNG, WebP, or AVIF)`);
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: File exceeds 8 MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} to Cloudflare R2…`);
    try {
      const uploadedUrls: string[] = [];
      for (const file of validFiles) {
        const url = await uploadImage(file);
        uploadedUrls.push(url);
      }
      setImages((prev) => {
        const newImages = uploadedUrls.map((url, i) => ({
          url,
          isCover: prev.length === 0 && i === 0,
        }));
        return [...prev, ...newImages];
      });
      toast.success(`Uploaded ${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} successfully!`, { id: toastId });
    } catch {
      toast.error('Failed to upload some images. Please try again.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time (no timezone, no seconds).
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Schedule constraints: min 24 hours in future, max 30 days
  const defaultStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const defaultEndDate = new Date(defaultStartDate.getTime() + 24 * 60 * 60 * 1000);
  const minStartDate = toLocalInput(defaultStartDate);
  const maxStartDate = toLocalInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      condition: 'GOOD',
      category: 'Antiques',
      basePrice: '50.00',
      minIncrement: '5.00',
      startsAt: toLocalInput(defaultStartDate),
      endsAt: toLocalInput(defaultEndDate),
    },
  });

  const basePriceVal = watch('basePrice');
  const startsAtVal = watch('startsAt');
  const categoryVal = watch('category');
  const isAntique = categoryVal === 'Antiques';

  // Automatically keep endsAt locked to exactly 24 hours after startsAt
  useEffect(() => {
    if (startsAtVal) {
      const parsed = new Date(startsAtVal);
      if (!Number.isNaN(parsed.getTime())) {
        const autoEnd = new Date(parsed.getTime() + 24 * 60 * 60 * 1000);
        setValue('endsAt', toLocalInput(autoEnd), { shouldValidate: true });
      }
    }
  }, [startsAtVal, setValue]);

  const handleAddDriveLink = () => {
    const link = driveLink.trim();
    if (!link) return;

    const fileId = extractDriveFileId(link);
    if (!fileId) {
      toast.error('Invalid Google Drive link. Please paste a valid sharing link.');
      return;
    }

    const directUrl = driveDirectUrl(fileId);

    // Prevent duplicates
    if (images.some((img) => img.url === directUrl)) {
      toast.error('This image has already been added.');
      return;
    }

    setImages((prev) => [...prev, { url: directUrl, isCover: prev.length === 0 }]);
    setDriveLink('');
    toast.success('Image added');
  };

  const onSubmit = async (data: FormData, publish: boolean) => {
    if (images.length === 0) {
      toast.error('Add at least one image');
      return;
    }
    try {
      const startsAtDate = new Date(data.startsAt);
      const endsAtDate = new Date(startsAtDate.getTime() + 24 * 60 * 60 * 1000);

      const auction = await create.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category,
        brand: data.brand,
        condition: data.condition,
        size: data.size,
        basePrice: data.basePrice,
        minIncrement: data.minIncrement,
        ...(data.buyNowPrice ? { buyNowPrice: data.buyNowPrice } : {}),
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate.toISOString(),
        tags: (data.tags ?? '')
          .split(',')
          .map((s) => s.trim().replace(/^#/, ''))
          .filter(Boolean)
          .slice(0, 10),
        images: images.map(({ url, isCover }) => ({ url, isCover })),
        ...(isAntique && provenance.trim() ? { provenance: provenance.trim() } : {}),
        ...(isAntique && provenanceProofUrls.length > 0 ? { provenanceProofUrls } : {}),
        publish,
      });
      toast.success(publish ? 'Listing published' : 'Draft saved');
      navigate(`/auctions/${auction.id}`);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <p className="kicker">Sell</p>
      <h1 className="display-serif mt-2 text-display-md font-semibold">List an Item for Auction</h1>
      <p className="mt-3 text-sm text-muted">Fill in the details below. Your item will be scheduled for auction.</p>

      <form className="mt-10 space-y-8" noValidate>
        <div>
          <Label htmlFor="title">Item Name</Label>
          <Input id="title" {...register('title')} invalid={!!errors.title} className="mt-1.5" placeholder="Enter item name" />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="brand">Period / Maker</Label>
            <Input id="brand" {...register('brand')} invalid={!!errors.brand} className="mt-1.5" placeholder="e.g. Meiji Era, Cartier, Victorian, or Unknown" />
            <FieldError message={errors.brand?.message} />
          </div>
          <div>
            <Label htmlFor="size">Dimensions / Size</Label>
            <Input id="size" {...register('size')} invalid={!!errors.size} className="mt-1.5" placeholder="e.g. 10 × 12 × 4 in, 25 cm, or N/A" />
            <FieldError message={errors.size?.message} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Condition</Label>
            <Controller
              control={control}
              name="condition"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags (Optional)</Label>
          <Input id="tags" {...register('tags')} className="mt-1.5" placeholder="e.g. Edo Period, Horology, 19th Century, Hand-carved" />
          <p className="mt-1 text-xs text-muted">Separate multiple tags with commas (up to 10 tags).</p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} invalid={!!errors.description} className="mt-1.5" rows={6} />
          <FieldError message={errors.description?.message} />
        </div>

        {/* ── ANTIQUE-EXCLUSIVE PROVENANCE & PROOF SECTION ──────────────────────── */}
        {isAntique && (
          <div className="rounded-xl border border-[#B89C6F]/40 bg-[#FAF7F0] p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#0E1622] text-[#E8DCC8]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#0E1622]">
                  Provenance &amp; Authenticity Proof
                </h3>
                <p className="text-xs text-[#6B5A42] mt-0.5">
                  Exclusive to Antiques. Document known history, maker hallmarks, previous ownership, and attach verification proof.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="provenance" className="text-xs font-semibold uppercase tracking-wider text-[#7A633F]">
                Provenance &amp; Historical Context
              </Label>
              <Textarea
                id="provenance"
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                className="mt-1.5 border border-[#E0DAD0] bg-white text-sm text-[#0E1622] focus:border-[#B89C6F]"
                rows={3}
                placeholder="e.g. Sourced from a private collection in Kyoto, Japan. Circa late Edo period. Maker hallmarks stamped on iron tsuba. Undamaged."
              />
              <p className="mt-1 text-[11px] text-[#7A6E5D]">
                Detail previous ownership, era/century, maker stamps, appraisal records, or exhibition references.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#7A633F]">
                  Proof Documents &amp; Certificates
                </Label>
                <span className="text-xs text-[#7A6E5D]">
                  {provenanceProofUrls.length}/5 files
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#7A6E5D]">
                Upload certificates of authenticity, hallmark macro photos, appraisal paperwork, or accession receipts.
              </p>

              <input
                ref={proofFileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => handleProofFilesSelected(e.target.files)}
              />

              <div
                onClick={() => proofFileInputRef.current?.click()}
                className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#B89C6F]/50 bg-white/60 p-6 text-center hover:bg-white hover:border-[#B89C6F] transition-all"
              >
                <UploadCloud className="h-6 w-6 text-[#8E764E]" />
                <span className="text-xs font-medium text-[#0E1622]">
                  {isUploadingProof ? 'Uploading proof…' : 'Click to attach proof documents or hallmark photos'}
                </span>
                <span className="text-[11px] text-[#8E8070]">
                  JPG, PNG, WebP or AVIF up to 8 MB
                </span>
              </div>

              {provenanceProofUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {provenanceProofUrls.map((url, idx) => (
                    <div key={idx} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-[#D5CBBF] shadow-xs">
                      <img src={url} alt={`Proof ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProvenanceProofUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove proof"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="basePrice">Opening bid (₹)</Label>
            <Input id="basePrice" {...register('basePrice')} invalid={!!errors.basePrice} className="mt-1.5 tabular" />
            <FieldError message={errors.basePrice?.message} />
            {Number(basePriceVal) > 0 && (
              <p className="mt-1 text-[11px] text-muted">
                You receive 90% (~₹{(Number(basePriceVal) * 0.9).toFixed(0)}) after the 10% platform fee upon successful settlement.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="minIncrement">Minimum bid increment (₹)</Label>
            <Input id="minIncrement" {...register('minIncrement')} invalid={!!errors.minIncrement} className="mt-1.5 tabular" />
            <FieldError message={errors.minIncrement?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="buyNowPrice">Buy It Now price (₹) — optional</Label>
          <Input
            id="buyNowPrice"
            {...register('buyNowPrice')}
            invalid={!!errors.buyNowPrice}
            className="mt-1.5 tabular"
            placeholder="Leave blank for auction-only"
          />
          <FieldError message={errors.buyNowPrice?.message} />
          <p className="mt-1 text-xs text-muted">
            Optional: set a fixed price at which a buyer can purchase this item immediately.
            Must be at least 20% above opening bid.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="startsAt">Auction starts (Min 24h ahead, Max 1 month)</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              min={minStartDate}
              max={maxStartDate}
              {...register('startsAt')}
              invalid={!!errors.startsAt}
              className="mt-1.5"
            />
            <FieldError message={errors.startsAt?.message} />
            <p className="mt-1 text-[11px] text-muted">
              Auctions cannot start immediately. Must be scheduled between 1 day and 30 days in advance.
            </p>
          </div>
          <div>
            <Label htmlFor="endsAt">Auction ends (Strict 24-hour window)</Label>
            <Input
              id="endsAt"
              type="datetime-local"
              {...register('endsAt')}
              invalid={!!errors.endsAt}
              className="mt-1.5 bg-ink-50/50 cursor-not-allowed text-muted select-none"
              readOnly
            />
            <FieldError message={errors.endsAt?.message} />
            <p className="mt-1 text-[11px] text-muted">
              Automatically locked to exactly 24 hours. Bidding closes 24 hours after the start time.
            </p>
          </div>
        </div>


        <div>
          <div className="flex items-center justify-between">
            <Label>Listing Photos</Label>
            <span className="text-xs text-muted">
              {images.length > 0 ? `${images.length}/10 photos · click photo to set cover` : '1 to 10 photos'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Upload clear, well-lit photos showing condition, maker marks, hallmarks, or details.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilesSelected(e.dataTransfer.files);
            }}
            className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-canvas p-8 text-center cursor-pointer hover:border-accent/60 hover:bg-subtle/50 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </div>
            {isUploading ? (
              <p className="text-sm font-medium text-ink">Uploading to Cloudflare R2…</p>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">
                  Click to select photos or drag & drop here
                </p>
                <p className="text-xs text-muted">
                  Supports Camera / Photo Library on mobile (JPEG, PNG, WebP up to 8 MB)
                </p>
              </>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="text-xs text-muted hover:text-ink underline transition-colors"
            >
              {showLinkInput ? 'Hide link option' : 'Or paste Google Drive / image link'}
            </button>
          </div>

          {showLinkInput && (
            <div className="mt-2 flex gap-2">
              <Input
                id="driveLink"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="flex-1"
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDriveLink();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddDriveLink}
                disabled={!driveLink.trim()}
              >
                <Link2 className="mr-1.5 h-4 w-4" />
                Add Link
              </Button>
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                    img.isCover ? 'border-accent shadow-sm' : 'border-line hover:border-ink/40'
                  }`}
                  onClick={() => {
                    setImages((prev) =>
                      prev.map((item, i) => ({
                        ...item,
                        isCover: i === idx,
                      })),
                    );
                  }}
                  title="Click to set as cover photo"
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 rounded-full bg-canvas/90 p-1 text-ink opacity-0 transition-opacity group-hover:opacity-100 hover:bg-canvas shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages((prev) => {
                        const next = prev.filter((_, i) => i !== idx);
                        if (img.isCover && next.length > 0 && next[0]) {
                          next[0] = { url: next[0].url, isCover: true };
                        }
                        return next;
                      });
                    }}
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {img.isCover ? (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-canvas shadow">
                      Cover
                    </span>
                  ) : (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      Set as cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {images.length >= 10 && (
            <p className="mt-2 text-xs text-muted">Maximum 10 images reached.</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-line pt-8">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={create.isPending}
            onClick={handleSubmit((d) => onSubmit(d, false))}
          >
            Save draft
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={create.isPending}
            onClick={handleSubmit((d) => onSubmit(d, true))}
          >
            {create.isPending ? 'Publishing…' : 'List Item'}
          </Button>
        </div>
      </form>
    </div>
  );
};

