# CRASHOUT — Cycle 11 Quality Audit (QA / James Bach)

**Scope:** Test coverage + quality-risk assessment. Lane: *what's untested, what's risky, what could break in front of a user.* Component structure/architecture is fullstack-dhh's lane — not duplicated here.

**Method:** Risk-based, context-driven (Bach/RST). This is a **0-user, pre-PMF, play-money** game. It does **not** need 90% coverage. The job is to find the *few* things whose failure would actually hurt a user or break a trust claim, and check whether *those* are covered. Ceremony coverage is explicitly rejected.

---

## 1. Quality-Risk Diagnosis — real risk vs. overstated complaint

The Issue-7 complaint ("no se sigue ninguna buena práctica" / "no best practices followed") is **overstated**. Verified counter-evidence:

- **Pure logic is well-tested where it matters most.** `src/game/logic.test.ts` covers the match-resolution math thoroughly — `decideOutcome`, `resolveGhost`, `roundScore`, `scoreMatch` (both arms), `decideMatch`, the crash-point distribution sanity, **and** an explicit symmetry check ("the same arm must score both sides by the same rule — else the gate denominator is biased"). That symmetry test is genuinely good QA thinking, not box-ticking.
- **The tests actually run.** `node src/game/logic.test.ts` → `ALL PASS`; `node src/audio/prefs.test.ts` → all checks pass. Node 26's native TS type-stripping executes the `.test.ts` files directly. So the brief's hypothesis ("tests exist but may not be wired to a runner") is **half right and worth correcting**: they are runnable, just not *gated*.

**The one sharp, real gap** is therefore **not** "tests can't run." It is:

> **There is no `test` script in `package.json` and no CI / pre-deploy gate.** Tests run only if a human remembers to type `node src/...test.ts`. A logic regression can ship green because `pnpm build` / `pnpm deploy` never invoke the tests. The existing tests are real assets sitting outside the door they should be guarding.

The fix is boring and cheap: a one-line `test` script chaining the existing node-runnable files, wired into the deploy path. **Do not add vitest/jest** — adding a runner dependency here would itself be the ceremony-coverage trap. The tests already run on plain Node; the gap is a *script + gate*, not a *framework*.

**Secondary real gaps** (below blocker, named honestly): the trust-critical `verifyReveal` round-trip is untested; the audio win-trumps-bust precedence is untested (and currently un-testable because it lives inside a `useEffect`); no React error boundary (a render throw = white screen).

---

## 2. Risk-Ranked Surfaces

| # | Surface | Failure impact | Tested? |
|---|---------|----------------|---------|
| 1 | `verifyReveal` / `generateRound` (`crashEngine.ts`) — provably-fair commit/reveal | **Trust-critical.** If verification silently always-passes (or always-fails), the `PROVABLY FAIR ✓` badge becomes a **lie**. The whole crypto-fairness pitch rests here. (Play money today → reputational, not financial.) | ❌ **No test references `verifyReveal` or `generateRound`.** Only `crashPointFromHash` distribution is covered. |
| 2 | `scoreMatch` + arm-correct live scores (`ghosts.ts`, `App.tsx:38-45`) — drop-lowest vs. banked; live HUD rolls through `scoreMatch`, a raw sum would *lie* under drop-lowest | High. A wrong scoreboard makes the player distrust every result; the leader/gap readout drives the whole "am I winning" feeling. | ✅ **Well covered** — both arms, the drop-lowest "drop the worst" case, all-bust=0, **and symmetry**. Strong. |
| 3 | `decideMatch` / `decideOutcome` / `resolveGhost` (`ghosts.ts`) — who wins, ghost cash logic | High. Wrong winner = broken core loop. | ✅ Covered (win/loss/draw, bust-never-wins, ghost cashes iff intent < crash). |
| 4 | `crashPointFromHash` distribution (`crashEngine.ts`) — ~1/x curve, median ≈ 2x, instant-bust | High. A skewed curve makes the game feel rigged or trivial. | ✅ 20k-sample range + median sanity. Good heuristic coverage. |
| 5 | Audio end-of-match precedence (`useGameAudio.ts:54`) — **match win must trump final-round bust** (fanfare, not crash boom) | Medium. Wrong sound on a winning-but-busted final round reads as "I lost" — confusing, undercuts the win moment. Not a hard break. | ❌ **Untested.** `prefs.test.ts` covers mute resolution only, **not** precedence. Untested *because* the decision lives in a `useEffect`, not a pure function (testability gap). |
| 6 | Phase state machine (`useMatch.ts`, 310 lines) — `idle→running→roundEnd→matchEnd`, rematch, the "`matchResult` briefly null while phase still `matchEnd`" guard | Medium. A stuck/skipped phase strands the player mid-match. The null-guard hints transitions are fiddly. | ❌ Untested. Transitions are inlined in `useState`/effects — **not a pure reducer**, so not testable as-is. Risk accepted: defer (see §3). |
| 7 | No React error boundary | **Medium-high as UX.** Any render throw = **white screen, no recovery** for the play-tester. | ❌ None exists (`grep` confirms no `componentDidCatch`/`getDerivedStateFromError`). |
| 8 | `recordGhostRun` / `loadRuns` localStorage (`ghosts.ts`) — pool persistence, length-guard, 200-cap | Low. Wrapped in try/catch, degrades to starter pool. Self-healing. | ❌ Untested — **acceptable to skip** (low impact, already defensive). |

---

## 3. Specific Recommendations (minimal, risk-prioritized)

**R1 — Wire a test gate (the sharpest fix). [must]**
- Add to `package.json`: `"test": "node src/game/logic.test.ts && node src/audio/prefs.test.ts"`.
- Run it before deploy: chain into the `deploy` script (`pnpm test && pnpm build && wrangler ...`) or a minimal CI step. This converts existing assets from "documentation" into a real regression gate.
- **No new test-runner dependency.** Plain Node already runs them. Reject vitest/jest here.

**R2 — Test `verifyReveal` round-trip (surface 1, trust-critical). [must, before any "provably fair" marketing claim]**
Add to `logic.test.ts` (it already runs on Node, `crypto.subtle` is available):
- (a) honest round: `generateRound(seed, nonce)` → `verifyReveal(proof)` === **true**.
- (b) tampered `serverSeed` → **false**.
- (c) tampered `crashPoint` → **false**.
- Why these three: a `verifyReveal` that naively returns `true` would pass a happy-path-only test while making the `FAIR ✓` badge a lie. The tamper cases are what give the test discriminating power.

**R3 — Make audio precedence testable, then test it (surface 5). [should]**
- **Handoff to fullstack-dhh** (component lane): extract the end-of-match sound decision out of the `useEffect` into a pure function, e.g. `resolveEndSound(phase, prevPhase, matchResult, bust) → 'win' | 'crash' | 'lose' | null`.
- **My test ask** (once extracted): assert `matchEnd + outcome 'win' + bust=true → 'win'` (win trumps bust — the consensus rule), plus `matchEnd + loss + bust → 'crash'`, `matchEnd + loss + no-bust → 'lose'`, `roundEnd + bust → 'crash'`.

**R4 — Add a React error boundary (surface 7). [should — UX safety net]**
- **Handoff to fullstack-dhh** (component lane): a top-level boundary rendering a "something broke — reload" fallback. Turns a white screen into a recoverable state for the play-tester. I flag the risk; the implementation is his.

**R5 — Phase machine (surface 6). [defer]**
- No test this cycle. If `useMatch` transitions get extracted to a pure reducer later (dhh's call), revisit. Logging the risk is enough now.

**Explicitly NOT recommended:** tests for `recordGhostRun`/localStorage, UI-layout assertions, component snapshot tests, coverage thresholds. Coverage-for-coverage is rejected.

---

## 4. Estimated Scope

| Item | Files | Effort | Risk of the change |
|------|-------|--------|--------------------|
| R1 test script + deploy gate | `package.json` (+ optional CI yml) | ~15 min | None |
| R2 verifyReveal tests | `src/game/logic.test.ts` (append) | ~30 min | None (additive) |
| R3 audio precedence | `useGameAudio.ts` extract (dhh) + test append | ~45 min | Low — refactor of a live path; covered by manual play-test |
| R4 error boundary | new component + mount (dhh) | ~30 min | Low |

Total ≈ **2 hours**, mostly additive. R1 + R2 are pure-QA and unblock-able now; R3 + R4 need a small dhh handoff.

---

## 5. Dependencies vs. fullstack-dhh

- **Mine (QA):** R1 (test script/gate), R2 (verifyReveal tests), and *defining what R3's test must assert*.
- **His (component structure/architecture):** R3 extraction of `resolveEndSound` to a pure function, R4 error-boundary component, and any future `useMatch` reducer extraction. I flag the risk and specify the assertions; I do not restructure his components.
- Clean seam: I own *what must be true and how we'd check it*; he owns *the shape that makes it checkable*.

---

## 6. Release-Readiness Call

**Is CRASHOUT safe to drive (play-test) traffic to? — Yes, conditionally ready. No hard defect-blocker.**

Discriminator used: *would it break in front of the Cycle-11 play-tester with no recovery, or mislead on a real stake?* Because this is **play money** (`crashEngine.ts:13` — house edge "purely cosmetic"), there is no real-money-loss stake, which removes the financial sting from the fairness gap. Core resolution math is well-tested and passing.

**The one quality risk to call out — and it is NOT a ship-blocker:** the white-screen risk (no error boundary, R4) is the only candidate hard-blocker, and it's *mitigated* by the standing manual verify-live-in-browser practice (Cycle 8 precedent) — a render throw would be caught in the play-test before any real user hits it.

**Conditions on "ready":**
1. Manual play-test passes in-browser (standing practice — green build ≠ done).
2. **R1** (test script + gate) added so logic regressions can't ship silently green.
3. **R2** (verifyReveal round-trip test) landed **before** the `PROVABLY FAIR ✓` claim appears in any marketing/landing copy — an untested verifier behind a fairness badge is a reputational liability, not a code bug.

`verifyReveal`-untested is deliberately **not** inflated to "blocker": given play money, it can't cost a user money this cycle. It's "fix this cycle, gate the marketing claim on it" — which is the honest severity.
