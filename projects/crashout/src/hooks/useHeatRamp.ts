import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';

/**
 * Milestone 1 #10 — continuous heat ramp on the live multiplier ticker.
 *
 * Replaces the old stepped CSS heat classes (.live.warm at 5x, .live.hot at 10x)
 * with a smooth volt→gold→amber color tween that tracks the climb frame-by-frame,
 * so greed warms continuously instead of snapping at thresholds.
 *
 * Chrome only: this reads the rAF-driven value and *maps* it to a color — it never
 * tweens over time and never touches the value, so it can't fight the game loop
 * (the "two drivers" rule). Color is temperature, not motion, so it stays on under
 * reduced-motion (matching the prior CSS contract — only travel is ever suppressed).
 *
 * On leaving the live state the inline styles are cleared so the .idle / .crash CSS
 * classes own the color again.
 */
const VOLT = '#00ff85';
const GOLD = '#ffd23f';
const AMBER = '#ffb020';

// Glow color at each heat stop (matches the old text-shadow rgba stops).
const GLOW = ['rgba(0,255,133,0.55)', 'rgba(255,210,63,0.55)', 'rgba(255,176,32,0.6)'];

const lerpColor = gsap.utils.interpolate([VOLT, GOLD, AMBER]);
const lerpGlow = gsap.utils.interpolate(GLOW);
// 1.5x = full volt, 5.75x = gold midpoint, 10x = full amber, clamped past 10x.
const heatOf = gsap.utils.pipe(gsap.utils.mapRange(1.5, 10, 0, 1), gsap.utils.clamp(0, 1));

export function useHeatRamp(
  ref: RefObject<HTMLDivElement | null>,
  value: number,
  active: boolean,
) {
  const wasActive = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!active) {
      // Hand color back to the CSS state class on the way out.
      if (wasActive.current) {
        el.style.color = '';
        el.style.textShadow = '';
        wasActive.current = false;
      }
      return;
    }
    wasActive.current = true;
    const t = heatOf(value);
    el.style.color = lerpColor(t);
    el.style.textShadow = `0 0 ${34 + t * 8}px ${lerpGlow(t)}`;
  }, [ref, value, active]);

  return ref;
}
