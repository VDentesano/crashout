// Pure mapping: a single client TrackedEvent (camelCase, as the game posts it)
// -> the PostgREST insert body for the `events` table (snake_case, array).
//
// THIS IS THE ONE SILENT-FAILURE SEAM of the whole ingest path. The browser
// posts ONE object; PostgREST wants an ARRAY of snake_case rows. A wrong or
// camelCase key here doesn't throw — PostgREST quietly drops the column (or
// 400s), and we'd only find out from missing gate data days later. So the row
// is built EXPLICITLY (no spread/pass-through) and pinned by eventRow.test.ts.
//
// No Deno/Node imports — importable by both the edge function and the node test.

// Must match logger.ts `EventName`. Duplicated deliberately: this is the trust
// boundary for untrusted public input, not a shared-types convenience.
export const EVENT_NAMES = [
  'visit',
  'session_start',
  'experiment_arm',
  'play_start',
  'round_start',
  'cashout',
  'play_cashout',
  'bust',
  'round_result',
  'match_result',
  'rematch',
] as const;

const ARMS = ['banked', 'drop-lowest'] as const;

/** A row exactly as the `events` migration defines it (snake_case columns). */
export interface EventRow {
  name: string;
  player_id: string;
  session_id: string;
  arm: string;
  ts: number;
  props: Record<string, unknown>;
}

export type BuildResult =
  | { ok: true; rows: [EventRow] } // PostgREST body is always an array
  | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/**
 * Validate one untrusted posted event and build its DB insert body. Returns the
 * single-element array PostgREST expects, or a specific rejection reason.
 */
export function buildEventRows(raw: unknown): BuildResult {
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

  // Explicit construction — every column named exactly once, here only.
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
