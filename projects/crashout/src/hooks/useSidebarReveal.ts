import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Desktop-only entrance for the Dynamic Island sidebar: its rows stagger in
 * once on mount. Gated to >=1024px (where `.rail` is a real glass panel — on
 * mobile it's `display: contents`, so there is nothing to reveal) and to
 * no-preference via `gsap.matchMedia`, so reduced-motion users see it instantly.
 * Chrome-only transform/opacity on the wrapper's children — never the game loop.
 */
export function useSidebarReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el.children,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.34, stagger: 0.08, ease: 'power2.out' },
      );
    });
    return () => mm.revert();
  }, []);
  return ref;
}
