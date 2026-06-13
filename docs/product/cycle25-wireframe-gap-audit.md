# Cycle 25 Product Audit — Wireframe Gap

Simulated teammate: `product-norman`
Model: `gpt-5.5`, reasoning effort: `medium`

## Scope

Human override requires comparing `wireframe.html` with `projects/crashout/src/App.tsx` and `projects/crashout/src/App.css`. No marketing, launch copy, or distribution work.

The wireframe describes CRASHOUT as a cockpit: persistent header, nav island, game-info aside, central arena, round progress/action row, and footer. The current app is a strong playable loop, but its information architecture is still a narrow arcade column with a desktop rail bolted on.

## Product Gap Audit

| Wireframe Area | Current App | Gap |
| --- | --- | --- |
| Header | Exists as `.hud` with brand, fair/live/balance chips, menu. | Bet and streak are not visible in header; settings/history/leaderboard are hidden behind menu instead of represented by nav island. |
| Nav island | Does not exist. Menu sheet contains history, leaderboard, help, sound, dev gate. | Missing persistent mode selector for game, leaderboard, history, settings. Current menu has lower discoverability. |
| Game-info aside | Current `.rail` holds ladder and match status only. | Missing match info card, player stats card, and stable side context. Existing rail content belongs partly in the wireframe round row. |
| Main arena | Exists with opponent panels, curve canvas, ticker, verdict, share challenge. | Opponent order differs from wireframe (`GHOST` left, `YOU` right vs wireframe `YOU` left, `GHOST` right). Panels are vertical rather than name/score split. |
| Round progress/action row | Progress is in `.rail`; action is in footer `.controls`. | Wireframe wants one row directly below the main arena: pips + status + current action button. |
| Footer | Current footer is primary controls and hints. | Footer should be secondary information only after action moves into round row. |

## Preserve

- Match engine and phases: `idle`, `running`, `roundEnd`, `matchEnd`.
- Economy: balance, bet options, rebuy, match delta.
- Fairness/live chips.
- CurveCanvas, ticker heat ramp, cash-out burst, crash/win effects.
- Verdict rendering and share challenge after a successful cash-out.
- History, leaderboard, onboarding, challenge banner as existing components.

## Move Or Reshape

- Move pips and live standing from `.rail` into the wireframe `round` area.
- Move primary CTA and bet row from `.controls` into the same `round` area.
- Convert `.rail` into `.nav-island` plus `.game-aside`; do not keep a single mixed sidebar.
- Keep the header menu only for overflow or settings details after nav island exists.
- Put `YOU` first and `GHOST` second to match the wireframe and the player's reading order.

## Missing States

- Active nav state for game/history/leaderboard/settings.
- Aside empty/loading state when history/player stats are not available.
- Header compact state for small screens when chips overflow.
- Round row variants for all phases:
  - idle: bet selector + `ENTER DUEL`
  - running: pips/status + `CASH OUT`
  - roundEnd: pips/status + `NEXT ROUND`
  - matchEnd: pips/status + `RUN IT BACK`
  - broke: `REBUY`
- Footer content state for "play money / crypto coming soon" and rules without competing with the primary action.

## Prioritized Implementation Plan

1. Create semantic layout regions in `App.tsx`: `header`, `nav`, `aside`, `main`, `round`, `footer`.
2. Move existing content into those regions without changing game logic.
3. Split `rail` content: pips/status/action to `round`, match/rule/stats to `aside`.
4. Add nav island buttons wired to existing modal state: game, leaderboard, history, settings/help.
5. Add derived player stats from local match history or local fallback values; make missing data explicit.
6. Update CSS grid to match the wireframe on desktop while keeping a stacked mobile layout.

## Acceptance Criteria

- Desktop viewport shows all wireframe regions at once: header, nav island, aside, main arena, round row, footer.
- Primary action is directly adjacent to round progress, not isolated in the bottom footer.
- A first-time player can identify current round, bet, score, opponent, cash-out action, and match status without opening a menu.
- Existing gameplay behavior is unchanged.
