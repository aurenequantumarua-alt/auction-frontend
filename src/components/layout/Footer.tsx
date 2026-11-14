import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/features/theme/themeStore';
import { cn } from '@/lib/cn';

export const Footer = () => {
  const location = useLocation();
  const isAntiqueMode = useThemeStore((s) => s.isAntiqueMode);
  const isAntique = isAntiqueMode || location.pathname.startsWith('/antiques');

  return (
    <footer
      className={cn(
        'mt-24 py-14 transition-colors duration-200',
        isAntique
          ? 'border-t border-[#B89C6F]/30 bg-[#0E1622] text-[#C4B7A5]'
          : 'border-t border-line bg-canvas text-muted',
      )}
    >
      <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <div
            className={cn(
              'font-display text-xl font-semibold',
              isAntique ? 'text-[#FBFBF9]' : 'text-ink',
            )}
          >
            Aurene
          </div>
          <p
            className={cn(
              'mt-2 max-w-sm text-sm leading-relaxed',
              isAntique ? 'text-[#A39684]' : 'text-muted',
            )}
          >
            {isAntique
              ? 'Curated auctions for fine antiques, rare watches, and historic artifacts. Protected by documented provenance and 48-hour escrow inspection.'
              : 'A curated auction platform for archive collections, designer fashion, and fine objects.'}
          </p>
        </div>
        <div
          className={cn(
            'flex flex-wrap gap-6 text-sm',
            isAntique ? 'text-[#C4B7A5]' : 'text-muted',
          )}
        >
          <Link
            to="/browse"
            className={cn('transition-colors', isAntique ? 'hover:text-[#FBFBF9]' : 'hover:text-ink')}
          >
            Explore Auctions
          </Link>
          <Link
            to="/antiques"
            className={cn('transition-colors', isAntique ? 'text-[#D4BC94] hover:text-white font-medium' : 'hover:text-ink')}
          >
            Antiques
          </Link>
          <Link
            to="/sell"
            className={cn('transition-colors', isAntique ? 'hover:text-[#FBFBF9]' : 'hover:text-ink')}
          >
            Sell
          </Link>
          <Link
            to="/about"
            className={cn('transition-colors', isAntique ? 'hover:text-[#FBFBF9]' : 'hover:text-ink')}
          >
            About
          </Link>
          <Link
            to="/terms"
            className={cn('transition-colors', isAntique ? 'hover:text-[#FBFBF9]' : 'hover:text-ink')}
          >
            Terms
          </Link>
          <Link
            to="/privacy"
            className={cn('transition-colors', isAntique ? 'hover:text-[#FBFBF9]' : 'hover:text-ink')}
          >
            Privacy
          </Link>
        </div>
      </div>
      <div
        className={cn(
          'container mt-8 text-xs',
          isAntique ? 'text-[#7D705E]' : 'text-ink-300',
        )}
      >
        © {new Date().getFullYear()} Aurene Fine Antiquities. All rights reserved.
      </div>
    </footer>
  );
};
