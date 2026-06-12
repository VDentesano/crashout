// Ghost (async opponent) pool + scoring for the Ladder Duel.
//
// MANDATORY per spec: the opponent is always an async ghost, never live
// matchmaking — so the lobby is never empty and we test the LOOP, not liquidity.
// A ghost RUN is a recorded sequence of intended cash-outs (one per round). We
// replay it against each round's crash point. Real players' completed runs are
// appended to grow the pool over time.

import type { Cashout, ExperimentArm, Ghost, GhostRun, RoundOutcome } from './types';
import { ROUNDS_PER_MATCH } from './types.ts';

/**
 * Starter runs, hand-tuned to feel like coherent human risk appetites across a
 * full 5-round match. `null` = "rode it to the crash" (no cash-out that round).
 */
const STARTER_RUNS: GhostRun[] = [
  { id: 's1', name: 'tinyHands', intents: [1.18, 1.22, 1.15, 1.3, 1.2] }, // paper-hands, low & steady
  { id: 's2', name: 'apex_77', intents: [2.41, 1.8, 2.9, null, 2.1] }, // greedy, eats a bust
  { id: 's3', name: 'vega', intents: [1.91, 1.6, 2.05, 1.74, 1.88] }, // balanced
  { id: 's4', name: 'degenKing', intents: [3.6, null, 4.2, 2.8, null] }, // swings for the fences
  { id: 's5', name: 'coldStart', intents: [1.32, 1.55, 1.27, 1.62, 1.41] }, // cautious
  { id: 's6', name: 'sigma_x', intents: [2.05, 2.3, 1.9, 2.6, 2.15] }, // confident mid-roller
  { id: 's7', name: 'flashCrash', intents: [1.74, 2.88, 1.5, null, 3.1] }, // erratic
  { id: 's8', name: 'moonOrBust', intents: [null, 2.5, null, 3.4, 1.9] }, // all-or-nothing
];

const RUN_POOL_KEY = 'crashout.ghostruns.v1';

function loadRuns(): GhostRun[] {
  try {
    const raw = localStorage.getItem(RUN_POOL_KEY);
    const recorded: GhostRun[] = raw ? JSON.parse(raw) : [];
    // Only trust recorded runs of the correct length (guards against schema drift).
    const valid = recorded.filter((r) => Array.isArray(r.intents) && r.intents.length === ROUNDS_PER_MATCH);
    return [...STARTER_RUNS, ...valid];
  } catch {
    return STARTER_RUNS;
  }
}

/** Pick one full ghost run to face for a match. */
export function pickGhostRun(): GhostRun {
  const pool = loadRuns();
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Record a real player's completed 5-round run as a future ghost. */
export function recordGhostRun(intents: (number | null)[]): void {
  if (intents.length !== ROUNDS_PER_MATCH) return;
  try {
    const raw = localStorage.getItem(RUN_POOL_KEY);
    const recorded: GhostRun[] = raw ? JSON.parse(raw) : [];
    recorded.push({ id: `r${recorded.length + 1}`, name: randomHandle(), intents });
    // Cap so the pool doesn't grow unbounded on one device.
    localStorage.setItem(RUN_POOL_KEY, JSON.stringify(recorded.slice(-200)));
  } catch {
    /* non-fatal: ghosts just won't persist */
  }
}

/** Replay one intent against a round crash point. Cashes iff intent < crash. */
export function resolveGhost(ghost: Pick<Ghost, 'intent'>, crashPoint: number): Cashout {
  if (ghost.intent !== null && ghost.intent < crashPoint) {
    return { multiplier: ghost.intent };
  }
  return { multiplier: null }; // crash beat them
}

/** Points banked for one round: the cash-out multiplier, or 0 on a bust. */
export function roundScore(c: Cashout): number {
  return c.multiplier ?? 0;
}

/**
 * Roll per-round scores up into a match score under the given arm. MUST be
 * applied SYMMETRICALLY to player and ghost — scoring the two sides by
 * different rules would bias the win rate and corrupt the gate's denominator.
 *  - 'banked'      → sum of every round (a bust banks 0).
 *  - 'drop-lowest' → sum of the best (N-1) rounds (single worst round dropped).
 */
export function scoreMatch(roundScores: number[], arm: ExperimentArm): number {
  if (arm === 'drop-lowest' && roundScores.length > 1) {
    const sorted = [...roundScores].sort((a, b) => a - b);
    return sorted.slice(1).reduce((s, v) => s + v, 0);
  }
  return roundScores.reduce((s, v) => s + v, 0);
}

/** Decide a match by cumulative score. Equal totals → draw. */
export function decideMatch(playerScore: number, ghostScore: number): RoundOutcome {
  if (playerScore > ghostScore) return 'win';
  if (playerScore < ghostScore) return 'loss';
  return 'draw';
}

/**
 * Decide a single round. Highest VALID cash-out wins. A bust never beats a
 * cash-out. Both bust → draw. Equal valid multipliers → draw. (Kept for the
 * per-round badge + logic tests; the MATCH winner is decided by decideMatch.)
 */
export function decideOutcome(player: Cashout, ghost: Cashout): RoundOutcome {
  const p = player.multiplier;
  const g = ghost.multiplier;
  if (p === null && g === null) return 'draw';
  if (p === null) return 'loss';
  if (g === null) return 'win';
  if (p > g) return 'win';
  if (p < g) return 'loss';
  return 'draw';
}

const HANDLES = [
  'ghost', 'echo', 'phantom', 'replay', 'shade', 'mirror', 'wraith', 'specter',
];
function randomHandle(): string {
  const base = HANDLES[Math.floor(Math.random() * HANDLES.length)];
  return `${base}_${Math.floor(Math.random() * 900 + 100)}`;
}
