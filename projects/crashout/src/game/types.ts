// Core domain types for the CRASHOUT 1v1 duel.

/** A player or ghost's outcome for a single round. */
export interface Cashout {
  /** Multiplier the actor locked in, or null if they busted (never cashed in time). */
  multiplier: number | null;
}

/** A recorded opponent curve replayed as an async "ghost" opponent. */
export interface Ghost {
  id: string;
  name: string;
  /**
   * Multiplier this ghost intended to cash out at, or null = "rode it to the bust".
   * On replay against a round crash point C: ghost cashes at `intent` iff intent < C,
   * otherwise the crash beat them and they bust.
   */
  intent: number | null;
}

/** Provably-fair commitment + reveal for one round. */
export interface FairProof {
  serverSeedHash: string; // shown BEFORE the round (commitment)
  serverSeed: string; // revealed AFTER the round (verify)
  clientSeed: string;
  nonce: number;
  crashPoint: number; // derived, verifiable from the above
}

export type DuelPhase =
  | 'idle' // pre-round, lobby
  | 'running' // multiplier rising, player can cash out
  | 'crashed' // round resolved, result shown
  ;

export type RoundOutcome = 'win' | 'loss' | 'draw';

export interface RoundResult {
  outcome: RoundOutcome;
  player: Cashout;
  ghost: Cashout;
  ghostName: string;
  crashPoint: number;
  proof: FairProof;
}

// --- Ladder Duel (Hypothesis B) --------------------------------------------
// A match is a best-of-N ladder: each round both sides bank a cash-out (0 on a
// bust), and the cumulative score across the match decides the winner. The
// variance-protection rule (how round scores roll up into a match score) is THE
// pre-registered experiment variable — see ExperimentArm.

/** Rounds per match. Default 5 per the proposal; single dial for the 3-vs-5 test. */
export const ROUNDS_PER_MATCH = 5;

/**
 * Variance-protection arm — the make-or-break experiment variable. Both are
 * "protected" (a crash never wipes already-banked rounds); they differ only in
 * how the per-round scores roll up:
 *  - 'banked'      → match score = sum of all rounds (a bust simply banks 0).
 *  - 'drop-lowest' → match score = sum of the best (N-1) rounds (worst dropped).
 * Assigned 50/50 per player, persisted across days. The winner is whichever
 * maximizes post-(match)-loss rematch rate — decided by data, not by feel.
 */
export type ExperimentArm = 'banked' | 'drop-lowest';

/** A recorded opponent run: one intended cash-out per round, replayed live. */
export interface GhostRun {
  id: string;
  name: string;
  /** length === ROUNDS_PER_MATCH; each entry is an `intent` (see Ghost). */
  intents: (number | null)[];
}

/** One resolved round inside a match. Player and ghost share the same crash point. */
export interface RoundRecord {
  index: number; // 0-based round number within the match
  crashPoint: number;
  player: Cashout;
  ghost: Cashout;
  proof: FairProof;
}

/** Final outcome of a best-of-N match. */
export interface MatchResult {
  outcome: RoundOutcome; // win / loss / draw at the MATCH level
  arm: ExperimentArm;
  playerScore: number; // after the arm's roll-up rule
  ghostScore: number; // after the arm's roll-up rule
  ghostName: string;
  rounds: RoundRecord[];
}
