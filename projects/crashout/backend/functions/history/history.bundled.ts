// DEPLOY ARTIFACT — `history` edge function, self-contained for INSFORGE deploy.
//
// Records completed matches and returns recent history + aggregate stats per player.
//
// Actions (POST JSON):
//   {action:'record', playerId, bet, outcome, crashPoint, cashoutMultiplier?, delta}
//     → inserts a match row, returns {ok: true}
//   {action:'list', playerId, limit?}
//     → returns {matches: [...], stats: {total, wins, losses, draws, winRate, netDelta, bestCashout}}
//
// Runtime: Deno. Reserved env (auto-injected): INSFORGE_BASE_URL, API_KEY.
import { createClient } from 'npm:@insforge/sdk';

const BET_OPTIONS = new Set([50, 100, 250, 500]);
const OUTCOMES = new Set(['win', 'loss', 'draw']);
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

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

function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= 64;
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

  const env = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env;
  const baseUrl = env?.get('INSFORGE_BASE_URL');
  const apiKey = env?.get('API_KEY');
  if (!baseUrl || !apiKey) return json(500, { error: 'backend env not configured' });

  const client = createClient({ baseUrl, anonKey: apiKey });

  const { action, playerId } = body;
  if (!nonEmptyString(playerId)) return json(400, { error: 'invalid playerId' });

  // ── record: insert a completed match row ─────────────────────────────────────
  if (action === 'record') {
    const { bet, outcome, crashPoint, cashoutMultiplier, delta } = body;

    if (typeof bet !== 'number' || !Number.isInteger(bet) || !BET_OPTIONS.has(bet)) {
      return json(400, { error: 'bet must be one of 50, 100, 250, 500' });
    }
    if (typeof outcome !== 'string' || !OUTCOMES.has(outcome)) {
      return json(400, { error: "outcome must be 'win', 'loss', or 'draw'" });
    }
    if (typeof crashPoint !== 'number' || crashPoint < 1) {
      return json(400, { error: 'crashPoint must be a number >= 1' });
    }
    if (cashoutMultiplier !== undefined && cashoutMultiplier !== null) {
      if (typeof cashoutMultiplier !== 'number' || cashoutMultiplier < 1) {
        return json(400, { error: 'cashoutMultiplier must be a number >= 1 or null' });
      }
    }
    // Server-authoritative delta — same economy rule as the `balance` function:
    // win = +bet, loss = -bet, draw = 0. Reject inconsistent payloads (F-01).
    const expectedDelta = outcome === 'win' ? bet : outcome === 'loss' ? -bet : 0;
    if (typeof delta !== 'number' || !Number.isInteger(delta) || delta !== expectedDelta) {
      return json(400, { error: `delta inconsistent with bet/outcome (expected ${expectedDelta})` });
    }

    const row: Record<string, unknown> = {
      player_id: playerId,
      bet,
      outcome,
      crash_point: Math.min(crashPoint, 9999.9999),
      delta,
      created_at: new Date().toISOString(),
    };
    if (cashoutMultiplier != null) {
      row.cashout_multiplier = Math.min(cashoutMultiplier, 9999.9999);
    }

    const { error } = await client.database.from('matches').insert(row);
    if (error) {
      return json(500, { error: 'failed to insert match' });
    }
    return json(201, { ok: true });
  }

  // ── list: recent matches + aggregate stats ────────────────────────────────────
  if (action === 'list') {
    const limitRaw = body.limit;
    const limit =
      typeof limitRaw === 'number' && Number.isInteger(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const { data: rows, error } = await client.database
      .from('matches')
      .select('id, bet, outcome, crash_point, cashout_multiplier, delta, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return json(500, { error: 'failed to fetch matches' });
    }

    const matches = Array.isArray(rows) ? rows : [];

    // Compute aggregate stats from ALL matches for this player (not just the
    // paged slice) using a separate aggregate query.
    const { data: aggRows, error: aggError } = await client.database
      .from('matches')
      .select('outcome, delta')
      .eq('player_id', playerId);

    let stats = {
      total: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      netDelta: 0,
      bestCashout: null as number | null,
    };

    if (!aggError && Array.isArray(aggRows) && aggRows.length > 0) {
      let wins = 0, losses = 0, draws = 0, netDelta = 0;
      for (const r of aggRows as { outcome: string; delta: number }[]) {
        if (r.outcome === 'win') wins++;
        else if (r.outcome === 'loss') losses++;
        else draws++;
        netDelta += Number(r.delta);
      }
      const total = aggRows.length;
      stats = { total, wins, losses, draws, winRate: wins / total, netDelta, bestCashout: null };
    }

    // Best cashout across ALL rows — single top-1 query.
    let bestCashout: number | null = null;
    {
      const { data: cashoutRows } = await client.database
        .from('matches')
        .select('cashout_multiplier')
        .eq('player_id', playerId)
        .not('cashout_multiplier', 'is', null)
        .order('cashout_multiplier', { ascending: false })
        .limit(1);
      if (Array.isArray(cashoutRows) && cashoutRows.length > 0) {
        bestCashout = (cashoutRows[0] as { cashout_multiplier: number }).cashout_multiplier;
      }
    }
    stats.bestCashout = bestCashout;

    return json(200, { matches, stats });
  }

  return json(400, { error: 'unknown action' });
}
