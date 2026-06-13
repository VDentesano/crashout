# Cycle 25 — Deterministic Crashout E2E Implementation

## Scope

- Model: gpt-5.5
- Reasoning effort: medium
- Owned files:
  - `projects/crashout/src/game/useMatch.ts`
  - `projects/crashout/scripts/cockpit-smoke.mjs`
  - `docs/fullstack/cycle25-deterministic-e2e-implementation.md`

## Implementation

Added a gated browser-only E2E hook to the match state machine:

```ts
window.__CRASHOUT_E2E__.completeMatch()
```

The hook is inert unless the app is loaded with `?crashoutE2E=1` or
`localStorage.crashout.e2e = "1"`. When enabled, it writes a deterministic
five-round match into the same `MatchState`, `RoundRecord`, and `MatchResult`
shape used by normal gameplay, then moves the UI to `matchEnd`.

The cockpit smoke script now loads with `crashoutE2E=1`, waits for the hook,
calls `completeMatch()`, asserts that a five-round match result exists, waits
for `.verdict.match`, and captures an additional `*-match-end.png` artifact for
each viewport. This verifies the full-match screen without relying on random
crash points or five rounds of animation timing.

The smoke assertion now also fails if the four viewport-specific match-end
measurements are missing, do not show `RUN IT BACK`, or lack deterministic E2E
outcome/round/score evidence.

## Verification

Ran with pnpm:

```sh
pnpm run check
pnpm run smoke:cockpit
```

Both passed. The smoke measurements included `desktop-match-end`,
`tablet-match-end`, `mobile-match-end`, and `short-mobile-match-end`, each with
`rounds: 5` and a deterministic match outcome.
