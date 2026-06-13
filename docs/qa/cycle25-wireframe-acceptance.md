# Cycle 25 QA Acceptance Criteria — Wireframe Refactor

Simulated teammate: `qa-bach`
Model: `gpt-5.5`, reasoning effort: `medium`

## Risk Focus

This is a UI architecture refactor over a working game. The highest risk is not game logic; it is broken visibility, focus, and responsive layout.

## Acceptance Criteria

### Layout

- At desktop width, the app visibly matches the wireframe structure:
  - header spans full width
  - nav island is left column
  - game-info aside is second column
  - main arena is right column
  - round progress/action row is below main arena
  - footer spans full width
- At mobile width, all regions stack without overlap and the main action remains easy to reach.
- No text overlaps inside header chips, score panels, CTA, nav buttons, verdict, or challenge banner.

### Gameplay

- `ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, `RUN IT BACK`, and `REBUY` still work.
- Space/Enter shortcut behavior is unchanged.
- Player and ghost scores update exactly as before.
- Match result and balance delta apply exactly once.
- Share challenge still appears after a successful cash-out and copies/fallbacks as before.

### Navigation

- Nav island game button returns the player to the game surface.
- Nav leaderboard button opens and closes existing leaderboard.
- Nav history button opens and closes existing history.
- Nav settings/help button opens the existing settings/help surface.
- Focus is visible on nav and action buttons.

### Data/State

- Aside match info reflects current round, bet, and scoring arm.
- Aside stats either show real derived values or explicit placeholders; no fake numbers.
- Fair/live/balance chips remain visible in header.
- Challenge banner `?c=4.32` still renders and can be dismissed.

## Automated Checks

Run:

```bash
pnpm test
pnpm build
```

## Manual Exploratory Charters

- Resize during a running round and verify stage, CTA, pips, and scores remain readable.
- Finish a match where the player wins after busting the last round; verify celebration still takes precedence.
- Open leaderboard/history while in a round; verify closing returns to the game without losing round state.
- Test with reduced motion enabled; verify no essential feedback disappears.
