import { useEffect, useState } from 'react';
import './App.css';
import CurveCanvas from './components/CurveCanvas';
import Onboarding, { ONBOARD_KEY } from './components/Onboarding';
import { useCountUp } from './hooks/useCountUp';
import { useGameAudio } from './audio/useGameAudio';
import { useMatch } from './game/useMatch';
import { decideOutcome, roundScore, scoreMatch } from './game/ghosts';
import { ROUNDS_PER_MATCH } from './game/types';
import type { MatchResult, RoundRecord } from './game/types';
import { isBackendConnected, localGateReadout } from './analytics/logger';

function fmt(m: number | null): string {
  return m === null ? 'BUST' : `${m.toFixed(2)}×`;
}

type PipState = 'win' | 'loss' | 'draw' | 'current' | 'pending';

function pipState(i: number, rounds: RoundRecord[], running: boolean): PipState {
  if (i < rounds.length) return decideOutcome(rounds[i].player, rounds[i].ghost);
  if (i === rounds.length && running) return 'current';
  return 'pending';
}

export default function App() {
  const { state, advance, cashOut } = useMatch();
  const { muted, toggleMute } = useGameAudio(state);
  const { phase, multiplier, roundResult, matchResult, rounds } = state;
  const running = phase === 'running';
  const roundEnd = phase === 'roundEnd';
  // `matchResult` is briefly null while a rematch spins up the next match, even
  // though phase is still 'matchEnd' — gate the final-score view on both.
  const matchEnd = phase === 'matchEnd' && matchResult !== null;
  const playerCashedOut = state.playerCashed !== null;
  const roundNo = Math.min(rounds.length + (running ? 1 : 0), ROUNDS_PER_MATCH);

  // Arm-correct live scores. A raw sum LIES under the drop-lowest arm (it counts
  // the round that won't), so both sides roll up through scoreMatch — the exact
  // rule that decides the match. At match end the resolved scores are authoritative.
  const playerLive = matchEnd
    ? matchResult!.playerScore
    : scoreMatch(rounds.map((r) => roundScore(r.player)), state.arm);
  const ghostLive = matchEnd
    ? matchResult!.ghostScore
    : scoreMatch(rounds.map((r) => roundScore(r.ghost)), state.arm);
  const gap = playerLive - ghostLive;
  const leader = gap > 0.001 ? 'you' : gap < -0.001 ? 'ghost' : 'tied';
  const roundsLeft = ROUNDS_PER_MATCH - roundNo;
  const inMatch = phase !== 'idle';
  const scoringRule =
    state.arm === 'drop-lowest'
      ? 'Most points wins — your best 4 of 5 rounds count (worst dropped). A crash scores 0.'
      : 'Most points across 5 rounds wins. Each round banks your cash-out; a crash scores 0.';

  // A match win trumps everything visually — even if the player busted the final
  // round, taking the duel on points should read as celebration, not a crash.
  const matchWon = matchEnd && matchResult!.outcome === 'win';

  // When paused on a resolved round (roundEnd / matchEnd), paint the crash FX
  // only if the player busted that round — unless they just won the match.
  const lastBust = roundResult?.player.multiplier === null;
  const showCrashFx = (roundEnd || matchEnd) && lastBust && !matchWon;
  const crashed = (roundEnd || matchEnd) && lastBust;

  const [showGate, setShowGate] = useState(false);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(ONBOARD_KEY));

  const closeHelp = () => {
    localStorage.setItem(ONBOARD_KEY, '1');
    setShowHelp(false);
  };

  // Space / Enter — cash out while live, otherwise advance the ladder. While the
  // onboarding overlay is up it intercepts the key to dismiss itself, so the
  // first press enters the duel instead of acting on the board underneath.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (showHelp) closeHelp();
        else if (running && !playerCashedOut) cashOut();
        else if (!running) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHelp, running, playerCashedOut, advance, cashOut]);

  return (
    <div className={`app ${showCrashFx ? 'is-crashed' : ''} ${matchWon ? 'is-won' : ''}`}>
      {showCrashFx && <div className="redflash" key={state.nonce} />}
      {matchWon && <div className="voltflash" key={`win-${state.nonce}`} />}

      <header className="hud">
        <div className="brand">
          CRASH<span>OUT</span>
        </div>
        <div className="hud-right">
          {state.fairMode === 'server' ? (
            <span
              className="chip"
              title="Provably fair — the server commits the seed (hash shown) before the round and reveals it after, so you can verify the crash wasn't chosen."
            >
              <i className={`dot ${state.fairVerified === false ? 'crash' : 'volt'}`} />
              {state.fairVerified ? 'FAIR ✓' : 'PROVABLY FAIR'}
              <code>{state.proof ? state.proof.serverSeedHash.slice(0, 8) : '········'}</code>
            </span>
          ) : (
            <span className="chip warn" title="Local demo RNG — play money, not server-verified">
              <i className="dot" /> DEMO RNG
            </span>
          )}
          <span className={`chip ${isBackendConnected ? '' : 'warn'}`}>
            <i className={`dot ${isBackendConnected ? 'volt' : 'crash'}`} />
            {isBackendConnected ? 'LIVE' : 'LOCAL'}
          </span>
          <button
            className="ghosttoggle"
            onClick={toggleMute}
            title={muted ? 'Sound off — tap to unmute' : 'Sound on — tap to mute'}
            aria-pressed={muted}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="ghosttoggle" onClick={() => setShowHelp(true)} title="How to play">
            ?
          </button>
          <button className="ghosttoggle" onClick={() => setShowGate((v) => !v)} title="Local gate instrument">
            ∑
          </button>
        </div>
      </header>

      {/* Ladder rail — best-of-5 progress */}
      <div className="ladder">
        <span className="ladder-label">
          {phase === 'idle' ? 'BEST OF 5' : `ROUND ${roundNo}/${ROUNDS_PER_MATCH}`}
        </span>
        <div className="pips">
          {Array.from({ length: ROUNDS_PER_MATCH }, (_, i) => (
            <span key={i} className={`pip ${pipState(i, rounds, running)}`} />
          ))}
        </div>
        <div className="legend" aria-hidden>
          <span><i className="ldot win" />won</span>
          <span><i className="ldot loss" />lost</span>
          <span><i className="ldot draw" />drawn</span>
        </div>
      </div>

      {/* Match status — who's ahead, rounds left, and the rule in plain words */}
      <div className="matchinfo">
        {inMatch ? (
          <div className="standing">
            <span className={`lead ${leader}`}>
              {leader === 'you' ? 'YOU LEAD' : leader === 'ghost' ? 'GHOST LEADS' : 'TIED'}
            </span>
            {leader !== 'tied' && <span className="gap">+{Math.abs(gap).toFixed(2)}</span>}
            <span className="left">
              {roundsLeft <= 0 ? 'final round' : `${roundsLeft} ${roundsLeft === 1 ? 'round' : 'rounds'} left`}
            </span>
          </div>
        ) : (
          <div className="standing">
            <span className="lead tied">BEST OF 5</span>
            <span className="left">highest score wins</span>
          </div>
        )}
        <p className="rule">{scoringRule}</p>
      </div>

      <main className="arena">
        <div className="opponents">
          <ScorePanel
            who="GHOST"
            name={state.ghostName || 'matching…'}
            score={ghostLive}
            roundLine={
              matchEnd
                ? null
                : state.ghostCashed !== null
                  ? fmt(state.ghostCashed)
                  : running
                    ? 'riding…'
                    : '—'
            }
            kind={state.ghostCashed !== null ? 'cashed' : crashed ? 'bust' : 'idle'}
            align="left"
          />
          <ScorePanel
            who="YOU"
            name="you"
            score={playerLive}
            roundLine={
              matchEnd
                ? null
                : state.playerCashed !== null
                  ? fmt(state.playerCashed)
                  : running
                    ? 'in the air'
                    : '—'
            }
            kind={state.playerCashed !== null ? 'cashed' : crashed ? 'bust' : 'idle'}
            align="right"
            won={matchWon}
          />
        </div>

        <div className="stage">
          <CurveCanvas multiplier={multiplier} crashed={showCrashFx} />
          <div className={`ticker ${showCrashFx ? 'crash' : running ? 'live' : 'idle'}`}>
            {multiplier.toFixed(2)}
            <span className="x">×</span>
          </div>
          {(roundEnd || matchEnd) && roundResult && (
            <div className={`crashword ${lastBust ? '' : 'safe'}`}>
              {lastBust
                ? `CRASHED @ ${roundResult.crashPoint.toFixed(2)}×`
                : `CASHED ${fmt(roundResult.player.multiplier)}`}
            </div>
          )}
        </div>

        {matchEnd && matchResult ? (
          <MatchVerdict result={matchResult} />
        ) : roundEnd && roundResult ? (
          <div className={`verdict ${roundResult.outcome}`} key={state.nonce}>
            <span className="vmain">
              {roundResult.outcome === 'win'
                ? 'ROUND WON'
                : roundResult.outcome === 'loss'
                  ? 'ROUND LOST'
                  : 'ROUND DRAW'}
            </span>
            <span className="vsub">
              you {fmt(roundResult.player.multiplier)} · {roundResult.ghostName}{' '}
              {fmt(roundResult.ghost.multiplier)}
            </span>
          </div>
        ) : null}
      </main>

      <footer className="controls">
        {running ? (
          <button
            className={`primary cash ${playerCashedOut ? 'done' : ''}`}
            onClick={cashOut}
            disabled={playerCashedOut}
          >
            {playerCashedOut ? `LOCKED ${fmt(state.playerCashed)}` : `CASH OUT  ${multiplier.toFixed(2)}×`}
          </button>
        ) : roundEnd ? (
          <button className="primary next" onClick={advance}>
            NEXT ROUND ↑
          </button>
        ) : matchEnd ? (
          <button className="primary rematch" onClick={advance}>
            RUN IT BACK ↻
          </button>
        ) : (
          <button className="primary enter" onClick={advance}>
            ENTER DUEL
          </button>
        )}
        <p className="hint">
          {running
            ? 'space / tap — cash out before the crash. banked points are safe.'
            : matchEnd
              ? 'highest match score wins. a crash only zeroes that round.'
              : 'best-of-5 ladder · highest cumulative score takes the duel.'}
        </p>
        <p className="cryptosoon">
          Play money — <strong>on-chain crypto duels coming soon.</strong>
        </p>
      </footer>

      {showGate && <GatePanel />}
      {showHelp && <Onboarding onClose={closeHelp} />}
    </div>
  );
}

function ScorePanel({
  who,
  name,
  score,
  roundLine,
  kind,
  align,
  won = false,
}: {
  who: string;
  name: string;
  score: number;
  roundLine: string | null;
  kind: 'idle' | 'cashed' | 'bust';
  align: 'left' | 'right';
  won?: boolean;
}) {
  const shown = useCountUp(score);
  return (
    <div className={`panel ${align} ${kind} ${won ? 'won' : ''}`}>
      <span className="who">{who}</span>
      <span className="pname">{name}</span>
      <span className="score">
        {shown.toFixed(2)}
        <i>pts</i>
      </span>
      {roundLine && <span className="roundline">{roundLine}</span>}
    </div>
  );
}

function MatchVerdict({ result }: { result: MatchResult }) {
  const verdict =
    result.outcome === 'win' ? 'YOU WIN' : result.outcome === 'loss' ? 'YOU LOSE' : 'DRAW';
  const armNote = result.arm === 'drop-lowest' ? 'drop-lowest round' : 'banked points';
  return (
    <div className={`verdict match ${result.outcome}`} key="match">
      <div className="vcol">
        <span className="vmain">{verdict}</span>
        <span className="vsub">scoring: {armNote}</span>
      </div>
      <span className="vscore">
        {result.playerScore.toFixed(2)} <em>vs</em> {result.ghostScore.toFixed(2)}
      </span>
    </div>
  );
}

function GatePanel() {
  const g = localGateReadout();
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <div className="gate">
      <div className="gate-h">GATE · local instrument (this device only)</div>
      <Row k="experiment arm" v={g.arm} />
      <Row k="post-loss rematch rate" v={pct(g.postLossRematchRate)} ok={g.postLossRematchRate >= 0.35} />
      <Row k="matches / this session" v={String(g.matchesThisSession)} ok={g.matchesThisSession >= 3} />
      <Row k="engaged session (min)" v={g.engagedSessionMin.toFixed(1)} ok={g.engagedSessionMin >= 8} />
      <Row k="lost matches (denominator)" v={String(g.lossMatches)} />
      <Row k="rematches after loss" v={String(g.rematchesAfterLoss)} />
      <Row k="total matches" v={String(g.totalMatches)} />
      <p className="gate-note">
        Gate A2 = matches/session ≥3 OR session ≥8 min (substitutes). D1 retention &amp; ≥300-player
        aggregation need the backend — LOCAL only proves the loop runs.
      </p>
    </div>
  );
}

function Row({ k, v, ok }: { k: string; v: string; ok?: boolean }) {
  return (
    <div className="gate-row">
      <span>{k}</span>
      <b className={ok === undefined ? '' : ok ? 'pass' : 'fail'}>{v}</b>
    </div>
  );
}
