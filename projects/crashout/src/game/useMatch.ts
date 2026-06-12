import { useCallback, useEffect, useRef, useState } from 'react';
import { generateRound, multiplierAt, timeToReach } from './crashEngine';
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
import { arm, logMatchResult, logRoundResult, track } from '../analytics/logger';

const CLIENT_SEED = 'crashout-v0';

export type MatchPhase = 'idle' | 'running' | 'roundEnd' | 'matchEnd';

interface MatchState {
  phase: MatchPhase;
  arm: ExperimentArm;
  roundIndex: number; // 0-based, current round in the match
  multiplier: number;
  ghostName: string;
  ghostLiveTarget: number | null; // ghost's intent this round (live tension), null once cashed/busted
  ghostCashed: number | null; // ghost cash-out this round
  playerCashed: number | null; // player cash-out this round
  playerLiveScore: number; // banked sum so far (raw, pre-arm)
  ghostLiveScore: number; // banked sum so far (raw, pre-arm)
  rounds: RoundRecord[]; // resolved rounds this match
  roundResult: RoundResult | null; // last resolved round (per-round badge)
  matchResult: MatchResult | null;
  proof: FairProof | null;
  nonce: number;
}

export function useMatch() {
  const [state, setState] = useState<MatchState>({
    phase: 'idle',
    arm,
    roundIndex: 0,
    multiplier: 1.0,
    ghostName: '',
    ghostLiveTarget: null,
    ghostCashed: null,
    playerCashed: null,
    playerLiveScore: 0,
    ghostLiveScore: 0,
    rounds: [],
    roundResult: null,
    matchResult: null,
    proof: null,
    nonce: 0,
  });

  const startTs = useRef(0);
  const proofRef = useRef<FairProof | null>(null);
  const runRef = useRef<GhostRun | null>(null);
  const roundIndexRef = useRef(0);
  const roundsRef = useRef<RoundRecord[]>([]);
  const playerCashedRef = useRef<number | null>(null);
  const ghostCashedRef = useRef<number | null>(null);
  const resolvedRef = useRef(false);
  const nonceRef = useRef(0);
  const phaseRef = useRef<MatchPhase>('idle');
  const matchResultRef = useRef<MatchResult | null>(null);

  // Mirror progression-relevant state into refs so `advance` can stay pure.
  useEffect(() => {
    phaseRef.current = state.phase;
    matchResultRef.current = state.matchResult;
  }, [state.phase, state.matchResult]);

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
      ghostCashed: ghostOut.multiplier,
      playerCashed: player.multiplier,
      playerLiveScore: s.playerLiveScore + roundScore(player),
      ghostLiveScore: s.ghostLiveScore + roundScore(ghostOut),
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
      const run = runRef.current!;
      const intent = run.intents[roundIndexRef.current];
      const elapsed = performance.now() - startTs.current;

      if (elapsed >= timeToReach(proof.crashPoint)) {
        resolveRound();
        return;
      }

      const m = multiplierAt(elapsed);

      // Ghost cashes out live the instant the rising multiplier passes its intent.
      if (
        ghostCashedRef.current === null &&
        intent !== null &&
        m >= intent &&
        intent < proof.crashPoint
      ) {
        ghostCashedRef.current = intent;
        setState((s) => ({ ...s, ghostCashed: intent, ghostLiveTarget: null }));
      }

      setState((s) => ({ ...s, multiplier: m }));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.phase, resolveRound]);

  const startRound = useCallback(async (index: number) => {
    const run = runRef.current!;

    const nextNonce = nonceRef.current + 1;
    nonceRef.current = nextNonce;
    const proof = await generateRound(CLIENT_SEED, nextNonce);

    proofRef.current = proof;
    roundIndexRef.current = index;
    playerCashedRef.current = null;
    ghostCashedRef.current = null;
    resolvedRef.current = false;
    startTs.current = performance.now();

    track('round_start', { nonce: nextNonce, matchRound: index + 1, ghost: run.name });

    setState((s) => ({
      ...s,
      phase: 'running',
      roundIndex: index,
      multiplier: 1.0,
      ghostName: run.name,
      ghostLiveTarget: run.intents[index],
      ghostCashed: null,
      playerCashed: null,
      roundResult: null,
      proof,
      nonce: nextNonce,
    }));
  }, []);

  const enterMatch = useCallback(() => {
    const run = pickGhostRun();
    runRef.current = run;
    roundsRef.current = [];
    setState((s) => ({
      ...s,
      ghostName: run.name,
      playerLiveScore: 0,
      ghostLiveScore: 0,
      rounds: [],
      roundResult: null,
      matchResult: null,
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
    setState((s) => ({ ...s, playerCashed: m }));
  }, [state.phase]);

  return { state, advance, cashOut };
}
