# Cycle 25 QA Acceptance - Deterministic Full-Match E2E Hook

Role simulation: `qa-bach`  
Model: `gpt-5.5`, `model_reasoning_effort: medium`  
Scope: inspection of current tests, smoke scripts, and deterministic E2E hook contract. App code was not edited.

## Quality Read

Testing question: can Crashout complete a known five-round match in a browser gate without depending on timing, RNG, backend availability, or a human clicking at the perfect multiplier?

The current checking stack is useful but uneven:

- `pnpm test` covers pure game scoring, fairness reveal verification, audio preference resolution, economy deltas, history validation, and leaderboard validation.
- `pnpm run check` correctly gates lint, tests, and production build.
- `.github/workflows/crashout-ci.yml` runs `pnpm run check`, installs Playwright Chromium, runs `pnpm run smoke:cockpit`, and uploads `docs/qa/cockpit-smoke/`.
- `scripts/cockpit-smoke.mjs` owns browser smoke across desktop, tablet, mobile, and short-mobile viewports.
- The smoke script now calls `window.__CRASHOUT_E2E__.completeMatch()` and captures `*-match-end.png` artifacts plus match-end JSON.

The main QA concern is that the current hook proves the UI can display a completed deterministic match, but it does not by itself prove that a user-driven five-round journey still works. That is acceptable only if we name the contract precisely and do not overclaim it.

## Acceptance Criteria

### Hook Gating

- The hook is absent by default on a normal production page load.
- The hook appears only after the smoke runner opts in with `?crashoutE2E=1` or the documented localStorage key.
- `window.__CRASHOUT_E2E__.version` is exactly `1`.
- The exposed API stays minimal: `getState()` and `completeMatch()` only.
- No visible debug UI, cheat button, route, or admin panel is introduced.
- The smoke artifact records that E2E mode was used, so a future reader can distinguish deterministic evidence from organic gameplay evidence.

### Deterministic Match Result

- `completeMatch()` returns a state where:
  - `phase === "matchEnd"`;
  - `rounds.length === 5`;
  - each round has indexes `0..4` in order;
  - each `crashPoint >= 1`;
  - each non-null player and ghost cashout is `>= 1` and lower than that round's `crashPoint`;
  - `matchResult` is non-null;
  - `matchResult.rounds.length === 5`;
  - `matchResult.playerScore` equals `scoreMatch(rounds.map(roundScore(player)), arm)`;
  - `matchResult.ghostScore` equals `scoreMatch(rounds.map(roundScore(ghost)), arm)`;
  - `matchResult.outcome` equals `decideMatch(playerScore, ghostScore)`.
- The deterministic scenario must be stable across repeated runs on the same commit. Two back-to-back smoke runs should produce the same E2E outcome, round count, player score, and ghost score for every viewport.
- The hook must leave the app in a real renderable `matchEnd` state, not only return JSON.

### Browser Smoke Integration

- `pnpm run smoke:cockpit` must:
  - build or reuse the production build;
  - start/manage Vite preview when no URL is supplied;
  - launch Playwright Chromium itself;
  - load with E2E mode enabled;
  - wait for `window.__CRASHOUT_E2E__?.version === 1`;
  - cover `desktop`, `tablet`, `mobile`, and `short-mobile`;
  - capture `idle`, `running`, `round-end`, and `match-end` screenshots for every viewport;
  - write `measurements.json` to `docs/qa/cockpit-smoke/` or `SMOKE_OUT_DIR`;
  - fail on missing core cockpit elements in idle;
  - fail on inspected overflow/clipping findings;
  - fail if `completeMatch()` returns no `matchResult` or fewer than five rounds.
- `measurements.json` must contain exactly four `*-match-end` entries, one per viewport.
- Each match-end entry must include:
  - `e2e.outcome`;
  - `e2e.rounds === 5`;
  - `e2e.playerScore`;
  - `e2e.ghostScore`;
  - no overflow findings.
- The visible match-end screen must show a match verdict and a recoverable next action, expected as `RUN IT BACK`.

### Release Gate

- `pnpm run check` remains mandatory before browser smoke.
- CI must install Playwright Chromium before smoke.
- CI must upload the smoke artifact even when the smoke fails, unless the workflow is cancelled.
- A green CI run is not enough unless the uploaded artifact contains `measurements.json` and the expected PNG set.

## Risks

| Risk | Severity | Why It Matters | Acceptance Response |
|---|---:|---|---|
| Hook leaks into normal production usage | High | A user-accessible match-completion API would be a game integrity defect. | Require default absence, no visible UI, and explicit E2E opt-in evidence. |
| Hook bypasses real gameplay too much | High | Directly setting `matchEnd` can hide broken `ENTER DUEL`, `CASH OUT`, and `NEXT ROUND` flows. | Treat this as deterministic render/state evidence, not full user-journey proof, unless a separate click-through scenario is added. |
| Scoring drift | High | A hardcoded expected outcome can stay green while game scoring changes. | Assert scores using the same scoring helpers or compare against recomputed scores from returned rounds. |
| Timing flake | Medium | Browser smoke can fail because of waits rather than product defects. | Wait on hook/version/state predicates, not only fixed sleeps. Keep fixed waits short and diagnostic. |
| Backend side effects | Medium | Full-match smoke should not depend on live InsForge availability or mutate production-like data unexpectedly. | Deterministic hook should be local/demo-mode evidence unless a separate backend E2E contract is explicitly added. |
| Artifact drift | Medium | CI can be green while uploaded evidence is missing or stale. | Verify JSON shape and PNG count after local/CI smoke. |
| Viewport-only confidence | Medium | Chromium smoke does not prove Safari, Firefox, mobile WebView, or accessibility behavior. | Keep the gate narrow; do not present it as cross-browser certification. |

## Verification Commands

Run from `projects/crashout`:

```bash
pnpm run check
SMOKE_OUT_DIR=/tmp/crashout-deterministic-e2e pnpm run smoke:cockpit
```

Verify artifact shape:

```bash
node -e "const fs=require('fs'); const dir='/tmp/crashout-deterministic-e2e'; const d=JSON.parse(fs.readFileSync(dir+'/measurements.json','utf8')); const match=d.filter(x=>x.name.endsWith('-match-end')); console.log(JSON.stringify({measurements:d.length, matchEnds:match.length, overflow:d.reduce((n,x)=>n+(x.overflow?.length||0),0), pngs:fs.readdirSync(dir).filter(f=>f.endsWith('.png')).length, e2e:match.map(x=>x.e2e)}, null, 2)); if (match.length!==4 || match.some(x=>x.e2e?.rounds!==5) || d.some(x=>(x.overflow?.length||0)>0)) process.exit(1);"
```

Check deterministic repeatability:

```bash
rm -rf /tmp/crashout-e2e-a /tmp/crashout-e2e-b
SMOKE_OUT_DIR=/tmp/crashout-e2e-a pnpm run smoke:cockpit
SMOKE_OUT_DIR=/tmp/crashout-e2e-b pnpm run smoke:cockpit
node -e "const fs=require('fs'); const pick=p=>JSON.parse(fs.readFileSync(p+'/measurements.json','utf8')).filter(x=>x.name.endsWith('-match-end')).map(x=>[x.name,x.e2e]); const a=JSON.stringify(pick('/tmp/crashout-e2e-a')); const b=JSON.stringify(pick('/tmp/crashout-e2e-b')); console.log(a); if (a!==b) process.exit(1);"
```

Manual browser sanity check:

```bash
pnpm run build
pnpm exec vite preview --host 127.0.0.1 --port 4175 --strictPort
```

Open `http://127.0.0.1:4175/?crashoutE2E=1`, confirm the normal UI has no debug controls, then use DevTools:

```js
window.__CRASHOUT_E2E__.version
window.__CRASHOUT_E2E__.completeMatch()
```

Expected visible result: five-round match verdict, final scores, no layout breakage, and the primary action ready for rematch.

## QA Position

Conditional GO for using the deterministic hook as a cockpit smoke extension if the checks above pass.

Do not call it a full user-journey E2E gate until Playwright also drives the real five-round controls or the hook is refactored to inject deterministic inputs while the UI still performs `ENTER DUEL`, `CASH OUT`, `NEXT ROUND`, and `RUN IT BACK`.
