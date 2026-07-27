import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/cn';

interface CountdownProps {
  endsAt: string | Date;
  className?: string;
  /** Render as a compact two-segment timer (HH:MM:SS) */
  compact?: boolean;
}

export const Countdown = ({ endsAt, className, compact }: CountdownProps) => {
  const t = useCountdown(endsAt);

  if (t.ended) {
    return <span className={cn('tabular text-muted', className)}>Ended</span>;
  }

  const urgent = t.totalMs < 60 * 60 * 1000; // last hour
  const veryUrgent = t.totalMs < 60 * 1000;  // last minute

  if (compact) {
    const segs: string[] = [];
    if (t.days > 0) segs.push(`${t.days}d`);
    segs.push(`${t.hours.toString().padStart(2, '0')}h`);
    segs.push(`${t.minutes.toString().padStart(2, '0')}m`);
    if (t.days === 0) segs.push(`${t.seconds.toString().padStart(2, '0')}s`);
    return (
      <span
        className={cn(
          'tabular',
          urgent && 'text-warn',
          veryUrgent && 'text-danger',
          className,
        )}
      >
        {segs.join(' ')}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'tabular tracking-tight',
        urgent && 'text-warn',
        veryUrgent && 'text-danger',
        className,
      )}
    >
      {t.days > 0 && <>{t.days}d </>}
      {t.hours.toString().padStart(2, '0')}:{t.minutes.toString().padStart(2, '0')}:
      {t.seconds.toString().padStart(2, '0')}
    </span>
  );
};
