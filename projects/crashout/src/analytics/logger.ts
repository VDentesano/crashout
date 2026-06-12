// Event logging — the instrument the entire experiment depends on.
//
// THE ATOMIC UNIT IS THE MATCH (a best-of-5 Ladder Duel), not a single round.
//
// THE GATE we must measure (pre-registered, re-baselined for the longer unit):
//   Gate A1: post-(match)-LOSS rematch rate ≥35%   ← the make-or-break metric
//   Gate A2: median duels/session ≥3 OR median engaged session ≥8 min (substitutes)
//   Gate B:  D1 retention ≥18%
//
// To measure those correctly we need, non-negotiably:
//   1. A STABLE anonymous playerId that survives across days   → D1 retention.
//   2. A per-visit sessionId                                   → duels/session.
//   3. A stable per-player experiment `arm` (banked|drop-lowest)→ which arm wins.
//   4. Every `rematch` event tagged with the MATCH outcome that preceded it.
//
// post-loss rematch rate = count(rematch where prevOutcome='loss')
//                          ----------------------------------------
//                          count(match_result where outcome='loss')
//
// A `rematch` fires ONLY at match end (a fresh best-of-5). Advancing round 1→2
// inside a match is NOT a rematch. Every finished match shows a rematch button,
// so every lost match is a genuine opportunity; not clicking (incl. tab close)
// is a real non-rematch.
//
// Transport: events are enriched, buffered to localStorage, and (if an endpoint is
// configured) POSTed to the backend. WITHOUT a backend, localStorage is per-device
// and cannot aggregate across players — i.e. it proves the game runs, NOT the gate.
// The backend (INSFORGE) is on the critical path to actually RUNNING the experiment.

import type { ExperimentArm, RoundOutcome } from '../game/types';

const PLAYER_KEY = 'crashout.playerId';
const FIRST_SEEN_KEY = 'crashout.firstSeen';
const ARM_KEY = 'crashout.arm';
const BUFFER_KEY = 'crashout.events.buffer';

// Configured at build time; absent until a human completes INSFORGE OAuth + deploy.
const EVENTS_URL = import.meta.env.VITE_INSFORGE_EVENTS_URL as string | undefined;

export type EventName =
  | 'visit'
  | 'session_start'
  | 'experiment_arm'
  | 'play_start'
  | 'round_start'
  | 'cashout'
  | 'play_cashout'
  | 'bust'
  | 'round_result'
  | 'match_result'
  | 'rematch';

export interface TrackedEvent {
  name: EventName;
  playerId: string;
  sessionId: string;
  arm: ExperimentArm; // every event carries the arm so the backend can slice cleanly
  ts: number;
  props: Record<string, unknown>;
}

function uuid(): string {
  return crypto.randomUUID();
}

function getPlayerId(): string {
  let id = localStorage.getItem(PLAYER_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(PLAYER_KEY, id);
    localStorage.setItem(FIRST_SEEN_KEY, String(Date.now()));
  }
  return id;
}

/**
 * Assign a 50/50 experiment arm, persisted so a returning player keeps the same
 * arm across days (otherwise D1 retention can't be attributed to an arm). Uses a
 * CSPRNG bit rather than Math.random for an unbiased split.
 */
function getArm(): ExperimentArm {
  const existing = localStorage.getItem(ARM_KEY);
  if (existing === 'banked' || existing === 'drop-lowest') return existing;
  const arm: ExperimentArm =
    crypto.getRandomValues(new Uint8Array(1))[0] < 128 ? 'banked' : 'drop-lowest';
  localStorage.setItem(ARM_KEY, arm);
  return arm;
}

// One session per page load.
const sessionId = uuid();
const playerId = getPlayerId();
const arm = getArm();

function readBuffer(): TrackedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(BUFFER_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeBuffer(events: TrackedEvent[]): void {
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(events.slice(-2000)));
  } catch {
    /* storage full — drop silently rather than crash the game */
  }
}

export function track(name: EventName, props: Record<string, unknown> = {}): void {
  const ev: TrackedEvent = { name, playerId, sessionId, arm, ts: Date.now(), props };

  const buffer = readBuffer();
  buffer.push(ev);
  writeBuffer(buffer);

  if (EVENTS_URL) {
    // Fire-and-forget; never block or break the game on a logging failure.
    fetch(EVENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
      keepalive: true,
    }).catch(() => {
      /* offline / backend down — event is still safe in the local buffer */
    });
  }
}

export const isBackendConnected = Boolean(EVENTS_URL);

// --- Local gate read-out -------------------------------------------------
// Single-device only (no cross-player aggregation) — for QA + a live debug
// overlay so we can sanity-check the instrumentation is wired correctly.
// All counts are at the MATCH level (the atomic unit).

export interface GateReadout {
  arm: ExperimentArm;
  sessions: number;
  totalMatches: number;
  rematches: number;
  lossMatches: number;
  rematchesAfterLoss: number;
  postLossRematchRate: number; // 0..1
  matchesThisSession: number;
  engagedSessionMin: number; // this session's span, minutes
}

export function localGateReadout(): GateReadout {
  const events = readBuffer();
  const sessions = new Set(events.map((e) => e.sessionId)).size;
  const matches = events.filter((e) => e.name === 'match_result');
  const rematchEvents = events.filter((e) => e.name === 'rematch');
  const lossMatches = matches.filter((e) => e.props.outcome === 'loss').length;
  const rematchesAfterLoss = rematchEvents.filter((e) => e.props.prevOutcome === 'loss').length;

  const sessionEvents = events.filter((e) => e.sessionId === sessionId);
  const span =
    sessionEvents.length > 1
      ? sessionEvents[sessionEvents.length - 1].ts - sessionEvents[0].ts
      : 0;

  return {
    arm,
    sessions,
    totalMatches: matches.length,
    rematches: rematchEvents.length,
    lossMatches,
    rematchesAfterLoss,
    postLossRematchRate: lossMatches === 0 ? 0 : rematchesAfterLoss / lossMatches,
    matchesThisSession: matches.filter((e) => e.sessionId === sessionId).length,
    engagedSessionMin: span / 60000,
  };
}

export function logRoundResult(outcome: RoundOutcome, props: Record<string, unknown>): void {
  track('round_result', { outcome, ...props });
}

export function logMatchResult(outcome: RoundOutcome, props: Record<string, unknown>): void {
  track('match_result', { outcome, ...props });
}

/**
 * Fire once per page load. Captures referrer and utm_source for funnel attribution.
 * Safe to call multiple times — only sends on the first call per session (guarded
 * by the sessionId which is unique per page load).
 */
let visitFired = false;
export function trackVisit(): void {
  if (visitFired) return;
  visitFired = true;
  const params = new URLSearchParams(location.search);
  track('visit', {
    referrer: document.referrer || null,
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
  });
}

export { playerId, sessionId, arm };
