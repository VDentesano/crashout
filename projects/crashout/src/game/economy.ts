const BALANCE_KEY = 'co:balance';
const DEFAULT_BALANCE = 1000;

export const BET_OPTIONS = [50, 100, 250, 500] as const;
export type BetOption = (typeof BET_OPTIONS)[number];
export const MIN_BET = BET_OPTIONS[0];
export const REBUY_AMOUNT = 1000;

export function getBalance(): number {
  const v = localStorage.getItem(BALANCE_KEY);
  return v !== null ? Math.max(0, parseInt(v, 10)) : DEFAULT_BALANCE;
}

function saveBalance(n: number): void {
  localStorage.setItem(BALANCE_KEY, String(Math.max(0, n)));
}

export function applyMatchResult(
  bet: number,
  outcome: 'win' | 'loss' | 'draw',
): { balance: number; delta: number } {
  const current = getBalance();
  const delta = outcome === 'win' ? bet : outcome === 'loss' ? -bet : 0;
  const balance = Math.max(0, current + delta);
  saveBalance(balance);
  return { balance, delta };
}

export function rebuy(): number {
  saveBalance(REBUY_AMOUNT);
  return REBUY_AMOUNT;
}
