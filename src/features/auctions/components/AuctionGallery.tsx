import { useState } from 'react';
import { cn } from '@/lib/cn';
import { type AuctionImage } from '../types';

interface AuctionGalleryProps {
  images: AuctionImage[];
  alt: string;
}

export const AuctionGallery = ({ images, alt }: AuctionGalleryProps) => {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = sorted[activeIdx] ?? sorted[0];

  if (!active) {
    return <div className="aspect-square w-full rounded-lg bg-ink-50" />;
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-ink-50">
        <img
          src={active.url}
          alt={alt}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      {sorted.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(idx)}
              className={cn(
                'aspect-square overflow-hidden rounded border-2 bg-ink-50 transition-colors',
                idx === activeIdx ? 'border-ink' : 'border-transparent hover:border-line',
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
