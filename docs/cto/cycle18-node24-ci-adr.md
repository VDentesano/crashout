# Cycle 18 CTO ADR - GitHub Actions JavaScript Action Node 24 Migration

Role simulation: CTO (`cto-vogels`) with Werner Vogels operating principles: everything fails all the time, you build it you run it, prefer boring maintained technology, and keep blast radius small.

## Decision

Upgrade the GitHub Actions JavaScript actions used by `Crashout CI` to Node 24-capable action releases in the next workflow maintenance PR. Do not rely on an environment-only runtime override as the steady state, and do not defer beyond this cycle.

This ADR is documentation only. It does not edit `.github/workflows/crashout-ci.yml`.

The current workflow already runs the product commands on Node 24 through `actions/setup-node` with `node-version: 24`. The exposed risk is different: the JavaScript actions themselves are still the older generation observed in QA as running or targeting Node.js 20:

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`
- `pnpm/action-setup@v6`

GitHub's Node 20 runner deprecation means that setting the job's project runtime to Node 24 is not enough. JavaScript action metadata and supported major versions also matter. The right architectural response is to move the workflow to maintained action majors that declare or support `node24`, then verify the existing protected CI contract still passes.

## Context

Current local evidence:

- Workflow: `.github/workflows/crashout-ci.yml`
- Required job context: `Crashout CI / Lint, test, build`
- Runner: `ubuntu-latest`
- Package manager: pnpm `11.5.1`
- App runtime: Node `24`
- Release gate: `pnpm install --frozen-lockfile`, `pnpm run check`, Playwright Chromium install, `pnpm run smoke:cockpit`, artifact upload
- QA Cycle 17 observed warnings for `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` running on Node.js 20.

Current external facts as of 2026-06-13:

- GitHub's official changelog says runners will begin moving JavaScript actions to Node 24 by default on 2026-06-16, with a temporary opt-out available, and Node 20 removal later in fall 2026.
- The same changelog recommends action maintainers update actions to Node 24 and action users update workflows to action versions that run on Node 24.
- Official action releases now show Node 24-capable major lines for at least `actions/checkout` and `actions/upload-artifact`; `actions/setup-node` also has a newer major line than the current workflow.

## Options Considered

### Option A - Upgrade Actions to Maintained Node 24-Capable Majors

Upgrade the action references in a dedicated workflow PR after checking each action's current release notes:

- Move `actions/checkout@v4` to a Node 24-capable maintained major.
- Move `actions/setup-node@v4` to a Node 24-capable maintained major while keeping `node-version: 24`.
- Move `actions/upload-artifact@v4` to a Node 24-capable maintained major.
- Keep `pnpm/action-setup` on a maintained release that supports the desired pnpm setup behavior; if it remains `@v6`, verify it is actually compatible with GitHub's Node 24 action runtime.
- Preserve `pnpm install --frozen-lockfile` and all existing pnpm commands.

This is the selected option.

Why: it removes the deprecation path instead of masking it. It keeps CI boring, keeps branch protection intact, and aligns with GitHub's stated migration path. The blast radius is small because the workflow already has one required job and the product gate does not need to change.

### Option B - Force Environment Only

Set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` in the workflow and leave all action refs unchanged.

This is useful only as a temporary compatibility probe. It can tell us whether the current action set survives the runtime switch before changing versions. It is not the steady-state decision because the action metadata still targets the old runtime, warnings may remain noisy, and the workflow continues depending on old major lines.

Operationally, this option creates a false sense of completion. The system may be executing on Node 24 while still advertising Node 20-targeting actions. That is not a clean release contract.

### Option C - Defer

Do nothing because the current CI run passed and GitHub-hosted runners will force Node 24 by default.

Reject. The date pressure is real and the failure mode lands directly in the protected merge path. If an action has a Node 24 incompatibility or requires a newer runner/action major, the team discovers it as a blocked PR instead of as a planned maintenance change. For a one-person company, small proactive maintenance is cheaper than emergency CI repair.

## Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|---|---:|---:|---|
| Upgraded action changes behavior | Required CI may fail or artifact behavior may change | Medium | Make one workflow-only PR, inspect release notes, and verify the existing protected job end to end. |
| Artifact upload semantics change | Smoke evidence may not upload or may land under a different shape | Medium | Confirm `cockpit-smoke` artifact exists and includes `measurements.json` plus screenshots after the PR run. |
| pnpm setup behavior changes | Dependency install may use the wrong pnpm version or cache path | Medium | Keep explicit pnpm `11.5.1`, `package_json_file`, and `cache_dependency_path`; verify `pnpm --version` if the workflow PR adds a diagnostic. |
| Node 24 action runtime exposes latent incompatibility | CI blocks merges | Medium | Test in a maintenance PR before product work depends on it. |
| Environment-only forcing leaves warning noise | Developers miss real warnings | High if Option B is used alone | Use force only as a probe, not as the final posture. |
| Deferral turns scheduled maintenance into an incident | Protected branch cannot merge when GitHub removes Node 20 | Medium | Complete action upgrades in Cycle 18 before adding more CI scope. |
| Self-hosted runner compatibility | Node 24 action majors can require newer runner versions | Low today | Current workflow uses GitHub-hosted `ubuntu-latest`; if self-hosted runners are introduced, pin minimum runner version in ops docs. |

## Operational Impact

The selected decision changes CI maintenance, not production runtime behavior.

Expected operational effects:

- The protected check name should remain `Crashout CI / Lint, test, build`.
- Branch protection should not need a new required status.
- Product scripts remain pnpm-only: `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm exec playwright install --with-deps chromium`, and `pnpm run smoke:cockpit`.
- No application code, package dependencies, or deploy path need to change for this decision.
- The workflow PR should be reviewed as release infrastructure, not as incidental YAML cleanup.

Runbook for the implementation PR:

1. Update only `.github/workflows/crashout-ci.yml` action references.
2. Keep the job runtime at Node `24`.
3. Do not replace pnpm with npm.
4. Run the PR through GitHub Actions.
5. Confirm the release gate, cockpit smoke, and artifact upload all pass.
6. Confirm the Node 20 JavaScript action deprecation warning is gone or reduced to known third-party action metadata.

Rollback is contained: revert the workflow action version bumps only. Do not alter branch protection, product scripts, or smoke scope unless the failure shows a real contract change that must be redesigned.

## CTO Verdict

Proceed with a dedicated workflow maintenance PR that upgrades JavaScript actions to Node 24-capable maintained releases. Do not mix this with product work.

The boring answer is the reliable one: keep the existing CI contract, keep pnpm, keep Node 24 for the app, and remove the old JavaScript action runtime dependency before GitHub's migration turns it into a merge-path failure.

Sources checked: GitHub Actions Node 20 deprecation changelog, `actions/checkout` releases, `actions/setup-node` releases, `actions/upload-artifact` releases, and pnpm CI documentation.
