import { useEffect, useRef, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts smoothly from the previous value to `target`. Interruptible: a new target
 * continues from whatever is on screen. Always lands exactly on `target`.
 */
export function useAnimatedNumber(target: number, duration = 500): number {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    const start = shown.current;
    if (reducedMotion() || start === target) {
      shown.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = p === 1 ? target : Math.round(start + (target - start) * eased);
      shown.current = v;
      setValue(v);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
