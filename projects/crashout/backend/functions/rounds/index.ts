// INSFORGE Edge Function: `rounds` — server-authoritative seed commit + reveal.
//
// WHY THIS EXISTS (Issue 3 — "provably fair" was a lie):
//   Before this, src/game/crashEngine.ts minted the serverSeed IN THE BROWSER.
//   The player had no proof the house didn't pick a bad crash — the "FAIR" chip
//   was a false claim. This function moves seed generation server-side and
//   commits to it: it returns only `serverSeedHash` + `crashPoint` at match
//   start (seed WITHHELD), and reveals `serverSeed` afterward so the player can
//   verify sha256(serverSeed) === serverSeedHash and that crashPoint was derived,
//   not chosen. That makes the fairness claim TRUE.
//
//   crashPoint IS returned at start (so the client animates the curve locally) —
//   per the CEO decision, fairness comes from precommit+reveal, NOT from hiding
//   crashPoint. Withholding crashPoint (the server-authoritative execution
//   engine) is deferred to the real-money cycle.
//
// SCOPE (honest): this prevents post-commit seed swapping. It does NOT prevent
//   pre-commit grinding (server could pick a favorable seed before responding).
//   True grind-proofing (committed hash chain + player-supplied clientSeed) is a
//   real-money upgrade. This is strictly stronger than browser-minted seeds.
//
// Deno runtime. Reserved env (auto-injected): INSFORGE_BASE_URL, API_KEY.
// The `rounds` table has RLS enabled with no anon policy, so server_seed is
// ONLY reachable through this function (privileged key), never via PostgREST.
import { createClient } from 'npm:@insforge/sdk';

// ── crash math — MUST stay identical to src/game/crashEngine.ts ─────────────
const INSTANT_BUST_DIVISOR = 33;
const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}
async function hmacSha256Hex(key: string, msg: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg)));
}
function crashPointFromHash(hash: string): number {
  const h = parseInt(hash.slice(0, 13), 16); // 52 bits
  if (h % INSTANT_BUST_DIVISOR === 0) return 1.0;
  const e = 2 ** 52;
  return Math.floor((100 * e - h) / (e - h)) / 100;
}
function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
// ── end crash math ──────────────────────────────────────────────────────────

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function nonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export default async function (request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json(405, { error: 'method not allowed' });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const env = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env;
  const baseUrl = env?.get('INSFORGE_BASE_URL');
  const apiKey = env?.get('API_KEY');
  if (!baseUrl || !apiKey) return json(500, { error: 'backend env not configured' });
  const client = createClient({ baseUrl, anonKey: apiKey });

  const action = body.action;
  const matchToken = body.matchToken;
  if (!nonEmpty(matchToken) || !UUID_RE.test(matchToken)) {
    return json(400, { error: 'invalid matchToken' });
  }

  // ── start: generate N committed rounds, return hash+crashPoint (seed hidden)
  if (action === 'start') {
    const { playerId, clientSeed } = body;
    if (!nonEmpty(playerId)) return json(400, { error: 'missing playerId' });
    if (!nonEmpty(clientSeed)) return json(400, { error: 'missing clientSeed' });
    const count = Math.min(Math.max(Number(body.count) | 0, 1), 10);

    const rows: Record<string, unknown>[] = [];
    const out: Record<string, unknown>[] = [];
    for (let nonce = 1; nonce <= count; nonce++) {
      const serverSeed = randomHex(32);
      const serverSeedHash = await sha256Hex(serverSeed);
      const roundHash = await hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}`);
      const crashPoint = crashPointFromHash(roundHash);
      const roundToken = crypto.randomUUID();
      rows.push({
        round_token: roundToken,
        match_token: matchToken,
        player_id: playerId,
        nonce,
        client_seed: clientSeed,
        server_seed: serverSeed, // stored, never returned at start
        server_seed_hash: serverSeedHash,
        crash_point: crashPoint,
      });
      out.push({ roundToken, serverSeedHash, crashPoint, nonce }); // seed WITHHELD
    }

    const { error } = await client.database.from('rounds').insert(rows);
    if (error) {
      console.error('rounds insert failed:', error);
      return json(502, { error: 'commit failed' });
    }
    return json(200, { rounds: out });
  }

  // ── reveal: hand back the seeds for a match so the client can verify
  if (action === 'reveal') {
    const { data, error } = await client.database
      .from('rounds')
      .select('round_token, server_seed, server_seed_hash, client_seed, nonce, crash_point')
      .eq('match_token', matchToken)
      .order('nonce', { ascending: true });
    if (error) {
      console.error('rounds reveal failed:', error);
      return json(502, { error: 'reveal failed' });
    }
    const rounds = (data ?? []).map((r: Record<string, unknown>) => ({
      roundToken: r.round_token,
      serverSeed: r.server_seed,
      serverSeedHash: r.server_seed_hash,
      clientSeed: r.client_seed,
      nonce: r.nonce,
      crashPoint: Number(r.crash_point),
    }));
    return json(200, { rounds });
  }

  return json(400, { error: 'unknown action' });
}
