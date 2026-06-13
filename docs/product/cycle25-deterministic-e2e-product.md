# Cycle 25 Product Acceptance — Deterministic E2E

Simulated teammate: `product-norman`  
Using model: `gpt-5.5`  
model_reasoning_effort: `medium`

## Product Acceptance Statement

A deterministic E2E for Crashout is accepted when it proves that a real player can complete one full best-of-5 duel through the visible cockpit UI, understand every major state transition, and finish with a coherent match result without relying on hidden knowledge, timing luck, or implementation-only assertions.

The test should show that the product answers the player's core questions at each step: am I in a match, what round is this, who is ahead, what can I do now, did my last action register, and what happens next?

## User-Visible Flow To Prove

1. **Idle / readiness**
   - The cockpit loads with brand, fair/live/local status, balance, bet, nav island, arena, aside, round console, and footer visible without layout collision.
   - The primary action is `ENTER DUEL`, placed beside round progress and bet context, not hidden in a secondary footer or overlay.
   - The player can identify that this is a best-of-5 duel before starting.

2. **Start duel**
   - Clicking `ENTER DUEL` starts the match through the same primary button a player uses.
   - The UI changes to a live round state: the round indicator advances, the multiplier rises, player/opponent panels are visible, and the action becomes `CASH OUT`.
   - The user can tell the opponent is still active without seeing future hidden information.

3. **Cash out / locked feedback**
   - Clicking `CASH OUT` produces immediate feedback that the player action registered.
   - The CTA changes to a disabled `LOCKED` state with the cashed multiplier.
   - The rest of the round can continue without making the player wonder whether a second click is needed.

4. **Round resolution**
   - When the round resolves, the arena shows the crash/cashout outcome, the score panels update, and the round console moves to `NEXT ROUND`.
   - The pips and standing agree with the verdict: round won, lost, or drawn.
   - A successful cash-out exposes the share challenge affordance without blocking the next round.

5. **Full match completion**
   - Repeating the visible `NEXT ROUND` / `CASH OUT` flow completes exactly five rounds.
   - At match end, the arena shows a final verdict of `YOU WIN`, `YOU LOSE`, or `DRAW`.
   - Final player and ghost scores match the deterministic scenario, the balance delta is applied once, and the primary action becomes `RUN IT BACK`.

6. **Secondary surfaces remain non-destructive**
   - Opening `Leaderboard`, `History`, or `Settings` from the nav does not erase or corrupt the current gameplay state.
   - Returning to `Game` restores focus to the cockpit flow conceptually: the player can continue from the same phase and next action.

## Product Constraints

- The E2E must drive visible controls: `ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, and `RUN IT BACK`.
- Determinism may control inputs and timing, but it should not skip the product experience or assert success only from hidden state.
- The test should cover desktop and mobile-sized viewports because the cockpit value depends on readable region mapping.
- The E2E should fail if the primary action, round status, verdict, or final score becomes visually incoherent, even if the state machine technically reaches `matchEnd`.

## Not Required For This Acceptance

- Proving backend fairness, settlement, or real-money behavior.
- Testing every ghost strategy or crash curve.
- Verifying detailed accessibility completion beyond visible focus/readability risks already noted in cycle 25-27 docs.
- Creating new product UI for test mode.

## Concise Pass Condition

Pass if a deterministic player, using only the real Crashout cockpit controls, can start a duel, cash out, observe locked and resolved round states, advance through five rounds, see the correct final verdict and score, and immediately understand that `RUN IT BACK` starts the next duel.
