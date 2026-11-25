import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useAnimatedNumber(target: number, duration = 400): number {
  const [value, setValue] = useState(target);
  const shown = useRef(target);

  useEffect(() => {
    const start = shown.current;
    if (start === target || prefersReducedMotion()) {
      shown.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = progress === 1 ? target : Math.round(start + (target - start) * eased);
      shown.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
