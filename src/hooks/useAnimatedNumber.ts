import { useEffect, useRef, useState } from 'react';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts smoothly from the previous value to `target` when the target changes (e.g. a filter).
 * On first render it shows `target` immediately, so opening a tab never shows an in-between
 * number. Interruptible: a new target continues from whatever is on screen. Always lands exactly on `target`.
 */
export function useAnimatedNumber(target: number, duration = 400): number {
  const [value, setValue] = useState(target);
  const shown = useRef(target);

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
