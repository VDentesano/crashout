# Cycle 36 CEO Decision — Production Smoke

Model: `gpt-5.5`, reasoning effort: `medium`

## Customer And Problem

The customer is the first real CRASHOUT player arriving from a shared link.
They do not care that `main` is green; they care that the live Pages URL works
on their device.

## Decision

Merge the green CI cleanup PR, then ship production URL smoke before backend
persistence smoke.

Rationale:

- The current launch risk is release evidence, not feature breadth.
- Production smoke closes the gap between "the bundle works in CI" and "the URL
  users open works after deploy."
- Backend persistence smoke is important, but it requires INSFORGE endpoint and
  data-contract decisions. That is a larger surface than this cycle needs.

## Result

- PR #7 was merged.
- Production was redeployed through the existing `pnpm deploy` wrapper.
- The live Pages URL passed deterministic cockpit smoke after deployment.

## Next Decision

Next cycle should add backend persistence smoke for the INSFORGE path, using a
test player and non-production-destructive assertions.
