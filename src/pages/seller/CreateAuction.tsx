import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Link2, X } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import { Label, FieldError } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useCreateAuction } from '@/features/auctions/hooks';
import { ConnectBankDialog, isBankAccountRequired } from '@/components/common/ConnectBankDialog';
import { extractApiError } from '@/lib/api';

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

const Schema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(20).max(4000),
  category: z.enum(['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Bags', 'Suits', 'Knitwear', 'Denim', 'Vintage']),
  brand: z.string().min(1).max(80),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  size: z.string().min(1).max(20),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  minIncrement: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  buyNowPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount').optional().or(z.literal('')),
  startsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  endsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
  tags: z.string().optional(),
});
type FormData = z.infer<typeof Schema>;

const CATEGORIES = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories', 'Bags', 'Suits', 'Knitwear', 'Denim', 'Vintage'] as const;
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
  const [bankGateOpen, setBankGateOpen] = useState(false);

  // datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time (no timezone, no seconds).
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const startNow = toLocalInput(new Date());
  const inOneWeek = toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      condition: 'GOOD',
      category: 'Outerwear',
      basePrice: '50.00',
      minIncrement: '5.00',
      startsAt: startNow,
      endsAt: inOneWeek,
    },
  });

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
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: new Date(data.endsAt).toISOString(),
        tags: (data.tags ?? '').split(',').map((s) => s.trim()).filter(Boolean),
        images: images.map(({ url, isCover }) => ({ url, isCover })),
        publish,
      });
      toast.success(publish ? 'Listing published' : 'Draft saved');
      navigate(`/auctions/${auction.id}`);
    } catch (err) {
      if (isBankAccountRequired(err)) {
        setBankGateOpen(true);
        return;
      }
      toast.error(extractApiError(err).message);
    }
  };

  return (
    <div className="container max-w-3xl py-12">
      <p className="kicker">New listing</p>
      <h1 className="display-serif mt-2 text-display-md font-semibold">List a piece</h1>
      <p className="mt-3 text-sm text-muted">All fields are required. You can save as a draft and publish later.</p>

      <form className="mt-10 space-y-8" noValidate>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register('title')} invalid={!!errors.title} className="mt-1.5" placeholder="Felted wool field coat" />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} invalid={!!errors.brand} className="mt-1.5" />
            <FieldError message={errors.brand?.message} />
          </div>
          <div>
            <Label htmlFor="size">Size</Label>
            <Input id="size" {...register('size')} invalid={!!errors.size} className="mt-1.5" placeholder="M / 32 / 9" />
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
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} invalid={!!errors.description} className="mt-1.5" rows={6} />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="basePrice">Starting price (₹)</Label>
            <Input id="basePrice" {...register('basePrice')} invalid={!!errors.basePrice} className="mt-1.5 tabular" />
            <FieldError message={errors.basePrice?.message} />
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
            Optional: set a price at which a buyer can purchase and end this auction immediately.
            Must be at least 20% above starting price.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="startsAt">Auction starts</Label>
            <Input id="startsAt" type="datetime-local" {...register('startsAt')} invalid={!!errors.startsAt} className="mt-1.5" />
            <FieldError message={errors.startsAt?.message} />
          </div>
          <div>
            <Label htmlFor="endsAt">Auction ends</Label>
            <Input id="endsAt" type="datetime-local" {...register('endsAt')} invalid={!!errors.endsAt} className="mt-1.5" />
            <FieldError message={errors.endsAt?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" {...register('tags')} className="mt-1.5" placeholder="archive, fw19, deadstock" />
        </div>

        <div>
          <Label>Images</Label>
          <p className="mt-1 text-xs text-muted">
            Paste a Google Drive sharing link. Make sure the file is set to <strong>"Anyone with the link"</strong> can view.
          </p>
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
              Add
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div key={idx} className="group relative aspect-square overflow-hidden rounded border border-line">
                <img src={img.url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 rounded bg-canvas/95 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setImages((prev) => {
                    const next = prev.filter((_, i) => i !== idx);
                    // If we removed the cover image, make the first remaining image the cover
                    if (img.isCover && next.length > 0 && next[0]) {
                      next[0] = { url: next[0].url, isCover: true };
                    }
                    return next;
                  })}
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {img.isCover && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-kicker text-canvas">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
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
            {create.isPending ? 'Publishing…' : 'Publish listing'}
          </Button>
        </div>
      </form>

      <ConnectBankDialog open={bankGateOpen} onOpenChange={setBankGateOpen} reason="sell" />
    </div>
  );
};

