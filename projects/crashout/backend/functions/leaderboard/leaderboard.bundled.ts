// DEPLOY ARTIFACT — `leaderboard` edge function, self-contained for INSFORGE deploy.
//
// Returns ranked players aggregated from the matches table.
//
// Actions (POST JSON):
//   {action:'list', metric?, window?, limit?}
//     metric: 'netDelta' (default), 'bestCashout', 'winRate'
//     window: 'all' (default), '7d'
//     limit:  1–50, default 20
//     → {leaderboard: [{rank, playerId, value, matchesPlayed}]}
//
// winRate requires ≥5 matches to qualify (players with fewer are excluded).
// Runtime: Deno. Reserved env (auto-injected): INSFORGE_BASE_URL, API_KEY.
import { createClient } from 'npm:@insforge/sdk';

const VALID_METRICS = new Set(['netDelta', 'bestCashout', 'winRate']);
const VALID_WINDOWS = new Set(['all', '7d']);
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const WIN_RATE_MIN_MATCHES = 5;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export default async function (request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json(405, { error: 'method not allowed' });

  let body: Record<string, unknown>;
  try {
    const raw = await request.json();
    if (!isObject(raw)) return json(400, { error: 'body must be a JSON object' });
    body = raw;
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const { action } = body;
  if (action !== 'list') return json(400, { error: 'unknown action' });

  // Validate metric
  const metricRaw = body.metric ?? 'netDelta';
  if (typeof metricRaw !== 'string' || !VALID_METRICS.has(metricRaw)) {
    return json(400, { error: "metric must be 'netDelta', 'bestCashout', or 'winRate'" });
  }
  const metric = metricRaw as 'netDelta' | 'bestCashout' | 'winRate';

  // Validate window
  const windowRaw = body.window ?? 'all';
  if (typeof windowRaw !== 'string' || !VALID_WINDOWS.has(windowRaw)) {
    return json(400, { error: "window must be 'all' or '7d'" });
  }
  const timeWindow = windowRaw as 'all' | '7d';

  // Validate limit — if provided, must be an integer in 1–50; anything else → 400 (QA F-02).
  const limitRaw = body.limit;
  let limit = DEFAULT_LIMIT;
  if (limitRaw !== undefined) {
    if (
      typeof limitRaw !== 'number' ||
      !Number.isInteger(limitRaw) ||
      limitRaw < 1 ||
      limitRaw > MAX_LIMIT
    ) {
      return json(400, { error: `limit must be an integer between 1 and ${MAX_LIMIT}` });
    }
    limit = limitRaw;
  }

  const env = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env;
  const baseUrl = env?.get('INSFORGE_BASE_URL');
  const apiKey = env?.get('API_KEY');
  if (!baseUrl || !apiKey) return json(500, { error: 'backend env not configured' });

  const client = createClient({ baseUrl, anonKey: apiKey });

  // Build the base query filtered by time window.
  // We fetch all rows matching the window, then aggregate in-function.
  // The matches_leaderboard index (player_id, outcome, delta, created_at) covers this.
  let query = client.database
    .from('matches')
    .select('player_id, outcome, delta, cashout_multiplier');

  if (timeWindow === '7d') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', since);
  }

  const { data: rows, error } = await query;
  if (error) return json(500, { error: 'failed to fetch matches' });

  const allRows = Array.isArray(rows)
    ? (rows as { player_id: string; outcome: string; delta: number; cashout_multiplier: number | null }[])
    : [];

  // Aggregate per player
  const agg = new Map<string, { wins: number; total: number; netDelta: number; bestCashout: number | null }>();
  for (const r of allRows) {
    const pid = r.player_id;
    if (!agg.has(pid)) {
      agg.set(pid, { wins: 0, total: 0, netDelta: 0, bestCashout: null });
    }
    const p = agg.get(pid)!;
    p.total++;
    p.netDelta += Number(r.delta);
    if (r.outcome === 'win') p.wins++;
    if (r.cashout_multiplier != null) {
      const cm = Number(r.cashout_multiplier);
      if (p.bestCashout === null || cm > p.bestCashout) p.bestCashout = cm;
    }
  }

  // Build ranked list
  type Entry = { playerId: string; value: number; matchesPlayed: number };
  const entries: Entry[] = [];

  for (const [pid, p] of agg) {
    if (metric === 'netDelta') {
      entries.push({ playerId: pid, value: p.netDelta, matchesPlayed: p.total });
    } else if (metric === 'bestCashout') {
      if (p.bestCashout !== null) {
        entries.push({ playerId: pid, value: p.bestCashout, matchesPlayed: p.total });
      }
    } else {
      // winRate — require ≥ WIN_RATE_MIN_MATCHES
      if (p.total >= WIN_RATE_MIN_MATCHES) {
        entries.push({ playerId: pid, value: p.wins / p.total, matchesPlayed: p.total });
      }
    }
  }

  // Sort descending by value, break ties by matchesPlayed desc
  entries.sort((a, b) => b.value - a.value || b.matchesPlayed - a.matchesPlayed);

  const top = entries.slice(0, limit);
  const leaderboard = top.map((e, i) => ({ rank: i + 1, ...e }));

  return json(200, { leaderboard });
}
