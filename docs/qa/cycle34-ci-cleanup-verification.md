# Cycle 34 QA Verification - CI Smoke Build Cleanup

Role simulation: `qa-bach`
Engine/model: `gpt-5.5`, reasoning effort `medium`
Date: 2026-06-13

## Testing Frame

This cleanup is a checking optimization, not a product behavior change. The risk is weakening the protected cockpit smoke gate while removing duplicate build work.

## Minimum Acceptable Diff

- Add `smoke:cockpit:ci` as `node scripts/cockpit-smoke.mjs`.
- Keep `smoke:cockpit` build-first for local use.
- Change the existing workflow smoke step to run `pnpm run smoke:cockpit:ci` after `pnpm run check`.
- Do not change `projects/crashout/scripts/cockpit-smoke.mjs`.
- Do not change app source files.
- Do not remove Playwright Chromium installation.
- Do not remove or weaken artifact upload.
- Do not split or rename the protected job in this cleanup.

## Required Evidence

Run from `projects/crashout`:

```bash
pnpm run check
pnpm exec playwright install --with-deps chromium
pnpm run smoke:cockpit:ci
```

Passing evidence:

- `pnpm run check` exits 0.
- `pnpm run smoke:cockpit:ci` exits 0.
- `docs/qa/cockpit-smoke/measurements.json` is produced.
- Measurements contain 24 records.
- Match-end records exist for desktop, tablet, mobile, and short-mobile.
- Each match-end record reports five rounds plus outcome and score metadata.
- Total measured overflow findings are 0.

## Decision Rule

GO if the implementation is limited to CI/build orchestration and both local plus GitHub Actions evidence satisfy the same smoke artifact shape.

NO-GO if product behavior, smoke semantics, branch protection semantics, or artifact semantics change.
