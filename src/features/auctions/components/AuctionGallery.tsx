import { useState } from 'react';
import { cn } from '@/lib/cn';
import { type AuctionImage } from '../types';

interface AuctionGalleryProps {
  images: AuctionImage[];
  alt: string;
  isAntique?: boolean;
}

export const AuctionGallery = ({ images, alt, isAntique }: AuctionGalleryProps) => {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = sorted[activeIdx] ?? sorted[0];

  if (!active) {
    return (
      <div
        className={cn(
          'aspect-square w-full rounded-lg',
          isAntique ? 'border border-[#E5E0D8] bg-[#F7F5F0]' : 'bg-ink-50',
        )}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-lg bg-[#F7F5F0]',
          isAntique
            ? 'border border-[#E5E0D8] shadow-sm'
            : '',
        )}
      >
        <img
          src={active.url}
          alt={alt}
          className="h-full w-full object-cover"
          loading="eager"
          referrerPolicy="no-referrer"
        />
        {isAntique && (
          <div className="absolute top-3 left-3 rounded border border-[#B89C6F]/40 bg-[#0E1622]/90 backdrop-blur px-2.5 py-1 text-[10px] uppercase font-medium text-[#E8DCC8] shadow-sm">
            Plate {activeIdx + 1} of {sorted.length}
          </div>
        )}
      </div>
      {sorted.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(idx)}
              className={cn(
                'aspect-square overflow-hidden rounded border-2 transition-all',
                isAntique
                  ? idx === activeIdx
                    ? 'border-[#B89C6F] ring-1 ring-[#B89C6F]/50 shadow-sm'
                    : 'border-[#E5E0D8] bg-[#F7F5F0] hover:border-[#B89C6F]/50'
                  : idx === activeIdx
                    ? 'border-ink bg-ink-50'
                    : 'border-transparent hover:border-line bg-ink-50',
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
