# Cycle 34 Fullstack Output - Cockpit Smoke Script Review

Role simulation: Fullstack Development Agent - DHH
Engine requirement: `gpt-5.5`, reasoning effort `medium`

## Scope

Reviewed:

- `projects/crashout/package.json`
- `projects/crashout/scripts/cockpit-smoke.mjs`
- `.github/workflows/crashout-ci.yml`

No application code needs to change.

## Finding

`pnpm run check` already runs the production build before the cockpit smoke. Running the local `smoke:cockpit` script in CI repeats that build.

The smoke runner itself can already reuse an existing `dist/` build. If `dist/index.html` exists, it starts Vite preview against that build; if not, it falls back to building.

## Recommendation

Keep the developer command self-contained:

```json
"smoke:cockpit": "pnpm build && pnpm run smoke:cockpit:ci"
```

Add the direct CI command:

```json
"smoke:cockpit:ci": "node scripts/cockpit-smoke.mjs"
```

Then update GitHub Actions to run `pnpm run smoke:cockpit:ci` after `pnpm run check`.

This preserves local ergonomics, avoids duplicate CI work, and does not add another smoke code path.
