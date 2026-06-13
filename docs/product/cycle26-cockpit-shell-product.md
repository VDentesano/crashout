# Cycle 26 Product Pass — Cockpit Shell

Simulated teammate: `product-norman`
Model: `gpt-5.5`, reasoning effort: `medium`

## Decision

Implement the wireframe shell now. The product risk is not game logic; it is discoverability and status readability.

## User Goal

The primary player wants to know five things without opening any overlay: current round, who is ahead, current bet, when to cash out, and what happens next.

## Product Requirements

- Preserve the current playable loop and all match/economy behavior.
- Make the named cockpit regions visible: header, nav island, game aside, arena, round console, footer.
- Move the primary action into the round console because it belongs beside round progress.
- Put `YOU` before `GHOST` in the arena to match player-first reading.
- Keep history, leaderboard, help, and settings discoverable through persistent nav controls.

## Acceptance

- A first-time player can find leaderboard/history/help without the header menu.
- During a live round, the `CASH OUT` button is adjacent to pips and match standing.
- The footer no longer competes with the primary action.
