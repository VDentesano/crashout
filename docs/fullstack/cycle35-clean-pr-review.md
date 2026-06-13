# Cycle 35 Fullstack Review - CI Smoke Alias PR

Role simulation: Fullstack Development Agent - DHH
Engine/model: `gpt-5.5`, reasoning effort `medium`
Date: 2026-06-13

## Review

The implementation should stay boring:

- `smoke:cockpit` remains the local one-command path.
- `smoke:cockpit:ci` directly invokes the existing smoke runner.
- GitHub Actions uses the CI alias only after `pnpm run check`.

No source code changes are needed. The smoke script already knows how to preview `dist/`; adding flags or modifying runner code would be extra surface area for no product gain.

## Acceptance

The PR is acceptable if:

- the diff has no app code changes;
- `pnpm run check` passes;
- `pnpm run smoke:cockpit:ci` passes after `check`;
- the GitHub Actions PR run produces the `cockpit-smoke` artifact.
