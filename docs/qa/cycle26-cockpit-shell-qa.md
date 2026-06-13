# Cycle 26 QA Pass — Cockpit Shell

Simulated teammate: `qa-bach`
Model: `gpt-5.5`, reasoning effort: `medium`

## High-Risk Checks

- Existing gameplay behavior must not change.
- The CTA must be enabled/disabled exactly as before.
- Overlays must still open and close from both nav and menu.
- Responsive layout must not hide the action button on mobile.

## Automated Checks

- `pnpm test`
- `pnpm build`

## Manual Smoke

- Idle: select each bet option and enter duel.
- Running: cash out and verify button locks.
- Round end: next round advances.
- Match end: run it back resets state.
- Nav: open leaderboard, history, settings; use Game to return.
- Challenge URL: `/?c=4.32` still displays banner.
