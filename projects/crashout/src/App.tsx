import { useCallback, useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import './App.css';
import CurveCanvas from './components/CurveCanvas';
import Onboarding, { ONBOARD_KEY } from './components/Onboarding';
import { useCountUp } from './hooks/useCountUp';
import { useTickPop } from './hooks/useTickPop';
import { useSidebarReveal } from './hooks/useSidebarReveal';
import { useCrashShake, useCashShower, useWinCelebration } from './hooks/useImpactFx';
import { useHeatRamp } from './hooks/useHeatRamp';
import { useGameAudio } from './audio/useGameAudio';
import { useMatch } from './game/useMatch';
import { decideOutcome, roundScore, scoreMatch } from './game/ghosts';
import { ROUNDS_PER_MATCH } from './game/types';
import type { MatchResult, RoundRecord } from './game/types';
import { isBackendConnected, localGateReadout } from './analytics/logger';
import {
  applyMatchResult,
  BET_OPTIONS,
  type BetOption,
  fetchAndReconcileBalance,
  getBalance,
  MIN_BET,
  rebuy,
} from './game/economy';
import { fetchHistory, recordMatch } from './game/history';
import type { MatchStats } from './game/history';
import HistoryPanel from './components/HistoryPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import ShareChallenge from './components/ShareChallenge';
import ChallengeBanner from './components/ChallengeBanner';

function fmt(m: number | null): string {
  return m === null ? 'BUST' : `${m.toFixed(2)}×`;
}

const COIN_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

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

  // Economy — play-money balance and bet selection.
  const [balance, setBalance] = useState(getBalance);
  const [bet, setBet] = useState<BetOption>(100);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState<MatchStats | null>(null);
  const betRef = useRef(bet);
  const economyApplied = useRef(false);
  useEffect(() => { betRef.current = bet; }, [bet]);
  // On mount: reconcile balance with server (server wins; localStorage is optimistic cache).
  useEffect(() => {
    fetchAndReconcileBalance(setBalance);
    fetchHistory(1).then((history) => setPlayerStats(history?.stats ?? null));
  }, []);
  useEffect(() => {
    if (phase === 'matchEnd' && matchResult && !economyApplied.current) {
      economyApplied.current = true;
      const { balance: newBal, delta } = applyMatchResult(betRef.current, matchResult.outcome, setBalance);
      setBalance(newBal);
      setLastDelta(delta);
      // Record match history — fire-and-forget, silent on failure.
      const lastRound = matchResult.rounds[matchResult.rounds.length - 1];
      if (lastRound) {
        recordMatch({
          bet: betRef.current,
          outcome: matchResult.outcome,
          crashPoint: lastRound.crashPoint,
          cashoutMultiplier: lastRound.player.multiplier,
          delta,
        });
        window.setTimeout(() => {
          fetchHistory(1).then((history) => setPlayerStats(history?.stats ?? null));
        }, 350);
      }
    }
    if (phase === 'idle') {
      economyApplied.current = false;
      setLastDelta(null);
    }
  }, [phase, matchResult]);
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

  // GSAP tick-pop on the live ticker — chrome-only wrapper transform, never the
  // value. See useTickPop for the cadence/reduced-motion contract.
  const tickerRef = useTickPop(multiplier, running);

  // FX-2 — continuous heat ramp: volt→gold→amber mapped frame-by-frame from the
  // live multiplier value (replaces stepped .warm/.hot CSS classes). Inline styles
  // are cleared on inactive so .idle/.crash CSS own the color again.
  useHeatRamp(tickerRef, multiplier, running);

  // Desktop telemetry reveal — staggers the aside rows in on mount (>=1024px,
  // no-reduced-motion). No-op on mobile where the aside is a regular block.
  const railRef = useSidebarReveal();

  // Impact FX — GSAP "feel" beats at the two emotional peaks: crash trauma (frame
  // shake) and match win (panel pop + particle shower), plus a cash-out burst.
  // Each fires once on its rising edge; all no-op under reduced-motion. See
  // useImpactFx for the chrome-only / reduced-motion contract.
  const appRef = useCrashShake(showCrashFx);
  const stageRef = useCashShower(running && playerCashedOut);
  const wonPanelRef = useWinCelebration(matchWon);

  const [showGate, setShowGate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(ONBOARD_KEY));
  const [showHistory, setShowHistory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Challenge banner — read `?c=` param once on mount.
  const [challengeMx] = useState<string | null>(() => {
    const p = new URLSearchParams(location.search).get('c');
    // Validate: must be a number between 1.00 and 1000.
    if (!p) return null;
    const n = parseFloat(p);
    return n >= 1 && n <= 1000 ? n.toFixed(2) : null;
  });
  const [showChallenge, setShowChallenge] = useState(true);
  const blockingOverlayOpen = showMenu || showHistory || showLeaderboard;
  const affordableBet = [...BET_OPTIONS].reverse().find((option) => balance >= option) ?? MIN_BET;
  const activeBet = balance >= bet ? bet : affordableBet;
  const roundOutcomes = rounds.map((round) => decideOutcome(round.player, round.ghost));
  const winStreak = [...roundOutcomes].reverse().findIndex((outcome) => outcome !== 'win');
  const currentStreak = winStreak === -1 ? roundOutcomes.length : winStreak;
  const bestCashout = rounds.reduce((best, round) => {
    const mx = round.player.multiplier;
    return mx === null ? best : Math.max(best, mx);
  }, state.playerCashed ?? 0);
  const displayBest = playerStats?.bestCashout ?? bestCashout;
  const displayNet = playerStats?.netDelta ?? lastDelta;
  const displayWinRate = playerStats ? `${Math.round(playerStats.winRate * 100)}%` : '—';

  const closeHelp = () => {
    localStorage.setItem(ONBOARD_KEY, '1');
    setShowHelp(false);
  };
  const openGame = () => {
    setShowHistory(false);
    setShowLeaderboard(false);
    setShowMenu(false);
  };
  const openHistory = () => {
    setShowHistory(true);
    setShowLeaderboard(false);
    setShowMenu(false);
  };
  const openLeaderboard = () => {
    setShowLeaderboard(true);
    setShowHistory(false);
    setShowMenu(false);
  };
  const openSettings = () => {
    setShowMenu((v) => !v);
    setShowHistory(false);
    setShowLeaderboard(false);
  };

  const enterDuel = useCallback(() => {
    if (balance < activeBet) return;
    betRef.current = activeBet;
    setBet(activeBet);
    advance();
  }, [activeBet, advance, balance]);

  // Space / Enter — cash out while live, otherwise advance the ladder. While the
  // onboarding overlay is up it intercepts the key to dismiss itself, so the
  // first press enters the duel instead of acting on the board underneath.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showHelp || blockingOverlayOpen) {
          e.preventDefault();
          setShowHelp(false);
          setShowMenu(false);
          setShowHistory(false);
          setShowLeaderboard(false);
        }
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (showHelp) closeHelp();
        else if (blockingOverlayOpen) return;
        else if (running && !playerCashedOut) cashOut();
        else if (phase === 'idle') enterDuel();
        else if (!running) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHelp, blockingOverlayOpen, running, playerCashedOut, phase, advance, cashOut, enterDuel]);

  return (
    <div className="app" ref={appRef}>
      {showCrashFx && <div className="redflash" key={state.nonce} />}
      {matchWon && <div className="voltflash" key={`win-${state.nonce}`} />}
      {challengeMx && showChallenge && (
        <ChallengeBanner multiplier={challengeMx} onDismiss={() => setShowChallenge(false)} />
      )}

      <header className="hud app-header">
        <div className="brand" translate="no">
          CRASH<span>OUT</span>
        </div>
        <div className="hud-right">
          {state.fairMode === 'server' ? (
            <span
              className="chip"
              title="Provably fair — the server commits the seed (hash shown) before the round and reveals it after, so you can verify the crash wasn't chosen."
            >
              <i aria-hidden="true" className={`dot ${state.fairVerified === false ? 'crash' : 'volt'}`} />
              {state.fairVerified === false ? 'FAIR?' : 'FAIR'}
            </span>
          ) : (
            <span className="chip warn" title="Local demo RNG — play money, not server-verified">
              <i aria-hidden="true" className="dot" /> DEMO
            </span>
          )}
          <span className={`chip ${isBackendConnected ? '' : 'warn'}`}>
            <i aria-hidden="true" className={`dot ${isBackendConnected ? 'volt' : 'crash'}`} />
            {isBackendConnected ? 'LIVE' : 'LOCAL'}
          </span>
          <span className="chip chip-gold economy-chip" title="Balance, current bet, and current round win streak">
            <i aria-hidden="true" className="dot dot-gold" />
            {COIN_FORMAT.format(balance)} <em>Bet {activeBet}</em> <em>Streak {currentStreak}</em>
          </span>
        </div>
      </header>

      <nav className="nav-island" aria-label="Game sections">
        <button
          className={`nav-item ${!showHistory && !showLeaderboard && !showMenu ? 'active' : ''}`}
          onClick={openGame}
          aria-label="Game"
        >
          <span aria-hidden="true" className="nav-icon">🎮</span>
          <span className="nav-text">Game</span>
        </button>
        <button
          className={`nav-item ${showLeaderboard ? 'active' : ''}`}
          onClick={openLeaderboard}
          aria-label="Leaderboard"
        >
          <span aria-hidden="true" className="nav-icon">🏆</span>
          <span className="nav-text">Leaderboard</span>
        </button>
        <button className={`nav-item ${showHistory ? 'active' : ''}`} onClick={openHistory} aria-label="Match history">
          <span aria-hidden="true" className="nav-icon">📋</span>
          <span className="nav-text">History</span>
        </button>
        <button
          className={`nav-item ${showMenu ? 'active' : ''}`}
          onClick={openSettings}
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={showMenu}
        >
          <span aria-hidden="true" className="nav-icon">⚙</span>
          <span className="nav-text">Settings</span>
        </button>
      </nav>

      {showMenu && (
        <>
          <button
            className="sheet-backdrop"
            aria-label="Close settings"
            onClick={() => setShowMenu(false)}
          />
          <div className="sheet settings-sheet" role="menu">
            <button className="sheet-row" onClick={toggleMute} role="menuitemcheckbox" aria-checked={!muted}>
              <span aria-hidden="true" className="sheet-ico">{muted ? '🔇' : '🔊'}</span>
              Sound <b>{muted ? 'Off' : 'On'}</b>
            </button>
            <button className="sheet-row" onClick={openHistory} role="menuitem">
              <span aria-hidden="true" className="sheet-ico">📋</span>
              Match History
            </button>
            <button className="sheet-row" onClick={openLeaderboard} role="menuitem">
              <span aria-hidden="true" className="sheet-ico">🏆</span>
              Leaderboard
            </button>
            <button
              className="sheet-row"
              onClick={() => {
                setShowHelp(true);
                setShowMenu(false);
              }}
              role="menuitem"
            >
              <span aria-hidden="true" className="sheet-ico">?</span>
              How To Play
            </button>
            {import.meta.env.DEV && (
              <button
                className="sheet-row"
                onClick={() => {
                  setShowGate((v) => !v);
                  setShowMenu(false);
                }}
                role="menuitem"
              >
                <span aria-hidden="true" className="sheet-ico">∑</span>
                Gate Instrument
              </button>
            )}
          </div>
        </>
      )}

      <aside className="game-aside" ref={railRef}>
        <section className="aside-section">
          <span className="aside-label">Match info</span>
          <div className="aside-row">
            <span>Round</span>
            <b>{phase === 'idle' ? 'Ready' : `${roundNo}/${ROUNDS_PER_MATCH}`}</b>
          </div>
          <div className="aside-row">
            <span>Bet</span>
            <b>{activeBet}</b>
          </div>
          <div className="aside-row">
            <span>Arm</span>
            <b>{state.arm === 'drop-lowest' ? 'Best 4' : 'Banked'}</b>
          </div>
        </section>
        <section className="aside-section">
          <span className="aside-label">Player stats</span>
          <div className="aside-row">
            <span>Win Rate</span>
            <b>{displayWinRate}</b>
          </div>
          <div className="aside-row">
            <span>Best</span>
            <b>{displayBest > 0 ? fmt(displayBest) : '—'}</b>
          </div>
          <div className="aside-row">
            <span>Net</span>
            <b className={displayNet === null ? '' : displayNet >= 0 ? 'pos' : 'neg'}>
              {displayNet === null ? '—' : `${displayNet > 0 ? '+' : ''}${displayNet}`}
            </b>
          </div>
        </section>
      </aside>

      <main className="arena">
        <div className="opponents">
          <ScorePanel
            who="YOU"
            name="you"
            score={playerLive}
            roundLine={
              matchEnd
                ? null
                : state.playerCashed !== null
                  ? `Cashed ${fmt(state.playerCashed)}`
                  : running
                    ? 'In The Air'
                    : '—'
            }
            kind={state.playerCashed !== null ? 'cashed' : crashed ? 'bust' : 'idle'}
            align="left"
            won={matchWon}
            panelRef={wonPanelRef}
          />
          <ScorePanel
            who="GHOST"
            name={state.ghostName || 'matching…'}
            score={ghostLive}
            roundLine={
              matchEnd
                ? null
                : state.ghostCashed !== null
                  ? `Cashed ${fmt(state.ghostCashed)}`
                  : running
                    ? 'Riding…'
                    : '—'
            }
            kind={state.ghostCashed !== null ? 'cashed' : crashed ? 'bust' : 'idle'}
            align="right"
          />
        </div>

        <div className="stage" ref={stageRef}>
          <CurveCanvas multiplier={multiplier} crashed={showCrashFx} />
          {/* FX-1 — cash-out micro-burst: fires once the instant you lock in. */}
          {running && playerCashedOut && <div className="cashburst" key={`cb-${state.nonce}`} />}
          <div
            ref={tickerRef}
            className={`ticker ${showCrashFx ? 'crash' : running ? 'live' : 'idle'}`}
          >
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
          <MatchVerdict result={matchResult} delta={lastDelta} />
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
        {/* Share button — only when the player cashed out (not busted). */}
        {(roundEnd || matchEnd) && !lastBust && state.playerCashed !== null && (
          <ShareChallenge multiplier={state.playerCashed} />
        )}
      </main>

      <section className="round-console" aria-label="Round controls">
        <div className="round-info">
          <div className="ladder">
            <span className="ladder-label">
              {phase === 'idle' ? 'BEST OF 5' : `ROUND ${roundNo}/${ROUNDS_PER_MATCH}`}
            </span>
            <div className="pips">
              {Array.from({ length: ROUNDS_PER_MATCH }, (_, i) => {
                const ps = pipState(i, rounds, running);
                return <span key={`${i}-${ps}`} className={`pip ${ps}`} />;
              })}
            </div>
          </div>
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
          </div>
        </div>
        <div className="round-actions">
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
              NEXT ROUND →
            </button>
          ) : matchEnd ? (
            <button className="primary rematch" onClick={advance}>
              RUN IT BACK ↻
            </button>
          ) : balance < MIN_BET ? (
            <button className="primary rebuy" onClick={() => setBalance(rebuy(setBalance))}>
              REBUY · 1,000 COINS
            </button>
          ) : (
            <>
              <button className="primary enter" onClick={enterDuel} disabled={balance < activeBet}>
                ENTER DUEL · {activeBet}
              </button>
            </>
          )}
        </div>
      </section>

      <footer className="app-footer">
        <div className="footer-copy">
          <span>{scoringRule}</span>
          <span>
            Play money — <strong>on-chain crypto duels coming soon.</strong>
          </span>
        </div>
        {!inMatch && balance >= MIN_BET && (
          <div className="footer-bets" aria-label="Bet size">
            <span className="bet-label">BET</span>
            {BET_OPTIONS.map((o) => (
              <button
                key={o}
                className={`bet-opt ${activeBet === o ? 'active' : ''} ${balance < o ? 'dim' : ''}`}
                onClick={() => balance >= o && setBet(o)}
                disabled={balance < o}
              >
                {o}
              </button>
            ))}
          </div>
        )}
      </footer>

      {import.meta.env.DEV && showGate && <GatePanel />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showLeaderboard && <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />}
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
  panelRef,
}: {
  who: string;
  name: string;
  score: number;
  roundLine: string | null;
  kind: 'idle' | 'cashed' | 'bust';
  align: 'left' | 'right';
  won?: boolean;
  panelRef?: Ref<HTMLDivElement>;
}) {
  const shown = useCountUp(score);
  const isGhost = who === 'GHOST';
  return (
    <div className={`panel ${align} ${who.toLowerCase()} ${kind} ${won ? 'won' : ''}`} ref={panelRef}>
      <div className="panel-identity">
        <span className="who">{who}</span>
        <span className="pname">{name}</span>
      </div>
      <div className="panel-readout">
        <span className="score">
          {shown.toFixed(2)}
          <i>pts</i>
        </span>
        <span className="roundline">{roundLine ?? (isGhost ? 'Opponent locked' : 'Match locked')}</span>
      </div>
    </div>
  );
}

function MatchVerdict({ result, delta }: { result: MatchResult; delta: number | null }) {
  const verdict =
    result.outcome === 'win' ? 'YOU WIN' : result.outcome === 'loss' ? 'YOU LOSE' : 'DRAW';
  const armNote = result.arm === 'drop-lowest' ? 'drop-lowest round' : 'banked points';
  return (
    <div className={`verdict match ${result.outcome}`} key="match">
      <div className="vcol">
        <span className="vmain">{verdict}</span>
        <span className="vsub">scoring: {armNote}</span>
      </div>
      <div className="vcol" style={{ alignItems: 'flex-end' }}>
        <span className="vscore">
          {result.playerScore.toFixed(2)} <em>vs</em> {result.ghostScore.toFixed(2)}
        </span>
        {delta !== null && delta !== 0 && (
          <span className={`vdelta ${delta > 0 ? 'win' : 'loss'}`}>
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
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
