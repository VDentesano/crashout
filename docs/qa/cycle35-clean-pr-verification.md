# Cycle 35 QA Verification - Clean PR Scope

Role simulation: QA - James Bach
Engine/model: `gpt-5.5`, reasoning effort `medium`
Date: 2026-06-13

## Scope Check

This cycle should prove that the clean branch contains only the intended CI smoke cleanup, docs, and consensus update.

## Local Checks

Required before publishing:

```bash
pnpm run check
pnpm run smoke:cockpit:ci
```

Run from `projects/crashout`.

## Evidence To Inspect

After the smoke:

- `docs/qa/cockpit-smoke/measurements.json` exists.
- There are 24 measurement records.
- `desktop-match-end`, `tablet-match-end`, `mobile-match-end`, and `short-mobile-match-end` exist.
- Each match-end record reports five rounds.
- Total overflow findings are 0.

## CI Follow-Up

After opening the PR, verify the protected `Crashout CI / Lint, test, build` run. It must run `pnpm run smoke:cockpit:ci`, succeed, and upload the `cockpit-smoke` artifact.
