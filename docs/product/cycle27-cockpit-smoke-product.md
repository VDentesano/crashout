# Cycle 27 Product Smoke — Cockpit Shell

Simulated teammate: `product-norman`  
Engine: Codex CLI, `gpt-5.5`, reasoning effort `medium`

## Decision

**Can ship the cockpit shell.** The idle, running, locked, and round-end states are understandable enough for a visual/pointer-user deploy smoke: the player sees the round, score posture, bet, and next action in one cockpit path. Match-end is consistent in code with the same console pattern: final verdict in the arena and `RUN IT BACK` in the round console.

I would not hold deploy for a layout rewrite. The main user need is met: when the multiplier is live, `CASH OUT` is next to round progress and standing, not buried in the footer.

## Must-Fix Before Deploy

None found from the product/usability smoke.

## Can-Ship Issues

1. **First-visit help still blocks the cockpit.** A fresh player sees the `How to play` dialog before they can inspect nav, history, leaderboard, or the actual shell. It is dismissible and does not break the game, so this can ship, but it still conflicts with the earlier practice-first direction.

2. **Mobile nav discoverability is icon-first.** Below 560px, labels are visually hidden, so `★` must carry leaderboard and `≡` must carry history. The `aria-label`s are present, but visual users may need one exploratory tap. Acceptable for smoke; improve later with tooltips, first-run labels, or a slightly wider labeled mobile nav.

3. **Overlay focus behavior is not product-complete.** Leaderboard/history/settings open and close from nav, and `Game` returns to the arena state, but focus is not deliberately moved into dialogs or restored to the triggering nav button. Pointer flow is fine; keyboard/screen-reader polish remains.

4. **Round pips are color-only visual spans.** The pips communicate well visually, but they do not expose round status text or `aria-label`s. This is not blocking the visual deploy, but it should be fixed before claiming accessibility readiness.

## Smoke Evidence

- Reviewed current product, interaction, and QA acceptance docs for cycles 25-26.
- Reviewed `projects/crashout/src/App.tsx`, cockpit CSS, and overlay components.
- Ran `pnpm test`: pass.
- Ran `pnpm build`: pass.
- Captured mobile and desktop Chromium screenshots.
- Drove mobile flow through onboarding dismiss, idle, running, locked-after-cashout, roundEnd, leaderboard overlay, history overlay, and `Game` return.

## Usability Read

The cockpit now gives the player a stable mental model:

- **Idle:** bet options and `ENTER DUEL` are in the same round console.
- **Running:** `CASH OUT` mirrors the live multiplier and remains the dominant action.
- **Locked:** disabled `LOCKED` state clearly confirms the player already acted.
- **RoundEnd:** verdict, resolved pip, standing, and `NEXT ROUND` all agree.
- **MatchEnd:** code follows the same final-action mapping with `RUN IT BACK`.
- **Nav overlays:** persistent nav opens leaderboard/history/settings, and `Game` closes secondary surfaces.

This is usable enough to deploy as a cockpit acceptance smoke. The remaining issues are about first-run teaching and accessibility fidelity, not core game comprehension.
