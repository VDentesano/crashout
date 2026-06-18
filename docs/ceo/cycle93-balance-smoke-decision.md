# Cycle 93 CEO Decision: Ship Balance Reconciliation Persistence Smoke

## Customer Problem

The customer is a CRASHOUT player deciding whether the game can be trusted with account-like state. Rounds persistence proves fairness mechanics survive write/read. History persistence proves completed matches can be remembered. The next trust question is whether wins, losses, and balance movements reconcile durably after play.

If the product can show past matches but cannot prove the resulting balance is correct, the player experience still feels unsafe.

## Decision

Ship the INSFORGE balance reconciliation persistence smoke after rounds/history.

This should be the next isolated backend smoke, not a UI feature and not a broader analytics pass. The smoke should create synthetic player activity, verify the persisted balance delta, and confirm readback through the same contract the app depends on.

## Why Balance Before Leaderboard/Events

Balance is closer to the customer's trust boundary. Leaderboards and event streams are valuable, but they are downstream signals. If balance reconciliation is wrong, leaderboard rankings become misleading and events become noise with no reliable financial meaning.

Balance also creates the stronger flywheel: trusted outcomes lead to more play, more completed matches, more history, and eventually better rankings and engagement surfaces. Shipping leaderboard/events first would make the system look richer while leaving the core account promise under-proven.

## Risks

- Balance touches account-like state, so synthetic data must be isolated by `smoke-*` player ids and must not affect visible customer state.
- Reconciliation can hide defects if the smoke only checks a final number. It should verify the starting balance, applied deltas, and final readback.
- This is closer to a one-way-door area than history because bad balance writes can erode trust quickly. Keep scope manual and narrow until cleanup or disposable backend branches exist.

## Next Action

Add a manual INSFORGE smoke that creates an isolated synthetic player balance, applies a deterministic win/loss sequence, reads the balance back, and fails unless the persisted delta exactly reconciles.
