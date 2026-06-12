# Fullstack — Cycle 3 build: Ladder Duel (Hypothesis B)

- **Author:** fullstack-dhh (coordinator, inline build)
- **Status:** Built, verified playable, build/lint/tests green. Deploy escalated.
- **Scope:** Layer the best-of-5 Ladder Duel + banked-points scoring onto the
  existing single-round `projects/crashout/` scaffold, per the locked Cycle-2
  decision (mechanic B).

## What shipped

A best-of-5 crash duel vs an async ghost, scored by cumulative banked points,
with the **variance-protection arm as a live A/B experiment**. Single screen,
play-money only, fully client-side.

### Changes by file

| File | Change |
|---|---|
| `src/game/types.ts` | +`ROUNDS_PER_MATCH=5`, `ExperimentArm`, `GhostRun`, `RoundRecord`, `MatchResult`. |
| `src/game/ghosts.ts` | Run-based pool (`pickGhostRun`/`recordGhostRun`, new key `crashout.ghostruns.v1`); `roundScore`, `scoreMatch(scores, arm)` (banked vs drop-lowest), `decideMatch`. Kept `resolveGhost`/`decideOutcome`. |
| `src/analytics/logger.ts` | Match-level instrument: 50/50 persisted `arm` (CSPRNG), `experiment_arm` + `match_result` events, `arm` on every event, gate read-out switched to **match** denominators + engaged-session minutes. |
| `src/game/useMatch.ts` | NEW. Best-of-5 state machine (`idle→running→roundEnd→…→matchEnd`); cumulative scoring; ghost-run replay; rAF loop driven by an effect (no self-referential callback); `advance()`/`cashOut()`. Replaced `useDuel.ts` (removed). |
| `src/App.tsx` | Ladder UI: round pips, dual cumulative score panels, per-round + match verdict, context-aware controls. |
| `src/App.css` | +ladder rail, score panels, match verdict, NEXT button (extends the existing CRASHOUT design system — no new aesthetic). |
| `src/game/logic.test.ts` | +`roundScore`, `scoreMatch` (incl. **symmetry**), `decideMatch` tests. |
| `tsconfig.app.json` | Exclude `*.test.ts` from the prod build (tests run via `node`). |

## Decisions / correctness notes

- **Arm symmetry (critical):** `scoreMatch` runs on player and ghost with the
  *same* arm against the *same* 5 crash points (one proof/nonce per round, reused
  for both). Asymmetric scoring would bias the win rate and corrupt the gate
  denominator. Asserted by a dedicated test.
- **The unit is the MATCH, not the round.** `rematch` fires only at match end;
  post-loss rematch rate = `rematch[prevOutcome=loss] / match_result[outcome=loss]`.
  Within-match round advancement emits no `rematch`.
- **rAF as an effect** keyed on `phase==='running'` — restarts per round, cancels
  on cleanup. Avoids the React-Compiler immutability rule that forbids the
  latest-ref self-scheduling pattern.
- **Rematch null-guard:** `matchEnd` is gated on `matchResult !== null` because a
  rematch clears the result before the async `startRound` flips phase (caught in
  browser smoke test as a render crash; fixed).

## Verification

- `node src/game/logic.test.ts` → **ALL PASS** (scoring, symmetry, decideMatch,
  resolveGhost, crash distribution).
- `pnpm build` (tsc + vite) → green. `pnpm lint` → clean.
- **Headless browser smoke test (Playwright):** played a full 5-round match +
  rematch. Event buffer: `session_start:1, experiment_arm:1, round_start:6,
  cashout:2, round_result:5, match_result:1, rematch:1 (prevOutcome:loss)`; every
  event carries `arm`; player run recorded; **zero page errors**. Arm split
  observed varying across runs (banked / drop-lowest). UI verified across idle /
  running / round-end / match-end.

## Blocked / escalated

- **Deploy to Cloudflare Pages** needs `wrangler login` (browser OAuth); no API
  token in env. Same human-escalation class as the INSFORGE OAuth blocker. The
  production bundle builds clean (`dist/`, ~65 kB gzip) and is deploy-ready.
- **Real gate data** still needs the INSFORGE backend (cross-player/day
  aggregation) — unchanged from Cycle 3 ADR.
