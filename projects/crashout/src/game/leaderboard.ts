// Leaderboard client — best-effort fetch, offline-tolerant.
// Mirrors the silent-failure pattern used by history.ts.

const LEADERBOARD_URL = (() => {
  const eventsUrl = import.meta.env.VITE_INSFORGE_EVENTS_URL as string | undefined;
  if (!eventsUrl) return undefined;
  return eventsUrl.replace(/\/events$/, '/leaderboard');
})();

export type LeaderboardMetric = 'netDelta' | 'bestCashout' | 'winRate';
export type LeaderboardWindow = 'all' | '7d';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  value: number;
  matchesPlayed: number;
}

/**
 * Fetch the global leaderboard. Returns null on any error (offline-tolerant).
 */
export async function fetchLeaderboard(params: {
  metric?: LeaderboardMetric;
  window?: LeaderboardWindow;
  limit?: number;
}): Promise<{ leaderboard: LeaderboardEntry[] } | null> {
  if (!LEADERBOARD_URL) return null;
  try {
    const res = await fetch(LEADERBOARD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', ...params }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
