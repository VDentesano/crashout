# Cycle 25 CTO ADR - Deterministic Gameplay E2E Hook Boundary

Role simulation: CTO (`cto-vogels`) using model `gpt-5.5`, `model_reasoning_effort: medium`.

## Status

Accepted as the Cycle 25 architecture target. This is a documentation-only ADR; no app code was edited.

## Context

Crashout already has deterministic gameplay smoke coverage wired into the cockpit smoke path:

- `projects/crashout/src/game/useMatch.ts` exposes `window.__CRASHOUT_E2E__` when `?crashoutE2E=1` or `localStorage.crashout.e2e = "1"`.
- The hook currently offers `getState()` and `completeMatch()`.
- `projects/crashout/scripts/cockpit-smoke.mjs` loads the app with `?crashoutE2E=1`, waits for `window.__CRASHOUT_E2E__.version === 1`, calls `completeMatch()`, captures `*-match-end.png`, and records outcome, round count, and final scores in `measurements.json`.
- GitHub Actions runs `pnpm run check`, installs Playwright Chromium, then runs `pnpm run smoke:cockpit` in the protected `Crashout CI / Lint, test, build` job.

The current flow is useful release evidence, but its boundary is too permissive for the long term: `completeMatch()` sets the final match state directly. That proves the UI can render a match-end state; it does not prove the normal five-round progression contract.

## Decision

The deterministic hook boundary should sit at the **gameplay state-machine input and observation edge**, not at arbitrary DOM mutation and not as a production-visible test mode.

The stable contract should be:

1. Playwright enables hooks before app load.
2. Playwright provides a deterministic scenario: ghost run, round crash points or fair proofs, and scripted player cashout intent per round.
3. The app still advances through the real `useMatch` state machine: `idle -> running -> roundEnd -> ... -> matchEnd`.
4. Playwright clicks the real UI controls (`ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, `RUN IT BACK`) where practical.
5. The hook publishes sanitized snapshots for CI waits and assertions: phase, round index, resolved round count, scores, outcome, and visible action state.

`completeMatch()` may remain as a transitional cockpit smoke accelerator, but the architectural target is **deterministic inputs plus observable snapshots**, not a direct final-state setter.

## Required Boundary

The hook may control:

- selected ghost run;
- per-round crash proof or local demo proof;
- scripted player cashout multiplier;
- clock/timing shortcuts needed to make CI fast;
- read-only snapshot publication.

The hook must not control:

- wallet/balance mutations except through the same match-end effect path used by normal gameplay;
- leaderboard, history, events, or backend writes;
- production-visible UI;
- query parameters that look like gameplay cheats for normal users;
- arbitrary React state replacement outside the game state-machine module.

## Production Leak Rules

Nothing about deterministic E2E may become a user feature.

Hard rules:

- No visible debug button, admin panel, test route, or "test mode" copy.
- No hook activation in normal production traffic unless an explicit CI/test flag is present.
- No secret, server seed, unrevealed fair proof, backend token, or privileged endpoint may be exposed through the hook.
- No production deploy command should set an E2E build flag.
- No analytics, history, leaderboard, or balance pollution from deterministic CI runs.

The safer future implementation is a compile-time gate such as `VITE_E2E_HOOKS=1` in addition to the runtime activation flag. Runtime-only `?crashoutE2E=1` is acceptable for current smoke evidence, but it leaves a wider blast radius than necessary.

## Minimum CI-Safe Flow

The protected CI flow should validate one deterministic full-match path, not a broad matrix:

1. Build the app for smoke.
2. Start Vite preview on a local CI port.
3. Open the app with onboarding bypassed and E2E hooks enabled.
4. Start a match through the real primary action.
5. Resolve five deterministic rounds using the real progression contract.
6. Assert the final snapshot:
   - `phase === "matchEnd"`;
   - exactly `ROUNDS_PER_MATCH` resolved rounds;
   - visible verdict exists and is one of win/loss/draw;
   - visible score matches the deterministic scenario;
   - primary action returns to rematch state;
   - no console errors;
   - no layout overflow in the existing viewport set.
7. Upload screenshots and `measurements.json` as the existing cockpit artifact.

This keeps the check CI-safe: local browser only, no external service dependency, no random timing, no live backend writes, and one failure surface operators can understand.

## Failure Modes

- Hook leaks to users: users can skip gameplay or inspect hidden state. Mitigation: compile-time test flag, no visible UI, no production deploy env with hooks enabled.
- CI tests a fake path: direct `matchEnd` assignment hides broken round progression. Mitigation: drive deterministic inputs through `useMatch` and assert every round resolves.
- Randomness remains in the gate: ghost selection, RNG, or human cashout timing makes CI flaky. Mitigation: scenario-owned ghost/proofs/cashouts.
- Backend side effects pollute product data: deterministic runs create fake history or leaderboard rows. Mitigation: local/demo mode for E2E and blocked backend writes.
- Fairness semantics drift: fake proof data teaches the test the wrong contract. Mitigation: either generate coherent local proofs or mark the path clearly as demo proof, never server-fair evidence.

## Consequences

This is the boring, correct architecture for a one-person product: keep the monolith, make the core loop deterministic under test, and avoid introducing a server simulator or a second test-only gameplay engine.

Operational cost stays low: one Playwright smoke script, one artifact, one protected check name. The business value is real: CI can prove the playable loop reaches a completed match without relying on luck, timing, or a human tester.
