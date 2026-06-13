import { useCallback, useEffect, useRef, useState } from 'react';
import { generateRound, multiplierAt, timeToReach, verifyReveal } from './crashEngine';
import {
  decideMatch,
  decideOutcome,
  pickGhostRun,
  recordGhostRun,
  resolveGhost,
  roundScore,
  scoreMatch,
} from './ghosts';
import { ROUNDS_PER_MATCH } from './types';
import type {
  ExperimentArm,
  FairProof,
  GhostRun,
  MatchResult,
  RoundRecord,
  RoundResult,
} from './types';
import { arm, logMatchResult, logRoundResult, playerId, track } from '../analytics/logger';
import { commitMatch, revealMatch, SERVER_FAIR, type CommitRound } from './server';

const CLIENT_SEED = 'crashout-v0';

export type MatchPhase = 'idle' | 'running' | 'roundEnd' | 'matchEnd';
/** Where the round's crash came from — server-committed (verifiable) or local RNG. */
export type FairMode = 'server' | 'local';

interface MatchState {
  phase: MatchPhase;
  arm: ExperimentArm;
  roundIndex: number; // 0-based, current round in the match
  multiplier: number;
  ghostName: string;
  ghostCashed: number | null; // ghost cash-out this round — revealed only at round end
  playerCashed: number | null; // player cash-out this round
  rounds: RoundRecord[]; // resolved rounds this match
  roundResult: RoundResult | null; // last resolved round (per-round badge)
  matchResult: MatchResult | null;
  proof: FairProof | null;
  nonce: number;
  fairMode: FairMode; // drives the "PROVABLY FAIR" vs "DEMO RNG" label
  fairVerified: boolean | null; // null = not yet revealed; set after match end
}

type E2EState = Pick<MatchState, 'phase' | 'roundIndex' | 'multiplier' | 'ghostName' | 'rounds' | 'matchResult'>;

declare global {
  interface Window {
    __CRASHOUT_E2E__?: {
      version: 1;
      getState: () => E2EState;
      cashoutTargets: () => number[];
    };
  }
}

const E2E_ROUNDS: Array<{
  crashPoint: number;
  playerTarget: number;
  ghostIntent: number | null;
}> = [
  { crashPoint: 1.36, playerTarget: 1.08, ghostIntent: 1.16 },
  { crashPoint: 1.44, playerTarget: 1.22, ghostIntent: 1.12 },
  { crashPoint: 1.52, playerTarget: 1.18, ghostIntent: 1.3 },
  { crashPoint: 1.62, playerTarget: 1.4, ghostIntent: null },
  { crashPoint: 1.7, playerTarget: 1.36, ghostIntent: 1.26 },
];

function e2eProofForRound(index: number): FairProof {
  const round = E2E_ROUNDS[index];
  return {
    serverSeed: `e2e-seed-${index + 1}`,
    serverSeedHash: `e2e-hash-${index + 1}`,
    clientSeed: CLIENT_SEED,
    nonce: 90_000 + index,
    crashPoint: round.crashPoint,
  };
}

function e2eGhostRun(): GhostRun {
  return {
    id: 'e2e',
    name: 'e2e_ghost',
    intents: E2E_ROUNDS.map((round) => round.ghostIntent),
  };
}

function e2eHooksEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('crashoutE2E') === '1'
      || localStorage.getItem('crashout.e2e') === '1';
  } catch {
    return false;
  }
}

export function useMatch() {
  const [state, setState] = useState<MatchState>({
    phase: 'idle',
    arm,
    roundIndex: 0,
    multiplier: 1.0,
    ghostName: '',
    ghostCashed: null,
    playerCashed: null,
    rounds: [],
    roundResult: null,
    matchResult: null,
    proof: null,
    nonce: 0,
    fairMode: SERVER_FAIR ? 'server' : 'local',
    fairVerified: null,
  });

  const startTs = useRef(0);
  const proofRef = useRef<FairProof | null>(null);
  const runRef = useRef<GhostRun | null>(null);
  const roundIndexRef = useRef(0);
  const roundsRef = useRef<RoundRecord[]>([]);
  const playerCashedRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);
  const nonceRef = useRef(0);
  const phaseRef = useRef<MatchPhase>('idle');
  const matchResultRef = useRef<MatchResult | null>(null);
  const stateRef = useRef(state);
  // Server-committed rounds for the current match (null = local-RNG fallback).
  const commitsRef = useRef<CommitRound[] | null>(null);
  const matchTokenRef = useRef<string | null>(null);

  // Mirror progression-relevant state into refs so `advance` can stay pure.
  useEffect(() => {
    phaseRef.current = state.phase;
    matchResultRef.current = state.matchResult;
  }, [state.phase, state.matchResult]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    track('session_start');
    track('experiment_arm', { arm });
  }, []);

  const resolveMatch = useCallback(() => {
    const rounds = roundsRef.current;
    const playerScores = rounds.map((r) => roundScore(r.player));
    const ghostScores = rounds.map((r) => roundScore(r.ghost));
    const playerScore = scoreMatch(playerScores, arm);
    const ghostScore = scoreMatch(ghostScores, arm);
    const outcome = decideMatch(playerScore, ghostScore);

    const matchResult: MatchResult = {
      outcome,
      arm,
      playerScore,
      ghostScore,
      ghostName: runRef.current!.name,
      rounds,
    };

    // Grow the ghost pool from this real player's full run.
    recordGhostRun(rounds.map((r) => r.player.multiplier));
    logMatchResult(outcome, {
      arm,
      playerScore,
      ghostScore,
      rounds: rounds.length,
      ghostName: runRef.current!.name,
    });

    setState((s) => ({ ...s, phase: 'matchEnd', matchResult }));

    // Reveal the committed seeds and verify the round was provably fair. Runs
    // after the match resolves; non-blocking — purely populates the FAIR badge.
    const matchToken = matchTokenRef.current;
    if (commitsRef.current && matchToken) {
      revealMatch(matchToken).then(async (revealed) => {
        if (!revealed || revealed.length === 0) {
          setState((s) => ({ ...s, fairVerified: false }));
          return;
        }
        const checks = await Promise.all(revealed.map((r) => verifyReveal(r)));
        setState((s) => ({ ...s, fairVerified: checks.every(Boolean) }));
      });
    }
  }, []);

  const resolveRound = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const proof = proofRef.current!;
    const run = runRef.current!;
    const index = roundIndexRef.current;
    const intent = run.intents[index];

    const player = { multiplier: playerCashedRef.current };
    const ghostOut = resolveGhost({ intent }, proof.crashPoint);
    const roundOutcome = decideOutcome(player, ghostOut);

    const record: RoundRecord = {
      index,
      crashPoint: proof.crashPoint,
      player,
      ghost: ghostOut,
      proof,
    };
    roundsRef.current = [...roundsRef.current, record];

    logRoundResult(roundOutcome, {
      matchRound: index + 1,
      crashPoint: proof.crashPoint,
      playerMultiplier: player.multiplier,
      ghostMultiplier: ghostOut.multiplier,
      nonce: proof.nonce,
    });

    const roundResult: RoundResult = {
      outcome: roundOutcome,
      player,
      ghost: ghostOut,
      ghostName: run.name,
      crashPoint: proof.crashPoint,
      proof,
    };

    const isLast = index >= ROUNDS_PER_MATCH - 1;
    setState((s) => ({
      ...s,
      phase: isLast ? 'running' : 'roundEnd', // matchEnd is set by resolveMatch below
      multiplier: proof.crashPoint,
      ghostCashed: ghostOut.multiplier, // ghost's cash-out is revealed now, not live
      playerCashed: player.multiplier,
      rounds: roundsRef.current,
      roundResult,
    }));

    if (isLast) resolveMatch();
  }, [resolveMatch]);

  // Drive the live multiplier with requestAnimationFrame while a round is in the
  // air. Reads the current round from refs, so it always sees fresh state; the
  // effect restarts every time a new round flips `phase` back to 'running', and
  // its cleanup cancels the frame on round end / unmount.
  useEffect(() => {
    if (state.phase !== 'running') return;
    let frame = 0;
    const loop = () => {
      if (resolvedRef.current) return;
      const proof = proofRef.current!;
      const elapsed = performance.now() - startTs.current;

      if (elapsed >= timeToReach(proof.crashPoint)) {
        resolveRound();
        return;
      }

      // Render the rising multiplier only. The ghost's cash-out is NOT revealed
      // live — showing it turns the duel into arithmetic ("opponent is at 1.4x,
      // I just need 1.5x") and corrupts the bail-vs-greed signal we measure.
      // The ghost stays "riding…" until the round resolves (see App.tsx).
      setState((s) => ({ ...s, multiplier: multiplierAt(elapsed) }));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.phase, resolveRound]);

  const startRound = useCallback(async (index: number) => {
    const run = runRef.current!;
    const commits = commitsRef.current;

    let proof: FairProof;
    if (e2eHooksEnabled()) {
      proof = e2eProofForRound(index);
      nonceRef.current = proof.nonce;
    } else if (commits && commits[index]) {
      // Server-committed round: we have the hash (commitment) + crashPoint (to
      // animate the curve), but NOT the seed — it's revealed at match end.
      const c = commits[index];
      proof = {
        serverSeed: '', // withheld until reveal
        serverSeedHash: c.serverSeedHash,
        clientSeed: CLIENT_SEED,
        nonce: c.nonce,
        crashPoint: c.crashPoint,
      };
      nonceRef.current = c.nonce;
    } else {
      // Local fallback (no backend): generate a full round in the browser.
      const nextNonce = nonceRef.current + 1;
      nonceRef.current = nextNonce;
      proof = await generateRound(CLIENT_SEED, nextNonce);
    }

    proofRef.current = proof;
    roundIndexRef.current = index;
    playerCashedRef.current = null;
    resolvedRef.current = false;
    startTs.current = performance.now();

    track('round_start', { nonce: proof.nonce, matchRound: index + 1, ghost: run.name });

    setState((s) => ({
      ...s,
      phase: 'running',
      roundIndex: index,
      multiplier: 1.0,
      ghostName: run.name,
      ghostCashed: null,
      playerCashed: null,
      roundResult: null,
      proof,
      nonce: proof.nonce,
    }));
  }, []);

  const enterMatch = useCallback(async () => {
    const isE2E = e2eHooksEnabled();
    const run = isE2E ? e2eGhostRun() : pickGhostRun();
    runRef.current = run;
    roundsRef.current = [];

    // Commit all rounds server-side in one round-trip (provably fair). On any
    // failure we fall back to local RNG and the FAIR chip reads "DEMO RNG".
    const matchToken = crypto.randomUUID();
    matchTokenRef.current = matchToken;
    const commits = isE2E ? null : await commitMatch(matchToken, playerId, CLIENT_SEED, ROUNDS_PER_MATCH);
    commitsRef.current = commits;

    track('play_start', { matchToken });
    setState((s) => ({
      ...s,
      ghostName: run.name,
      rounds: [],
      roundResult: null,
      matchResult: null,
      fairMode: commits ? 'server' : 'local',
      fairVerified: null,
    }));
    startRound(0);
  }, [startRound]);

  /** Context-aware progression: start match / advance round / rematch. */
  const advance = useCallback(() => {
    const phase = phaseRef.current;
    if (phase === 'idle') {
      enterMatch();
    } else if (phase === 'roundEnd') {
      startRound(roundIndexRef.current + 1);
    } else if (phase === 'matchEnd') {
      // A rematch = a brand-new best-of-5, tagged with the MATCH outcome.
      track('rematch', { prevOutcome: matchResultRef.current?.outcome });
      enterMatch();
    }
  }, [enterMatch, startRound]);

  const cashOut = useCallback(() => {
    if (state.phase !== 'running' || playerCashedRef.current !== null) return;
    const proof = proofRef.current!;
    const elapsed = performance.now() - startTs.current;
    const m = multiplierAt(elapsed);
    if (m >= proof.crashPoint) return; // crash beat the click
    playerCashedRef.current = m;
    track('cashout', { multiplier: m, matchRound: roundIndexRef.current + 1, nonce: proof.nonce });
    track('play_cashout', { multiplier: m, matchRound: roundIndexRef.current + 1 });
    setState((s) => ({ ...s, playerCashed: m }));
  }, [state.phase]);

  useEffect(() => {
    if (!e2eHooksEnabled()) {
      delete window.__CRASHOUT_E2E__;
      return;
    }

    const getState = () => {
      const { phase, roundIndex, multiplier, ghostName, rounds, matchResult } = stateRef.current;
      return { phase, roundIndex, multiplier, ghostName, rounds, matchResult };
    };

    window.__CRASHOUT_E2E__ = {
      version: 1,
      getState,
      cashoutTargets: () => E2E_ROUNDS.map((round) => round.playerTarget),
    };

    return () => {
      delete window.__CRASHOUT_E2E__;
    };
  }, []);

  return { state, advance, cashOut };
}
