// Pure helpers extracted from economy.ts so they can be unit-tested without
// browser globals (localStorage, import.meta.env). Imported by economy.ts.

export const BET_OPTIONS_SET = new Set([50, 100, 250, 500]);

/** Compute the balance delta for a match result. */
export function computeDelta(outcome: 'win' | 'loss' | 'draw', bet: number): number {
  return outcome === 'win' ? bet : outcome === 'loss' ? -bet : 0;
}

/** Apply delta to current balance, clamping at 0. */
export function applyDelta(current: number, delta: number): number {
  return Math.max(0, current + delta);
}

/** Server balance reconcile: server wins, clamped at 0. */
export function reconcileBalance(serverBalance: number): number {
  return Math.max(0, serverBalance);
}
