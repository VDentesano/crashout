import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Impact FX — the "feel" beats at the two emotional peaks of a duel: the crash
 * (trauma) and the match win (reward). All motion here is GSAP, which bypasses
 * the global CSS `animation: none` reduced-motion rule, so every effect checks
 * `reduced()` before spawning and no-ops when motion is off. The red/volt flash
 * overlays are React-rendered opacity fades — they fire regardless and carry the
 * signal when motion is suppressed.
 *
 * Chrome only: nothing here touches the rAF curve/ticker loop (two drivers on
 * one value would fight) — shakes the frame, pops a panel, throws particles.
 */
function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Radiating particle shower — `count` dots thrown outward from the container's
 * centre, each auto-removed when its tween ends. Shared primitive behind the
 * cash-out and match-win bursts. Deterministic angles (no RNG) keep it cheap and
 * predictable; the odd/even jitter just breaks the perfect-ring look.
 */
function shower(container: HTMLElement, count: number, color: string, dist: number) {
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'fx-dot';
    dot.style.background = color;
    dot.style.boxShadow = `0 0 10px ${color}`;
    container.appendChild(dot);
    const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.5;
    const reach = dist * (0.72 + (i % 3) * 0.16);
    gsap.fromTo(
      dot,
      { opacity: 1, x: '-50%', y: '-50%', scale: 1 },
      {
        opacity: 0,
        x: `calc(-50% + ${Math.cos(angle) * reach}px)`,
        y: `calc(-50% + ${Math.sin(angle) * reach}px)`,
        scale: 0,
        duration: 0.55,
        ease: 'power2.out',
        onComplete: () => dot.remove(),
      },
    );
  }
}

/** Fire `effect` once on each false→true edge of `active`. */
function useEdge(active: boolean, effect: () => void) {
  const prev = useRef(false);
  useEffect(() => {
    if (active && !prev.current) effect();
    prev.current = active;
    // effect closes over the latest refs each render; deps on `active` only so we
    // fire on the edge, not on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

/**
 * Crash trauma — a decaying GSAP shake on the app frame. Richer than the old CSS
 * loop: hard first jolt, each swing smaller, settles to rest. Ref goes on `.app`.
 */
export function useCrashShake(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEdge(active, () => {
    const el = ref.current;
    if (!el || reduced()) return;
    gsap
      .timeline()
      .to(el, { x: -10, y: 5, duration: 0.05, ease: 'power1.in' })
      .to(el, { x: 8, y: -6, duration: 0.05 })
      .to(el, { x: -7, y: 3, duration: 0.05 })
      .to(el, { x: 5, y: -4, duration: 0.05 })
      .to(el, { x: -3, y: 2, duration: 0.05 })
      .to(el, { x: 0, y: 0, duration: 0.08, ease: 'power1.out', clearProps: 'transform' });
  });
  return ref;
}

/**
 * Cash-out particle burst — volt dots radiating from the stage centre the instant
 * the player locks in, layered over the existing CSS ring. Ref goes on `.stage`.
 */
export function useCashShower(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEdge(active, () => {
    const el = ref.current;
    if (!el || reduced()) return;
    shower(el, 8, 'rgba(0, 255, 133, 0.95)', 90);
  });
  return ref;
}

/**
 * Match-win celebration — an elastic pop on the player's panel plus a gold/volt
 * particle shower from its centre. The static volt glow (`.panel.won` in CSS)
 * carries the held reward state; GSAP owns only the one-shot transform so the two
 * never fight over box-shadow. Ref goes on the winning ScorePanel.
 */
export function useWinCelebration(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEdge(active, () => {
    const el = ref.current;
    if (!el || reduced()) return;
    gsap
      .timeline({ onComplete: () => gsap.set(el, { clearProps: 'transform' }) })
      .fromTo(el, { scale: 1 }, { scale: 1.06, duration: 0.18, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.6)' });
    shower(el, 10, 'rgba(0, 255, 133, 0.9)', 80);
  });
  return ref;
}
