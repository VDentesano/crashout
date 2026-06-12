import { playerId } from '../analytics/logger';
import { applyDelta, computeDelta, reconcileBalance } from './economy.pure';

const BALANCE_KEY = 'co:balance';
const DEFAULT_BALANCE = 1000;

export const BET_OPTIONS = [50, 100, 250, 500] as const;
export type BetOption = (typeof BET_OPTIONS)[number];
export const MIN_BET = BET_OPTIONS[0];
export const REBUY_AMOUNT = 1000;

// Derived from the same env var pattern as events/rounds — the balance function
// lives alongside them, so we substitute /events → /balance at runtime.
const BALANCE_URL = (() => {
  const eventsUrl = import.meta.env.VITE_INSFORGE_EVENTS_URL as string | undefined;
  if (!eventsUrl) return undefined;
  return eventsUrl.replace(/\/events$/, '/balance');
})();

export function getBalance(): number {
  const v = localStorage.getItem(BALANCE_KEY);
  return v !== null ? Math.max(0, parseInt(v, 10)) : DEFAULT_BALANCE;
}

function saveBalance(n: number): void {
  localStorage.setItem(BALANCE_KEY, String(Math.max(0, n)));
}

// Reconcile: server value wins. Updates localStorage and returns the balance.
function reconcile(serverBalance: number): number {
  const clamped = reconcileBalance(serverBalance);
  saveBalance(clamped);
  return clamped;
}

// Fire-and-forget POST to the balance function; reconcile on success, silent on failure.
function syncBalance(
  body: Record<string, unknown>,
  onReconcile?: (b: number) => void,
): void {
  if (!BALANCE_URL) return;
  fetch(BALANCE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, playerId }),
    keepalive: true,
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { balance?: number } | null) => {
      if (data && typeof data.balance === 'number') {
        const b = reconcile(data.balance);
        onReconcile?.(b);
      }
    })
    .catch(() => {
      /* network failure — keep local optimistic value */
    });
}

/**
 * On app load: fetch server balance and reconcile. Calls back with the
 * server-authoritative value so the UI can update if it differs from localStorage.
 */
export function fetchAndReconcileBalance(onReconcile: (b: number) => void): void {
  syncBalance({ action: 'get' }, onReconcile);
}

export function applyMatchResult(
  bet: number,
  outcome: 'win' | 'loss' | 'draw',
  onReconcile?: (b: number) => void,
): { balance: number; delta: number } {
  const current = getBalance();
  const delta = computeDelta(outcome, bet);
  const balance = applyDelta(current, delta);
  saveBalance(balance);
  // Background sync — server is authoritative, reconcile when it responds.
  syncBalance({ action: 'apply', bet, outcome }, onReconcile);
  return { balance, delta };
}

export function rebuy(onReconcile?: (b: number) => void): number {
  saveBalance(REBUY_AMOUNT);
  syncBalance({ action: 'rebuy' }, onReconcile);
  return REBUY_AMOUNT;
}
