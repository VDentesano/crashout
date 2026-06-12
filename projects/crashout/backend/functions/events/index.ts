// INSFORGE Edge Function: `events` — public, keyless event ingest.
//
// Why a function and not a direct PostgREST call from the browser:
//   1. The game posts to a public endpoint with NO auth header (logger.ts).
//   2. PostgREST insert needs a privileged key — kept server-side here, never
//      shipped to the client.
//   3. The browser posts ONE camelCase object; PostgREST needs a snake_case
//      ARRAY. buildEventRows() is the single, unit-tested mapping point.
//   4. Cross-origin (Pages -> insforge.dev) needs CORS; handled here.
//
// Deno runtime. Public URL once deployed: https://<project>.insforge.dev/functions/events
// Env (set as function secrets after login): INSFORGE_API_BASE_URL, INSFORGE_SERVICE_KEY
import { buildEventRows } from './eventRow.ts';

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

  const base = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get(
    'INSFORGE_API_BASE_URL',
  );
  const key = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno?.env.get(
    'INSFORGE_SERVICE_KEY',
  );
  if (!base || !key) return json(500, { error: 'backend env not configured' });

  const res = await fetch(`${base}/api/database/records/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(built.rows),
  });

  if (!res.ok) {
    // Never echo the upstream body to a public caller; log server-side only.
    console.error(`events insert failed: ${res.status} ${await res.text()}`);
    return json(502, { error: 'ingest failed' });
  }

  return json(202, { ok: true });
}
