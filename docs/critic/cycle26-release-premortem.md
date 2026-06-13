# Cycle 26 Release Pre-Mortem - Deterministic E2E PR

Role: `critic-munger`  
Model: `gpt-5.5`  
Reasoning effort: `medium`  
Scope: pre-merge inversion for the narrow Cycle 26 PR that publishes the Cycle 25 deterministic cockpit smoke changes.

## Verdict

Conditional GO, but only if the PR stays narrow and the checks below pass on GitHub.

This PR is not a product feature. It is a release-confidence instrument. The way it hurts the product is not by changing the UI; it hurts the product if the test hook leaks, the team overclaims what the artifact proves, or the PR becomes a junk drawer of unrelated release debris.

## 1. Failure Mode: The E2E Hook Becomes a Production Cheat Surface

The most obvious fatal path is that `window.__CRASHOUT_E2E__` is accessible in normal traffic, or a user can enable `?crashoutE2E=1` on a deployed page and call `completeMatch()`. That turns a test convenience into a gameplay integrity defect. In a crypto-adjacent product, the screenshot of a public match-completion API is worse than the bug itself because it teaches users that hidden test powers exist in the game.

This is especially dangerous because the hook is intentionally simple and powerful. It jumps to a deterministic match-end state. That is fine inside a local Playwright smoke gate; it is unacceptable if it can affect production player state, history, leaderboard rows, analytics, balances, fair-proof semantics, or user-visible controls.

Detection checks before merge:

- Normal production-like page load without `?crashoutE2E=1` must return `undefined` for `window.__CRASHOUT_E2E__`.
- Search the diff for test hook exposure: `rg "__CRASHOUT_E2E__|crashoutE2E|crashout.e2e|completeMatch" projects/crashout`.
- Confirm there is no visible debug UI, admin route, test button, or user-facing copy mentioning E2E/test mode.
- Confirm the hook does not write backend records, leaderboard rows, history rows, analytics events, wallet balances, or privileged fair-proof data.
- Inspect GitHub CI env and deploy config: no production deploy command should set a permanent E2E/test flag.

Merge rule: no-go if the hook is present by default, mutates product data, or creates a visible/testable production affordance for players.

## 2. Failure Mode: Green CI Creates False Confidence

The current hook proves that the app can render a deterministic five-round `matchEnd` state and capture artifacts. It does not prove the real player path through `ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, and `RUN IT BACK`. If the PR description or release notes imply "full user journey covered," the team will make future release decisions on an inflated signal.

This is classic miscalibration: a clean artifact becomes a story, and the story becomes stronger than the evidence. The smoke check is valuable precisely because it is narrow. Pretending it covers the click-by-click game loop converts a useful instrument into a false safety certificate.

Detection checks before merge:

- PR description must explicitly say this is deterministic render/state evidence for match-end, not full user-driven E2E coverage.
- `measurements.json` in the uploaded `cockpit-smoke` artifact must include four `*-match-end` entries: desktop, tablet, mobile, and short-mobile.
- Each match-end entry must show deterministic evidence: `rounds === 5`, outcome, player score, ghost score, and no overflow findings.
- Artifact PNGs must include the expected `*-match-end.png` screenshots and show a recoverable `RUN IT BACK` state.
- CI must install Playwright Chromium and run `pnpm run smoke:cockpit` after `pnpm run check`.
- If CI is green but the artifact is missing, stale, or incomplete, treat the run as failed.

Merge rule: no-go if the artifact does not prove the stated narrow claim, or if the PR text overstates the claim.

## 3. Failure Mode: Narrow Release PR Becomes Muddy

The CEO decision is correct: publish the smallest useful confidence improvement, verify protected CI and artifacts, then move on. The failure path is that Cycle 26 absorbs opportunistic UI, gameplay, backend, wallet, analytics, dependency, generated artifact, or refactor changes. Then a CI failure becomes hard to diagnose, review becomes slower, and the release-confidence PR stops being a clean yes/no gate.

Generated smoke files are another trap. The repo already contains screenshot and measurement artifacts under `docs/qa/`. If the PR accidentally commits fresh local screenshots, stale measurements, or unrelated generated output, reviewers may inspect the wrong evidence or bless local artifacts instead of GitHub artifacts.

Detection checks before merge:

- `git diff --name-only origin/main...HEAD` should be limited to the E2E hook, cockpit smoke script, workflow/test support if needed, and documentation that explains the evidence.
- No unrelated gameplay, UI redesign, backend, wallet, analytics, dependency lockfile, or broad refactor changes.
- No newly generated local smoke PNGs or `measurements.json` unless they are intentionally part of the PR evidence policy.
- GitHub artifact must be the source of truth for merge readiness, not committed local screenshots.
- Review `git diff --stat origin/main...HEAD`; if the diff is large enough that hook behavior is hard to audit, split the PR.

Merge rule: no-go if unrelated changes make failure attribution ambiguous or if generated local artifacts obscure the GitHub CI evidence.

## Go / No-Go Judgment

GO if all are true:

- Hook is absent by default and only enabled by explicit test opt-in.
- Hook cannot mutate product data outside the same local/demo state needed for smoke.
- GitHub CI is green for `Crashout CI / Lint, test, build`.
- Uploaded `cockpit-smoke` artifact contains valid match-end JSON and PNG evidence for all four viewports.
- PR description accurately scopes the evidence and names the user-driven five-round journey as follow-up.
- Diff remains narrow and reviewable.

NO-GO if any are true:

- A normal user can discover or use the hook in production traffic.
- CI is green but artifacts are missing, stale, or not inspected.
- The PR claims full gameplay journey confidence from a direct match-end setter.
- The diff includes unrelated product changes or generated artifacts that muddy review.

Munger answer: ship the narrow instrument, not the story around it. The artifact can earn trust only if the team refuses to let it prove more than it actually proves.
