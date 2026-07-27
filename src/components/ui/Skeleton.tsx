import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Editorial skeletons. We deliberately use a soft fade (no shimmer) — shimmer
 * skeletons read as "AI dashboard". The fade matches our editorial palette.
 */
export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('animate-pulse rounded bg-ink-50', className)}
    aria-hidden
    {...props}
  />
);
