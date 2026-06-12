// DEPLOY ARTIFACT — `balance` edge function, self-contained for INSFORGE deploy.
//
// Manages persistent play-money balance for anonymous players. The client
// keeps an optimistic localStorage cache; this function is the server authority.
//
// Actions (POST JSON):
//   {action:'get',   playerId}                    → upsert if missing, return {balance}
//   {action:'apply', playerId, bet, outcome}       → validate, compute delta, persist, return {balance, delta}
//   {action:'rebuy', playerId}                     → allowed only if balance < 50; reset to 1000, return {balance}
//
// Runtime: Deno. Reserved env (auto-injected): INSFORGE_BASE_URL, API_KEY.
import { createClient } from 'npm:@insforge/sdk';

const BET_OPTIONS = new Set([50, 100, 250, 500]);
const MIN_BET = 50;
const REBUY_AMOUNT = 1000;
const DEFAULT_BALANCE = 1000;

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

async function getOrCreateBalance(
  client: ReturnType<typeof createClient>,
  playerId: string,
): Promise<number> {
  // Try to read existing row first.
  const { data, error } = await client.database
    .from('players')
    .select('balance')
    .eq('player_id', playerId)
    .limit(1);

  if (!error && Array.isArray(data) && data.length > 0) {
    return Number((data[0] as Record<string, unknown>).balance);
  }

  // Row missing — insert with default balance (ignore conflict from race).
  await client.database.from('players').upsert(
    { player_id: playerId, balance: DEFAULT_BALANCE, updated_at: new Date().toISOString() },
    { onConflict: 'player_id' },
  );
  return DEFAULT_BALANCE;
}

async function persistBalance(
  client: ReturnType<typeof createClient>,
  playerId: string,
  balance: number,
): Promise<void> {
  await client.database
    .from('players')
    .upsert(
      { player_id: playerId, balance, updated_at: new Date().toISOString() },
      { onConflict: 'player_id' },
    );
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

  // ── get: return current balance, creating the row if needed ─────────────────
  if (action === 'get') {
    const balance = await getOrCreateBalance(client, playerId);
    return json(200, { balance });
  }

  // ── apply: validate bet + outcome, compute delta, clamp, persist ─────────────
  if (action === 'apply') {
    const { bet, outcome } = body;
    const betNum = bet;
    if (typeof betNum !== 'number' || !Number.isInteger(betNum) || !BET_OPTIONS.has(betNum)) {
      return json(400, { error: 'bet must be one of 50, 100, 250, 500' });
    }
    if (outcome !== 'win' && outcome !== 'loss' && outcome !== 'draw') {
      return json(400, { error: "outcome must be 'win', 'loss', or 'draw'" });
    }

    const current = await getOrCreateBalance(client, playerId);
    const delta = outcome === 'win' ? betNum : outcome === 'loss' ? -betNum : 0;
    const balance = Math.max(0, current + delta);
    await persistBalance(client, playerId, balance);
    return json(200, { balance, delta });
  }

  // ── rebuy: only when broke (balance < min bet) ───────────────────────────────
  if (action === 'rebuy') {
    const current = await getOrCreateBalance(client, playerId);
    if (current >= MIN_BET) {
      return json(400, { error: 'rebuy not allowed: balance is sufficient' });
    }
    await persistBalance(client, playerId, REBUY_AMOUNT);
    return json(200, { balance: REBUY_AMOUNT });
  }

  return json(400, { error: 'unknown action' });
}
