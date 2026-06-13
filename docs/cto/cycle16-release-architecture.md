# Cycle 16 CTO Output - Protected PR Release Architecture

Role simulation: CTO (`cto-vogels`) with Werner Vogels operating principles: everything fails all the time, you build it you run it, API/contracts matter, prefer boring technology, minimize blast radius.

## Decision

Route the cockpit smoke CI gate through the protected PR path and keep it inside the existing required `Lint, test, build` GitHub Actions context.

This is the right reliability architecture for the current release stage. The cockpit is the primary product interface, so a branch that cannot prove the cockpit renders across the selected viewports should not merge to the protected release branch. The gate should remain a focused smoke, backed by artifacts, rather than becoming a broad end-to-end suite.

## Architecture Assessment

The protected route turns cockpit health into a release contract instead of an optional local check. That matters because the failure mode is user-visible: a compiled app with clipped controls, broken short-mobile layout, or an unreadable round console is not releasable even if unit tests pass.

The contract is intentionally simple:

- Branch protection requires the existing `Crashout CI / Lint, test, build` context.
- The job runs `pnpm run check` from `projects/crashout`.
- The same job installs Playwright Chromium and runs `pnpm run smoke:cockpit`.
- The workflow uploads a `cockpit-smoke` artifact from `docs/qa/cockpit-smoke/`.
- Generated evidence remains outside the committed source tree.

Keeping one required context is a boring, reliable choice. It avoids a second status check that branch protection might not enforce, avoids a new release authority, and gives engineers one clear answer to "can this PR merge?"

## Branch Protection

Branch protection is the core reliability boundary here. The cockpit smoke only matters operationally if it blocks the merge path that feeds production.

The current shape has good properties:

- **Single enforced predicate:** `Lint, test, build` remains the required merge signal.
- **Low policy drift:** no new required GitHub status needs to be manually added or kept in sync.
- **Clear ownership:** the team that changes the cockpit owns the smoke evidence in the same PR.
- **Small blast radius:** failures block the PR, not production traffic.

The main weakness is that one job now mixes lint, unit tests, build, browser install, smoke execution, and artifact upload. That is acceptable while the suite is small. Split only when runtime or ownership pressure justifies it, and only after the split check is actually enforced by branch protection.

## CI Artifact Evidence

The artifact is not decoration. It is the evidence trail for a visual release predicate.

The `cockpit-smoke` artifact should be treated as merge evidence when the protected PR is under review. It needs to contain `measurements.json` plus screenshots for desktop, tablet, mobile, and short-mobile states. A green check without an artifact is weaker than the architecture intends, because the team loses the ability to inspect what CI actually saw.

This also gives a practical failure workflow:

- If the smoke fails because the layout is broken, the screenshots show the regression.
- If the smoke fails because the measurement logic is wrong, `measurements.json` gives the failing selector and geometry.
- If the artifact is missing, the CI contract is incomplete even if earlier steps passed.

The 14-day retention is reasonable for this stage. It preserves near-term release evidence without turning generated smoke output into permanent product source.

## Double-Build Cost

The protected job currently builds twice:

- `pnpm run check` runs `pnpm lint && pnpm test && pnpm build`.
- `pnpm run smoke:cockpit` runs `pnpm build && node scripts/cockpit-smoke.mjs`.

That duplication is a real cost, but it is not yet the wrong trade. The second build guarantees the smoke script can run standalone locally and in CI without relying on implicit prior job state. That makes the command boring and reproducible.

The cost becomes worth revisiting when one of these is true:

- CI runtime makes developers avoid the protected path.
- Playwright installation plus the second build becomes the dominant feedback delay.
- The smoke grows beyond a focused cockpit regression check.

The first optimization should not be architectural complexity. Prefer a small script-level improvement, such as allowing CI to pass an already-built `dist` into the smoke runner, while keeping the local `pnpm run smoke:cockpit` command self-sufficient.

## Deterministic Gameplay Hooks

The current smoke should remain layout-focused. It drives idle, history, settings, running, and round-end cockpit states, but it deliberately avoids full match completion and deeper economy assertions.

That is the correct boundary until the app exposes deterministic gameplay hooks. A browser test that waits on probabilistic round timing will fail eventually. Adding sleeps would make the release gate slower and less trustworthy.

The next technical debt item is a production-safe test mode for CI-owned flows:

- Seed or force round state without exposing control to ordinary production users.
- Drive `idle`, `running`, `cashed out`, `crashed`, and `match complete` states deterministically.
- Keep layout smoke separate from gameplay correctness tests.
- Promote deeper match-flow E2E to protected status only after repeated non-flaky CI runs.

This preserves the current gate's value while opening a path to stronger game-loop evidence later.

## Operational Blast Radius

The blast radius is appropriately small.

The gate changes merge behavior, not runtime behavior. A bad smoke result blocks a PR before it reaches the protected branch. It does not alter deployed infrastructure, introduce a new external service, or change the production request path.

Operational risks are still real:

| Risk | Impact | Posture |
|---|---:|---|
| Playwright or OS dependency install fails | PRs blocked by environment failure | Accept while rare; investigate before bypassing. |
| Browser rendering changes after dependency updates | False red or visual churn | Treat Playwright upgrades as release-affecting changes. |
| Artifact upload path drifts | Green run lacks usable evidence | Keep artifact verification in PR review. |
| Smoke timing flakes | Engineers lose trust in the gate | Add readiness/test hooks, not longer sleeps. |
| Job runtime grows | Slower protected feedback | Optimize before expanding scope. |

Rollback is also contained: remove the Playwright install, `pnpm run smoke:cockpit`, and artifact upload steps from the workflow. Branch protection can remain intact because the required context name does not change.

## Business Impact

This decision trades a modest CI-time increase for fewer broken first impressions. That is the right trade for a cockpit-led game where the main interaction surface is the product.

The protected PR path also creates useful release discipline. It forces the team to prove the exact branch intended for merge, with inspectable evidence, instead of relying on local smoke output or direct pushes to `main`.

## CTO Verdict

Keep the cockpit smoke gate in the protected PR route and require artifact review before merge.

Do not split the check, add more required statuses, or expand into full gameplay E2E until deterministic hooks exist. The current architecture is intentionally boring: one protected context, one browser smoke, one artifact, and a small rollback surface. That is the right shape for this release cycle.
