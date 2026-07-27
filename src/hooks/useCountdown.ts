import { useEffect, useState } from 'react';
import { breakdownMs, type CountdownParts } from '@/lib/format';

/**
 * Tick once per second toward `target`. Returns ended=true when reached.
 * The tick clamps at 0; mounting after target returns ended state immediately.
 */
export const useCountdown = (target: string | Date | null | undefined): CountdownParts => {
  const compute = (): CountdownParts => {
    if (!target) return breakdownMs(0);
    const t = typeof target === 'string' ? new Date(target).getTime() : target.getTime();
    return breakdownMs(t - Date.now());
  };

  const [parts, setParts] = useState<CountdownParts>(compute);

  useEffect(() => {
    setParts(compute());
    const id = setInterval(() => setParts(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return parts;
};
