// Mute-preference resolution — kept browser-global-free so it is unit-testable
// under `node` (the engine imports these; the test imports only this file).

export const MUTE_KEY = 'crashout_muted_v1';

/**
 * Resolve whether audio starts muted.
 *
 * An explicit stored choice always wins. `prefers-reduced-motion` is only a
 * *default* for the unset case — it must never override a user who deliberately
 * turned sound on. (There is no broadly-supported reduced-sound query, so
 * reduced-motion is a reasonable proxy default, nothing more.)
 */
export function resolveMuted(stored: string | null, reducedMotion: boolean): boolean {
  if (stored === '1') return true;
  if (stored === '0') return false;
  return reducedMotion;
}
