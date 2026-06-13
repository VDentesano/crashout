# Cycle 25 Interaction Plan — Wireframe Flow

Simulated teammate: `interaction-cooper`
Model: `gpt-5.5`, reasoning effort: `medium`

## Primary Persona

A competitive mobile/desktop player who wants a fast 1v1 crash duel, can understand risk quickly, and wants immediate feedback after cashing out or busting.

## Goal

The player should always know:

- Am I in a match?
- What round is this?
- Who is ahead?
- What is my current risk/action?
- What happens if I press the main button?

## Current Flow Problem

The current app works, but the user must stitch together state from separate regions:

- Pips and match status live in the rail.
- Bet/action lives in the footer.
- Opponent score lives above the stage.
- History/leaderboard/settings are hidden in an overflow sheet.

The wireframe fixes this by putting "round progress + next action" in one row below the arena. That should be the main interaction correction.

## Required Interaction States

| Phase | Round Row Should Show | CTA |
| --- | --- | --- |
| idle | best-of-5 pips empty, bet selector, balance status | `ENTER DUEL` |
| running | current pip active, live status, current multiplier mirrored in CTA | `CASH OUT` |
| running + cashed | locked state and opponent still riding | disabled `LOCKED` |
| roundEnd | resolved pip, round verdict summary | `NEXT ROUND` |
| matchEnd | full match result and score | `RUN IT BACK` |
| broke | balance warning | `REBUY` |

## Nav Island Behavior

Recommended first pass:

- Game: closes overlays and returns focus to arena.
- Leaderboard: opens existing `LeaderboardPanel`.
- History: opens existing `HistoryPanel`.
- Settings: opens the existing sheet or help/settings surface.

Do not add routes in this cycle. Modal state is enough and matches the current single-screen game.

## Aside Behavior

The aside is glanceable context, not an action surface:

- Match Info: round number, bet, scoring arm, fair mode.
- Player Stats: win rate, best cashout, net delta.
- Optional Rule: show the scoring rule when idle or in a collapsed text line.

If data is missing, show `--` rather than fake precision. Do not make the player interpret unavailable data.

## Keyboard And Focus

- Preserve Space/Enter behavior.
- When an overlay opens from nav, focus should move into it; when closed, focus returns to the nav button.
- The primary CTA remains a real button in the round row, so keyboard users do not need to tab through the whole aside.

## Interaction Pitfalls

- Do not put settings/help before game actions in tab order on mobile.
- Do not duplicate primary actions in both round row and footer.
- Do not make `GHOST` red; red means bust/loss.
- Do not make pips only color-coded; add `aria-label` or text status for screen readers.
