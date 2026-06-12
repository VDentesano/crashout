// Match history client — fire-and-forget record, best-effort list.
// Mirrors the silent-failure pattern used by economy.ts (balance sync).
import { playerId } from '../analytics/logger';

const HISTORY_URL = (() => {
  const eventsUrl = import.meta.env.VITE_INSFORGE_EVENTS_URL as string | undefined;
  if (!eventsUrl) return undefined;
  return eventsUrl.replace(/\/events$/, '/history');
})();

export interface MatchRecord {
  id: string;
  bet: number;
  outcome: 'win' | 'loss' | 'draw';
  crash_point: number;
  cashout_multiplier: number | null;
  delta: number;
  created_at: string;
}

export interface MatchStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  netDelta: number;
  bestCashout: number | null;
}

/**
 * Fire-and-forget: record a finished match. Silent on failure.
 */
export function recordMatch(params: {
  bet: number;
  outcome: 'win' | 'loss' | 'draw';
  crashPoint: number;
  cashoutMultiplier?: number | null;
  delta: number;
}): void {
  if (!HISTORY_URL) return;
  fetch(HISTORY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'record', playerId, ...params }),
    keepalive: true,
  }).catch(() => {
    /* network failure — silent */
  });
}

/**
 * Fetch recent matches + stats for the current player.
 * Returns null on any error (offline-tolerant).
 */
export async function fetchHistory(
  limit = 20,
): Promise<{ matches: MatchRecord[]; stats: MatchStats } | null> {
  if (!HISTORY_URL) return null;
  try {
    const res = await fetch(HISTORY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', playerId, limit }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
