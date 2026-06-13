# Cycle 11 CTO Output — CI Gate Architecture Risk

Role simulation: CTO (`cto-vogels`) with `model: gpt-5.5`, `model_reasoning_effort: medium`.

## Executive Decision

Putting the deterministic Playwright cockpit smoke inside the existing protected `Lint, test, build` job is the right architecture for this stage.

It keeps the release contract simple: one protected context continues to answer "is this branch releasable?" without creating another GitHub branch-protection dependency or a second status that can drift out of enforcement. The product has no organic users yet, so the correct move is to raise confidence in the existing gate, not build a larger release system.

## Why This Is the Right Shape

- **Business impact:** the cockpit layout is now core product surface area. A build that compiles but ships clipped controls on mobile is a real release failure. The protected job should catch that before merge.
- **Blast radius:** the change adds Chromium installation, one smoke command, and a short-lived artifact upload to an existing job. It does not introduce a new deploy path, branch-protection rule, service account, or environment.
- **Determinism:** the gate covers idle, history, settings, running, and round-end cockpit states across desktop, tablet, mobile, and short-mobile. It deliberately avoids full match completion because that path is still time/probability driven without explicit test hooks.
- **Operability:** when the gate fails, CI uploads screenshots and measurements. That turns a visual regression from "try to reproduce locally" into inspectable evidence.

## Architecture Assessment

The important architectural choice is not "Playwright versus another browser runner." The important choice is making visual cockpit health part of the same required release predicate as lint, unit tests, and build.

That is correct because the cockpit is no longer decorative UI. It is the game loop interface. If the primary button, round console, history surface, or responsive shell is clipped, the game can be functionally unavailable even when TypeScript and unit tests pass.

Keeping it in the existing protected job also avoids a common CI failure mode: adding a new check that everyone assumes is required while branch protection still only enforces the old one. One required job is less flexible, but it is harder to misunderstand.

## Failure Modes

| Failure mode | Impact | Mitigation / posture |
|---|---:|---|
| Playwright browser or OS dependency install fails | PRs blocked despite application code being healthy | Acceptable for now. This is a release gate and browser availability is part of the release environment. Reassess only if install failures become common. |
| CI runtime increases | Slower feedback on every protected run | Acceptable while the suite remains a focused smoke. Track runtime after push; do not let this grow into a broad E2E suite inside the same job. |
| Smoke flakes on timing (`networkidle`, fixed waits, animation state) | False red protected check | Current scope is deterministic enough, but this is the main watch item. If flakes appear, add app-level readiness/test hooks instead of increasing sleeps. |
| The single protected job now mixes compile, unit, build, and browser smoke failures | A browser-environment issue blocks all merges | Intentional at this stage. The cockpit is release-critical. Split later only when the team needs separate ownership or parallelism. |
| The smoke validates layout presence, not game correctness | CI can pass while deeper match/economy flows are broken | This is acceptable because unit tests own game logic and the smoke owns cockpit usability. Full match E2E needs deterministic hooks before it should block releases. |
| Artifact upload path drifts from generated output | Failed or missing debugging evidence | Current paths align: the script writes to repo-level `docs/qa/cockpit-smoke/`, and the action uploads that same path. Keep generated artifacts gitignored. |
| Playwright version drift changes rendering or install behavior | New failures after dependency updates | Lockfile limits drift. Treat Playwright upgrades as release-affecting dependency changes, not routine patch noise. |

## Release Risk

Net release risk goes down.

Before this change, the protected job could approve a release that built successfully but had a broken mobile cockpit. After this change, that class of failure is blocked before merge. The traded risk is that CI can now fail because the browser runner or smoke timing is unhealthy. For a game whose first impression is the cockpit, that is the right trade.

The bigger release-system risk remains outside this change: deployment is still not fully tied to a remote, reproducible build pipeline. The CI gate proves the branch can build and render the cockpit, but it does not by itself prove those exact bytes are what production deploys unless release execution is disciplined.

## What Not To Do Yet

- Do not put full match completion back into the protected smoke until the app exposes deterministic test hooks for round/match progression.
- Do not create a separate required GitHub status just to make the smoke look more important. That increases branch-protection surface area without improving product safety.
- Do not grow this script into a catch-all E2E suite. The protected job should stay fast enough that engineers trust it and wait for it.

## Next Technical Debt Item

Add deterministic gameplay test hooks for CI-owned browser flows.

The next valuable debt payment is a small, production-safe test interface that lets Playwright drive a round/match to known states without waiting on probabilistic timing. That unlocks a separate full-match E2E check later, while keeping the current protected cockpit smoke fast and deterministic.

Definition of done:

- Test mode can be enabled only in local/CI builds, not by ordinary production users.
- Playwright can force or seed round progression to `idle`, `running`, `cashed out`, `crashed`, and `match complete`.
- The cockpit smoke remains layout-focused.
- A future match-flow test can run separately and be promoted to protected only after it is stable over repeated CI runs.

## Push Verification Criteria

After commit and push, verify the protected GitHub Actions run:

- `Lint, test, build` passes on the branch or PR.
- The `Run cockpit smoke` step executes after `pnpm run check`.
- The `cockpit-smoke` artifact is present and contains screenshots plus `measurements.json`.
- Runtime increase is visible and acceptable; if the job becomes materially slower, split install/cache optimization before adding more browser coverage.

## CTO Verdict

Ship the CI gate as-is, then verify it in GitHub Actions before merging.

This is a small, high-leverage reliability improvement with contained blast radius. The next architectural move is not more CI YAML; it is deterministic app testability so future browser gates can assert gameplay outcomes without turning release into a coin flip.
