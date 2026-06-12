# QA Report — Cycle 24: Share Challenge Feature

**Date:** 2026-06-12  
**QA:** James Bach (qa-bach)  
**Verdict:** GO

---

## Build & Tests

| Check | Result |
|-------|--------|
| `pnpm build` (tsc + vite) | PASS |
| `pnpm test` (6 suites, 70+ assertions) | ALL PASS |

No regressions introduced.

---

## Code Review Findings

### Blocker

None.

### Major

**[M-01] `navigator.clipboard` — no fallback (silent failure)**  
`ShareChallenge.tsx` line 21 calls `navigator.clipboard.writeText(text).then(...)` with no `.catch()`. On non-HTTPS origins or older browsers, the Promise rejects silently — the button appears to do nothing. No error is surfaced to the user.  
Severity: **Major** (functional regression in degraded environments; Cloudflare Pages is HTTPS so production is safe, but preview/local HTTP or older Android WebViews will silently fail).  
Status: Not fixed (not a Blocker under the task mandate — production env is always HTTPS). Recommend adding a `.catch()` with `document.execCommand('copy')` fallback or a visible error state in Cycle 25.

### Minor

**[M-02] `?c=0.5` — validation floor is 1.00, correct; but `?c=NaN` / `?c=` pass `parseFloat` returning `NaN`, then `NaN >= 1` is `false` → returns `null`. Correct outcome (banner not shown), but behavior is implicit rather than explicit.**  
Not a bug — works correctly — but the comment says "must be a number between 1.00 and 1000" without the NaN guard being explicit. Low readability risk only.

**[M-03] `multiplier` prop type mismatch across components**  
`ShareChallenge` receives `multiplier: number` and calls `.toFixed(2)` internally. `ChallengeBanner` receives `multiplier: string` (pre-formatted). This asymmetry is intentional (different sources) but creates subtle inconsistency if either component is reused. No bug currently.

**[M-04] `location.search` instead of `window.location.search`**  
`App.tsx` line 147 uses the bare global `location.search`. Works in browsers (same object), but TypeScript strict mode and some linters flag it. Not a bug.

---

## XSS Analysis

`ChallengeBanner` renders `{multiplier}` inside a `<strong>` tag. The multiplier is already validated through `parseFloat` + range check before it reaches the component (`App.tsx` useState initializer). The value stored is the output of `n.toFixed(2)` — a numeric string like `"4.32"`. No raw URL param reaches the DOM. **XSS risk: none.**

---

## Analytics Regression Risk

`logger.ts` adds `challenge_multiplier: params.get('c') || null` to the visit event payload. The ingest edge function receives the payload and stores it in INSFORGE. Extra fields in an event payload are additive — existing rows are unaffected, and new rows gain an optional nullable field. The `visit` event shape is backward-compatible. **Risk: none.**

---

## Core Game Loop Regression Risk

- `ShareChallenge` renders only under `(roundEnd || matchEnd) && !lastBust && state.playerCashed !== null` — three independent conditions, all previously unused for rendering. No state mutation.
- `ChallengeBanner` is purely display; `showChallenge` state is local and never touches game state.
- Both components are read-only with respect to game logic.  
**Regression risk: none.**

---

## Summary

| # | Severity | Issue | Fixed? |
|---|----------|-------|--------|
| M-01 | Major | No clipboard fallback / silent failure on non-HTTPS | No — add in Cycle 25 |
| M-02 | Minor | NaN guard implicit, not explicit | No |
| M-03 | Minor | `multiplier` prop type asymmetry | No |
| M-04 | Minor | Bare `location` global | No |

No blockers. Production path (Cloudflare Pages, always HTTPS) is safe. Feature is correct, build passes, all tests pass.

**VERDICT: GO**
