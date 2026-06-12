import { useEffect, useState } from 'react';
import './App.css';
import CurveCanvas from './components/CurveCanvas';
import { useMatch } from './game/useMatch';
import { decideOutcome } from './game/ghosts';
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
  const { phase, multiplier, roundResult, matchResult, rounds } = state;
  const running = phase === 'running';
  const roundEnd = phase === 'roundEnd';
  // `matchResult` is briefly null while a rematch spins up the next match, even
  // though phase is still 'matchEnd' — gate the final-score view on both.
  const matchEnd = phase === 'matchEnd' && matchResult !== null;
  const playerCashedOut = state.playerCashed !== null;
  const roundNo = Math.min(rounds.length + (running ? 1 : 0), ROUNDS_PER_MATCH);

  // When paused on a resolved round (roundEnd / matchEnd), paint the crash FX
  // only if the player busted that round.
  const lastBust = roundResult?.player.multiplier === null;
  const showCrashFx = (roundEnd || matchEnd) && lastBust;
  const crashed = (roundEnd || matchEnd) && lastBust;

  const [showGate, setShowGate] = useState(false);

  // Space / Enter — cash out while live, otherwise advance the ladder.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (running && !playerCashedOut) cashOut();
        else if (!running) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, playerCashedOut, advance, cashOut]);

  return (
    <div className={`app ${showCrashFx ? 'is-crashed' : ''}`}>
      {showCrashFx && <div className="redflash" key={state.nonce} />}

      <header className="hud">
        <div className="brand">
          CRASH<span>OUT</span>
        </div>
        <div className="hud-right">
          <span className="chip" title="Provably fair — verify the seed after the round">
            <i className="dot volt" /> FAIR
            <code>{state.proof ? state.proof.serverSeedHash.slice(0, 8) : '········'}</code>
          </span>
          <span className={`chip ${isBackendConnected ? '' : 'warn'}`}>
            <i className={`dot ${isBackendConnected ? 'volt' : 'crash'}`} />
            {isBackendConnected ? 'LIVE' : 'LOCAL'}
          </span>
          <button className="ghosttoggle" onClick={() => setShowGate((v) => !v)}>
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
      </div>

      <main className="arena">
        <div className="opponents">
          <ScorePanel
            who="GHOST"
            name={state.ghostName || 'matching…'}
            score={matchEnd ? matchResult!.ghostScore : state.ghostLiveScore}
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
            score={matchEnd ? matchResult!.playerScore : state.playerLiveScore}
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
      </footer>

      {showGate && <GatePanel />}
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
}: {
  who: string;
  name: string;
  score: number;
  roundLine: string | null;
  kind: 'idle' | 'cashed' | 'bust';
  align: 'left' | 'right';
}) {
  return (
    <div className={`panel ${align} ${kind}`}>
      <span className="who">{who}</span>
      <span className="pname">{name}</span>
      <span className="score">
        {score.toFixed(2)}
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
