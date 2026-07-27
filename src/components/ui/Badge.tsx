import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded text-[11px] font-medium uppercase tracking-kicker px-2 py-1',
  {
    variants: {
      tone: {
        neutral: 'bg-ink-50 text-ink-600',
        ink: 'bg-ink text-canvas',
        live: 'bg-success/10 text-success',
        warn: 'bg-warn/10 text-warn',
        danger: 'bg-danger/10 text-danger',
        accent: 'bg-accent/10 text-accent',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props} />
);

export const StatusDot = ({ tone = 'live' }: { tone?: 'live' | 'neutral' | 'danger' }) => {
  const map = { live: 'bg-success', neutral: 'bg-ink-300', danger: 'bg-danger' } as const;
  return (
    <span className="relative inline-flex h-2 w-2 items-center justify-center">
      <span className={cn('absolute inset-0 rounded-full opacity-50 animate-ping', map[tone])} />
      <span className={cn('relative h-2 w-2 rounded-full', map[tone])} />
    </span>
  );
};
