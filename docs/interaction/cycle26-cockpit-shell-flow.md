# Cycle 26 Interaction Pass — Cockpit Shell

Simulated teammate: `interaction-cooper`
Model: `gpt-5.5`, reasoning effort: `medium`

## Primary Persona

An impatient arcade bettor playing a short duel. They do not want education first; they want a clear next action and confidence that the state is fair.

## Flow

1. Land on game view.
2. Pick bet in the round console.
3. Enter duel.
4. Watch multiplier and opponent panel.
5. Cash out from the same console that shows round progress.
6. Advance or run it back from the same location.

## Interaction Decisions

- Persistent nav button `Game` closes secondary overlays.
- `Leaderboard` and `History` open the existing panels.
- `Settings` opens the existing sheet for sound/help/dev gate.
- Keyboard flow remains unchanged: Space/Enter cashes out while live and advances otherwise.

## Risks

- Too much aside information can distract from the live action. Keep aside text compact.
- Nav icons need explicit `aria-label` because the visible labels are intentionally terse.
