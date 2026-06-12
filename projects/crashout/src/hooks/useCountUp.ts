import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number toward `target` over `ms` (easeOutCubic). Drives the
 * score "tick-up" that makes banking points feel earned instead of instant.
 * Respects prefers-reduced-motion by snapping straight to the target.
 */
export function useCountUp(target: number, ms = 650): number {
  const [value, setValue] = useState(target);
  // Mirrors the on-screen value so a mid-flight retarget eases from where it is.
  const valueRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = valueRef.current;
    if (reduce || ms <= 0 || from === target) {
      rafRef.current = requestAnimationFrame(() => {
        valueRef.current = target;
        setValue(target);
      });
      return () => cancelAnimationFrame(rafRef.current);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      valueRef.current = v;
      setValue(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, ms]);

  return value;
}
