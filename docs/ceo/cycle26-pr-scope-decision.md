# Cycle 26 CEO Decision - Narrow PR Scope

Role: `ceo-bezos`  
Model: `gpt-5.5`  
Reasoning effort: `medium`  
Decision: open a narrow PR for the Cycle 25 deterministic cockpit smoke changes, then verify protected CI and uploaded smoke evidence before expanding scope.

## Customer / Problem

The customer problem is release trust. A player does not care that the state machine can technically finish a match; they care that CRASHOUT reliably loads, runs, resolves, and returns to a replayable state without visual confusion or broken controls. The team needs the same confidence before shipping behind protected `main`.

Cycle 25 added a gated browser E2E hook, `window.__CRASHOUT_E2E__`, plus cockpit smoke updates that can deterministically place the UI at a five-round match end and capture match-end evidence across desktop, tablet, mobile, and short-mobile viewports. That turns a random/timing-sensitive smoke check into repeatable release evidence.

This is a customer-facing investment even though the user never sees the hook. The flywheel is: better release confidence -> safer merges -> faster shipping -> fewer player-visible regressions.

## Release Priority

Priority: P0 release gate hardening.

This PR should be treated as the next release action because it improves confidence in every later product change. It does not attempt to create new player value directly; it reduces the probability that future visible work ships with a broken end-of-match experience.

The acceptance target is narrow:

- `Crashout CI / Lint, test, build` is green on the PR.
- Playwright Chromium installs and runs the cockpit smoke in CI.
- The uploaded `cockpit-smoke` artifact contains `measurements.json` and the expected `*-match-end.png` evidence.
- The evidence shows four match-end viewport entries with five deterministic rounds and a recoverable `RUN IT BACK` state.

## Why This PR Should Stay Narrow

This is a high-leverage reversible decision. The code surface is small, the behavior is gated, and the output is easy to inspect in CI artifacts. Expanding it before the first protected run would mix a release-infrastructure question with product/UI questions and make failure diagnosis slower.

Keep this PR to:

- the gated E2E hook contract;
- cockpit smoke completion and assertions;
- CI artifact verification;
- documentation that names what this evidence does and does not prove.

Do not add new gameplay, design revisions, backend behavior, wallet behavior, analytics, or broad refactors in this PR. Those are separate customer bets. This PR is the instrumentation that lets the team make those bets with better feedback.

## Risks Of Scope Creep

Scope creep would damage the main value of this cycle: a clean yes/no release confidence signal.

- New UI or gameplay changes could cause visual diffs, timing changes, or state-machine regressions that obscure whether the deterministic smoke gate itself works.
- Backend or INSFORGE changes could introduce network and data risks into a browser-render confidence gate that should remain local and repeatable.
- Wallet or real-money-adjacent work would pull the PR into licensing, integrity, and settlement risk, none of which is needed to verify cockpit smoke evidence.
- Test expansion that tries to prove the full click-by-click player journey in the same PR could overpromise. The current hook proves deterministic render/state evidence at match end; a true user-driven five-round journey is a follow-up test, not a prerequisite for this release gate.
- Broad refactoring would increase review load and slow the protected PR path without improving the immediate customer outcome.

Day 1 decision: ship the smallest useful confidence improvement, inspect the artifact, then decide the next slice with better information.

## Next Customer-Value Action After CI Verification

After CI is green and the `cockpit-smoke` artifact is verified, the next customer-value action should be a user-driven five-round cockpit journey test that exercises the visible controls: `ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, and `RUN IT BACK`.

That follow-up matters because the deterministic hook proves the end-state can render coherently, but players experience the path, not just the final screen. The next slice should preserve determinism while driving the real controls so the team can catch regressions in action registration, locked feedback, round transition clarity, score agreement, and replay readiness.

Decision: open the Cycle 26 PR narrow, verify protected CI plus artifact evidence, then move to the click-through five-round journey as the next customer-facing confidence improvement.
