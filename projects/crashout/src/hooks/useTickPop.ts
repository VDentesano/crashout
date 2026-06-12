import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Discrete scale-pop on the multiplier ticker — the "feels alive" beat. Chrome
 * only: animates a wrapper transform, never the rAF-driven value itself (two
 * drivers on one number would fight). The pop fires on each new 0.1 step, so the
 * cadence tracks the curve — a slow heartbeat early, a frantic flutter near the
 * crash — mapping rising tension. Throttled so high multipliers pulse rather than
 * jitter. Honors prefers-reduced-motion via gsap.matchMedia (value still counts,
 * just no pop).
 */
export function useTickPop(value: number, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const lastPop = useRef(0);
  const allow = useRef(true);

  // Resolve reduced-motion once; matchMedia keeps it reactive to OS changes.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: reduce)', () => {
      allow.current = false;
      return () => {
        allow.current = true;
      };
    });
    return () => mm.revert();
  }, []);

  useEffect(() => {
    const el = ref.current;
    // Leaving the live state re-arms the tracker so the next round pops cleanly
    // from 1.0 without a stale carry-over.
    if (!el || !active) {
      stepRef.current = 0;
      return;
    }
    const step = Math.floor(value * 10);
    if (step === stepRef.current) return;
    const arming = stepRef.current === 0;
    stepRef.current = step;
    if (arming || !allow.current) return;

    // Cap to ~18 pops/sec so a fast climb reads as a flutter, not a blur.
    const now = performance.now();
    if (now - lastPop.current < 55) return;
    lastPop.current = now;

    gsap.fromTo(
      el,
      { scale: 1.14 },
      { scale: 1, duration: 0.18, ease: 'power2.out', overwrite: true },
    );
  }, [value, active]);

  return ref;
}
