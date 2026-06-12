// DEPLOY ARTIFACT — `events` edge function, self-contained for INSFORGE deploy.
//
// INSFORGE deploys ONE file per function (no relative-import bundling), so the
// validated mapping seam from ./eventRow.ts is INLINED here verbatim. Source of
// truth + unit test stay in eventRow.ts / eventRow.test.ts; if that logic
// changes, regenerate this block. The two must not drift (README documents this).
//
// Runtime: Deno. Public URL: https://<app>.<region>.insforge.app/functions/events
// Reserved env (auto-injected): INSFORGE_BASE_URL, API_KEY (privileged, bypasses RLS).
import { createClient } from 'npm:@insforge/sdk';

// ── inlined from eventRow.ts ────────────────────────────────────────────────
const EVENT_NAMES = [
  'session_start',
  'experiment_arm',
  'round_start',
  'cashout',
  'bust',
  'round_result',
  'match_result',
  'rematch',
] as const;
const ARMS = ['banked', 'drop-lowest'] as const;

interface EventRow {
  name: string;
  player_id: string;
  session_id: string;
  arm: string;
  ts: number;
  props: Record<string, unknown>;
}
type BuildResult = { ok: true; rows: [EventRow] } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}
function buildEventRows(raw: unknown): BuildResult {
  if (!isObject(raw)) return { ok: false, error: 'body must be a JSON object' };
  if (!nonEmptyString(raw.name) || !(EVENT_NAMES as readonly string[]).includes(raw.name)) {
    return { ok: false, error: 'invalid event name' };
  }
  if (!nonEmptyString(raw.playerId)) return { ok: false, error: 'missing playerId' };
  if (!nonEmptyString(raw.sessionId)) return { ok: false, error: 'missing sessionId' };
  if (!nonEmptyString(raw.arm) || !(ARMS as readonly string[]).includes(raw.arm)) {
    return { ok: false, error: 'invalid arm' };
  }
  if (typeof raw.ts !== 'number' || !Number.isFinite(raw.ts)) {
    return { ok: false, error: 'invalid ts' };
  }
  const props = raw.props === undefined ? {} : raw.props;
  if (!isObject(props)) return { ok: false, error: 'props must be an object' };
  const row: EventRow = {
    name: raw.name,
    player_id: raw.playerId,
    session_id: raw.sessionId,
    arm: raw.arm,
    ts: raw.ts,
    props,
  };
  return { ok: true, rows: [row] };
}
// ── end inlined seam ────────────────────────────────────────────────────────

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

export default async function (request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json(405, { error: 'method not allowed' });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { error: 'invalid JSON' });
  }

  const built = buildEventRows(raw);
  if (!built.ok) return json(400, { error: built.error });

  const env = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env;
  const baseUrl = env?.get('INSFORGE_BASE_URL');
  const apiKey = env?.get('API_KEY');
  if (!baseUrl || !apiKey) return json(500, { error: 'backend env not configured' });

  const client = createClient({ baseUrl, anonKey: apiKey });
  const { error } = await client.database.from('events').insert(built.rows);

  if (error) {
    // Never echo upstream detail to a public caller; log server-side only.
    console.error('events insert failed:', error);
    return json(502, { error: 'ingest failed' });
  }
  return json(202, { ok: true });
}
