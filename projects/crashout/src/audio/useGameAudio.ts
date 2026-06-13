import { useEffect, useRef, useState } from 'react';
import { audio } from './engine';
import type { MatchResult, RoundResult } from '../game/types';

// Only the fields the audio layer reacts to — kept structural so it does not
// couple to useMatch's internal MatchState shape.
interface AudioState {
  phase: 'idle' | 'running' | 'roundEnd' | 'matchEnd';
  multiplier: number;
  playerCashed: number | null;
  matchResult: MatchResult | null;
  roundResult: RoundResult | null;
}

/**
 * Maps match-state transitions to sound and owns the mute toggle.
 *
 * Precedence mirrors the visual layer (App.tsx): a match win trumps a final-round
 * bust, so on matchEnd a win plays the fanfare — never the crash boom — even when
 * the player busted that last round.
 */
export function useGameAudio(state: AudioState) {
  const [muted, setMuted] = useState(audio.muted);
  const multRef = useRef(state.multiplier);
  const prevPhase = useRef(state.phase);
  const prevCashed = useRef(state.playerCashed);

  useEffect(() => {
    multRef.current = state.multiplier;
  }, [state.multiplier]);

  // Rising tick — runs only while a round is in the air. Cleared on leaving
  // 'running' and on unmount so no tick leaks past the round.
  useEffect(() => {
    if (state.phase === 'running') audio.startTicks(() => multRef.current);
    else audio.stopTicks();
    return () => audio.stopTicks();
  }, [state.phase]);

  // Cash-out chime. Stopping the tick here is the "locked in" relief beat — the
  // dread-building tick belongs to the still-exposed window before cashing.
  useEffect(() => {
    if (prevCashed.current === null && state.playerCashed !== null) {
      audio.cashout();
      audio.stopTicks();
    }
    prevCashed.current = state.playerCashed;
  }, [state.playerCashed]);

  // Round / match resolution sounds.
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = state.phase;
    const bust = state.roundResult?.player.multiplier === null;

    if (state.phase === 'matchEnd' && state.matchResult) {
      if (state.matchResult.outcome === 'win') audio.win(); // win trumps bust
      else if (bust) audio.crash();
      else audio.lose();
    } else if (state.phase === 'roundEnd' && prev === 'running' && bust) {
      audio.crash();
    }
  }, [state.phase, state.matchResult, state.roundResult]);

  const toggleMute = () => setMuted(audio.toggle());
  return { muted, toggleMute };
}
