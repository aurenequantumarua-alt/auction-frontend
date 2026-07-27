const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const currencyExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPrice = (value: string | number, exact = false): string => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return (exact ? currencyExact : currency).format(n);
};

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1_000],
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  for (const [unit, ms] of relativeUnits) {
    if (Math.abs(diff) >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return '';
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  ended: boolean;
}

export const breakdownMs = (ms: number): CountdownParts => {
  const ended = ms <= 0;
  const t = Math.max(0, ms);
  return {
    days: Math.floor(t / 86_400_000),
    hours: Math.floor((t % 86_400_000) / 3_600_000),
    minutes: Math.floor((t % 3_600_000) / 60_000),
    seconds: Math.floor((t % 60_000) / 1_000),
    totalMs: t,
    ended,
  };
};

export const formatCountdown = (ms: number): string => {
  const p = breakdownMs(ms);
  if (p.ended) return 'Ended';
  if (p.days > 0) return `${p.days}d ${p.hours}h ${p.minutes}m`;
  if (p.hours > 0) return `${p.hours}h ${p.minutes}m ${p.seconds.toString().padStart(2, '0')}s`;
  return `${p.minutes}m ${p.seconds.toString().padStart(2, '0')}s`;
};
