# Cycle 25 CTO Plan — Wireframe Refactor

Simulated teammate: `cto-vogels`
Model: `gpt-5.5`, reasoning effort: `medium`

## Technical Constraint

This cycle is analysis/planning. The next cycle should ship the layout refactor without changing the match engine, backend contracts, or deployment topology.

## Current Architecture

`App.tsx` is a single large orchestrator:

- Owns phase-derived state.
- Owns economy side effects.
- Owns keyboard shortcuts.
- Owns modal visibility.
- Renders header, rail, arena, controls, debug, overlays.

That is acceptable for a small game, but the wireframe refactor will be easier if the render tree is split into presentational regions while leaving state ownership in `App`.

## Recommended Component Boundary

Keep state and handlers in `App.tsx`; extract layout-only components only when it makes the file easier to read:

- `HeaderHud`
- `NavIsland`
- `GameAside`
- `Arena`
- `RoundConsole`
- existing `ScorePanel` and `MatchVerdict`

Do not introduce routing, global stores, or backend changes.

## Data Dependencies

Available now:

- round number: `roundNo`, `ROUNDS_PER_MATCH`
- bet: `bet`
- balance: `balance`
- scoring arm: `state.arm`
- fair mode/proof: `state.fairMode`, `state.fairVerified`, `state.proof`
- live scores: `playerLive`, `ghostLive`
- status: `leader`, `gap`, `roundsLeft`
- history/leaderboard: existing modal components and game/history helpers

Missing or needs derivation:

- player win rate
- best cashout
- net delta
- streak

Options:

1. Derive stats from local history if helper APIs expose them.
2. Add a small local derived stats helper in `game/history.ts`.
3. Show `--` initially and defer stats until data support exists.

Recommendation: use option 1 if already easy; otherwise ship option 3 to avoid scope creep.

## Failure Modes

- CSS grid refactor breaks mobile height because `body` has `overflow: hidden`.
- Main action moves but keyboard shortcut behavior silently diverges.
- Header/nav buttons duplicate modal behavior and create focus traps.
- Responsive grid causes score/ticker/action overlap.
- Existing GSAP refs break if stage or winning panel moves.

## Next-Cycle Technical Sequence

1. Introduce named layout wrappers and CSS grid areas.
2. Move JSX blocks into new regions with no logic changes.
3. Add `NavIsland` hooked to existing modal state.
4. Move CTA/bet/rebuy controls into `RoundConsole`.
5. Add `GameAside` with currently available data and placeholder stats.
6. Run `pnpm test`, `pnpm build`, and visual smoke on desktop/mobile.

## Complexity

Medium. Mostly JSX/CSS reorganization with high UI regression risk, low backend risk.
