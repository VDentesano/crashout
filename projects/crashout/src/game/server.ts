// Client side of the server-authoritative seed commit/reveal (`rounds` edge fn).
//
// At MATCH start we fetch all N rounds' commitments in ONE call — each carries
// `serverSeedHash` (the commitment) + `crashPoint` (so the curve still animates
// locally), but NOT `serverSeed`. After the match we reveal the seeds and verify.
// One round-trip per match keeps the between-round pace instant.
//
// When no backend is configured (local dev / offline) every call returns null
// and the game falls back to a locally-generated round — the FAIR chip then
// honestly reads "DEMO RNG" instead of claiming provably fair.

const EVENTS_URL = import.meta.env.VITE_INSFORGE_EVENTS_URL as string | undefined;
// The rounds endpoint shares the events function host: /events -> /rounds.
const ROUNDS_URL = EVENTS_URL ? EVENTS_URL.replace(/\/events\/?$/, '/rounds') : undefined;

/** True iff a real server commit endpoint is wired (drives the FAIR vs DEMO label). */
export const SERVER_FAIR = Boolean(ROUNDS_URL);

export interface CommitRound {
  roundToken: string;
  serverSeedHash: string;
  crashPoint: number;
  nonce: number;
}

export interface RevealRound {
  roundToken: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
}

/** Commit a match's rounds server-side. Returns null on any failure (→ local fallback). */
export async function commitMatch(
  matchToken: string,
  playerId: string,
  clientSeed: string,
  count: number,
): Promise<CommitRound[] | null> {
  if (!ROUNDS_URL) return null;
  try {
    const res = await fetch(ROUNDS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', matchToken, playerId, clientSeed, count }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rounds?: CommitRound[] };
    if (!Array.isArray(data.rounds) || data.rounds.length !== count) return null;
    return data.rounds;
  } catch {
    return null;
  }
}

/** Reveal a match's seeds for verification. Returns null on any failure. */
export async function revealMatch(matchToken: string): Promise<RevealRound[] | null> {
  if (!ROUNDS_URL) return null;
  try {
    const res = await fetch(ROUNDS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reveal', matchToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rounds?: RevealRound[] };
    return Array.isArray(data.rounds) ? data.rounds : null;
  } catch {
    return null;
  }
}
