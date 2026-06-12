# Cycle 11 — Issue Ranking & Cycle-12 Build Plan (CEO / Bezos)

**Author:** ceo-bezos (Jeff Bezos model) · **Mode:** ANALYSIS ONLY — final decision, no code.
**Inputs:** all 7 Cycle-11 analyses (norman, cooper, duarte, dhh, bach, hightower, munger).
**Purpose:** This memo CLOSES the analysis cycle. It ranks the 7 issues, resolves the
user-mandate-vs-traffic-first tension, and sets a SINGLE Cycle-12 build milestone.
I am the final call where the team diverges.

---

## 1. The decision, in one paragraph

The user mandated we analyze AND execute the play-test fixes — they want the game to *feel
better*. Munger inverted: this is a 0-user, $0-revenue game; the Cycle-5 blocker was
**traffic, not polish**; the play-test is n=1, and 2 of his 4 complaints (no minification,
no best practices) were **demonstrably false** — proof he reports *impressions, not
diagnoses*. **Both are right, and the reconciliation is a sequence, not a winner.** Here is
the cut: I accept Munger's empirical verification log in full and his vetoes on the
*manufactured* work — FX-4 streak and FX-5 rank/leaderboard have **zero backing state in
`src`** (verified), so they are the cosmetic 5% of unbuilt systems, not "treatments"; killed.
But I **override Munger's deferral of the cheap dopamine core.** His KEEP list pushes FX-1
(cash-burst), FX-2 (multiplier-heat), and T3 (pip tick-forward) to "conditional, only if
traffic lands on desktop." That under-ships against the user mandate AND against my own
verified facts, which bless all three as high-ROI and cheap. Those three *are* what the user
means by "feel better," they help **any** user (not just the n=1 tester), and they add zero
persistent mobile nodes. So Cycle 12 ships a **tight, time-boxed polish milestone** — the
trust/correctness fixes that are cheap regardless of who shows up, PLUS the cheap felt-impact
juice — with the one risky change (desktop reflow) gated last and made *conditional on where
the first cohort lands*. That conditionality forces the traffic question to be answered
**during** Cycle 12, so Cycle 13 is traffic, not Cycle 12.5 of more pixels. The customer of a
0-user game is **the first 100 we're about to acquire — not the n=1 tester.** That framing is
what lets us ship the cheap felt-impact fixes (they help everyone) while refusing to treat one
non-target tester's notes as a roadmap.

---

## 2. Ranked issue table

Ranked by the brief's formula: **(user-felt-impact × cheapness ÷ risk)**.

> **Formula override, stated explicitly (do not read as an error):** `verifyReveal` ranks #2
> despite *low* felt-impact (the user never sees it). It is kept high as **cheap
> trust-insurance** that gates all fairness marketing. Pure felt-impact math would bury it;
> I am promoting it deliberately because it protects the one claim that *is* the product.

| Rank | Issue | Verdict | Effort | Ship in Cycle 12? |
|---|---|---|---|---|
| 1 | **Color core** — `--muted-2`→`--muted-rd` text + Ghost cyan identity (Issue 4) | **REAL, measured** (2.43:1 fails WCAG AA; Ghost≡You at idle) | ~22 in-place edits, no DOM nodes | **YES** — highest felt-impact ÷ risk |
| 2 | **`verifyReveal` round-trip test** (QA R2) | **REAL gap** (untested verifier behind FAIR ✓) | ~30 min, additive | **YES** — trust-insurance; gates fairness marketing |
| 3 | **FX-1 cash-out micro-burst** (dopamine) | **REAL high-ROI** — rewards the loop's core verb at the moment of action | ~25 CSS + small TS trigger | **YES** |
| 4 | **FX-2 multiplier heat** (dopamine, Issue 4 focal point) | **REAL high-ROI** — makes greed visible, fixes "grey" at the ticker | ~18 CSS + threshold class | **YES** |
| 5 | **T3 pip tick-forward** (Issue 2 transitions) | **REAL, cheap** — the ladder is the permanent progress UI; T3 alone answers "some animation" | ~25 CSS, no game-logic change | **YES** |
| 6 | **ErrorBoundary** (Issue 7, dhh Rec 1) | **REAL** — one throw white-screens the tab for user #1 | ~27 lines, additive | **YES** |
| 7 | **`test` script + deploy gate** (QA R1) | **REAL silent-regression path** — tests run but aren't wired | ~1 line + gate | **YES** |
| 8 | **`strict: true`** (Issue 7, dhh Rec 2) | **REAL** — a removed default; code already uses `!` so blast radius ~0 | ~30 min | **YES** |
| 9 | **`_headers` immutable cache** (Issue 8, hightower 1a) | **REAL free win** — hashed assets currently `max-age=0` | ~10 min | **YES** |
| 10 | **Issue 1 mobile spacing** | **OVERSTATED** — tokens are healthy; real pressure is vertical budget | norman 2A trims, ~10–15 lines | **YES (trims only; do NOT touch spacing)** |
| 11 | **Issue 6 / Issue 1 desktop — 3-col flank reflow** | **REAL but RISKIEST** — only change that can regress working mobile | ~25–40 lines in one `@media`, Med risk | **CONDITIONAL — gated last, see §4/§5/§6** |
| — | **FX-4 streak / FX-5 rank-leaderboard** | **FALSE PREMISE** — zero streak/rank/tier/leaderboard state in `src` | n/a | **NO — VETOED (§3)** |
| — | **Issue 8 minify** | **FALSE PREMISE** — already minified+mangled, no sourcemap leak (verified live=dist) | 0 | **NO — closed; answer the user, build nothing** |
| — | **T1/T2/T4 transitions, FX-3 near-miss** | **REAL but SCOPE-CREEP as must-haves** | n/a | **NO — downgraded (§3, veto #4)** |
| — | **dhh component extraction, terser, manualChunks, React.memo, Redux** | **CEREMONY** — correctly rejected by dhh | 0 | **NO** |
| — | **hightower verify-dist.mjs, Pages-git, error-tracking, GH Actions, CSP/HSTS** | **deferred / disproven** | n/a | **NO this cycle (§3)** |

---

## 3. Munger's vetoes — accept or override

| # | Munger veto | My call | Reason |
|---|---|---|---|
| 1 | FX-4 streak + FX-5 rank/leaderboard | **ACCEPT** | Verified: zero `streak`/`rank`/`tier`/`leaderboard` state anywhere in `src`. These are the cosmetic 5% of unbuilt backend systems disguised as a color spec. If ranking becomes a real bet, it goes through the New-Product / CEO flow — not under a color audit. Do not build, do not spec further. |
| 2 | hightower 1b `verify-dist.mjs` build guard | **ACCEPT** | It guards against a regression (minification silently off) we *independently disproved is present*. dhh's competing answer — "do nothing to the build config" — is the correct Munger answer. Spend the 20 min on traffic. |
| 3 | hightower Tier-2/3 as this-cycle work (Pages-git 2a, error-tracking 2b, GH Actions, CSP/HSTS) | **ACCEPT** | All explicitly "before traffic," several need human account action, all guard nothing at n=0. They re-activate the cycle we actually seek traffic. (2a + 2b move to the Cycle-13 traffic-launch checklist, not Cycle 12.) |
| 4 | duarte FX-3 near-miss + cooper T1/T2/T4 **as must-haves** | **ACCEPT the downgrade — with a sharp boundary** | I accept removing T1/T2/T4/FX-3 from must-have status: answering n=1's offhand "more dopamine" with a six-effect production is the wrong *quantity*. **But this veto does NOT touch T3, FX-1, or FX-2** — those are NOT in the cut. They survive on felt-impact + user-mandate grounds (§1): they are the cheap juice the user explicitly asked for, they help any user, they add no persistent mobile nodes. The line is: ship the three highest-ROL beats (FX-1, FX-2, T3); defer the four nice-to-have beats (T1, T2, T4, FX-3) as post-traffic stretch. |

**Net:** 3 clean accepts + 1 accept-with-boundary. I do not override any Munger veto. I
*decline to extend* his veto #4 onto the three beats my own verified facts bless. That
distinction — kill the sprawl AND the manufactured work, keep the cheap juice — is the whole
reconciliation.

---

## 4. Cycle-12 build plan — ONE tight milestone

**Milestone name: "READABLE & ALIVE — the cheap-juice + trust pass."**

One milestone, built in order. Tangible output required: a verified-live deploy where the
duel reads correctly, cashing out feels rewarding, and a logic regression cannot ship green.

**Build order (strict — earlier items unblock later ones, riskiest is last):**

1. **QA R1 — `test` script + deploy gate** (~15 min). One line:
   `"test": "node src/game/logic.test.ts && node src/audio/prefs.test.ts"`, chained into the
   deploy path. Do this FIRST so every subsequent change is regression-gated. No vitest/jest.
2. **QA R2 — `verifyReveal` round-trip test** (~30 min). Honest round = true; tampered
   serverSeed = false; tampered crashPoint = false. **This gates all fairness marketing.**
3. **dhh Rec 1 — ErrorBoundary** (~27 lines) wrapping `<App/>` in `main.tsx`. Turns a white
   screen into "reload" for user #1.
4. **dhh Rec 2 — `strict: true`** in `tsconfig.app.json`; fix the 0–3 sites it surfaces.
5. **duarte color core** (~22 in-place edits): `--muted-2`→`--muted-rd` in all text rules;
   give Ghost its cyan `--ghost` identity. **No DOM nodes added** — so it does not collide
   with norman's mobile declutter.
6. **hightower 1a — `_headers` immutable cache** (~10 min). Pure free win.
7. **norman 2A — mobile trims** (~10–15 lines): demote `.rule`/`.legend`/`.cryptosoon`
   behind existing state guards. **Do NOT touch spacing tokens** — inflating mobile padding
   would itself be the regression. This must land BEFORE any duarte additive element is ever
   considered for mobile (it isn't this cycle), resolving the norman-strips/duarte-adds
   conflict in norman's favor on mobile.
8. **FX-1 cash-out micro-burst** + **FX-2 multiplier heat** (duarte) and **T3 pip
   tick-forward** (cooper) — the cheap dopamine core. Build against current element positions;
   these add no persistent mobile nodes (FX-1/FX-2 are in-the-moment; T3 recolors existing
   pips). Reduced-motion guards are **non-negotiable and ship with them** (cooper flagged the
   transition-property trap: the blanket `animation:none` does NOT catch transition-driven
   props — disable them explicitly).
9. **norman 2B breakpoint scaffold + 3-col desktop flank — GATED, BUILD LAST, CONDITIONAL.**
   See §6. Only built if the first-cohort surface is desktop-heavy (decided in §5). Fully
   behind `@media (min-width:900px)` — it cannot touch the working mobile column.
10. **Verify live in-browser** (standing Cycle-8 practice — green build ≠ done). Tangible
    output = the deployed, in-browser-verified bundle.

**Forced ordering (every doc independently named it):** norman layout decision → cooper
timing + duarte look in parallel → fullstack implements → qa checks reduced-motion +
no-input-blocking. Honor it or the transitions re-anchor twice.

**Time-box:** steps 1–8 are the committed milestone (cheap, ~half a cycle of real work).
Step 9 is conditional and last. If 1–8 consume the cycle, 9 slips to post-traffic — that is
acceptable and by design.

---

## 5. The traffic question — when polish flips to traffic

**Cycle 13 is the traffic launch. Not Cycle 12.5. The trigger is explicit and binary:**

> **Trigger:** the Cycle-12 milestone (steps 1–8) ships AND is verified live in-browser.
> The instant that is true, polish is DONE and the next cycle points at **getting user #1**,
> not pixel #1.

There is **no Cycle 12.5 of more polish.** The deferred beats (T1, T2, T4, FX-3) and
hightower Tier-2/3 (Pages-git, error-tracking) do NOT re-open as their own polish cycle —
they ride along *inside* the traffic launch checklist (error-tracking especially is a
traffic-readiness item, not a polish item).

**The anti-infinity guard:** Munger is right that polish is comfortable, bounded, and
feels like progress, while traffic is uncomfortable and unbounded — and a team that keeps
choosing the comfortable bounded work optimizes itself to death. So the trigger is a *gate,
not a backlog*: once steps 1–8 are live, the question every agent must answer is "who is the
first cohort and where do they come from?" — and the desktop-flank decision (step 9) **forces
that question to be answered during Cycle 12**, not deferred again. We answer it to decide
step 9; we then act on it in Cycle 13.

---

## 6. One-way-door watch

**The single change that can regress the working product: norman's 2B desktop 3-column flank
(step 9).** Both Norman and Munger flagged it. Every other Cycle-12 item is a two-way door —
reversible, cheap, additive (color swaps, a test, an error boundary, in-the-moment FX). The
flank is the one that restructures `.arena` and could break the mobile column that *currently
works* — and the working mobile loop is the asset we cannot afford to regress.

**Guardrails on the one-way door (all three required before step 9 is built):**

1. **Hard gate:** the entire reflow lives behind `@media (min-width:900px)`. Below 900px the
   DOM and CSS are byte-for-byte the current working column (plus 2A's text demotions). The
   desktop rules *cannot* fire on a phone. Responsive (one DOM, CSS breakpoint), never
   adaptive — duplicating the single-file state wiring into Mobile/Desktop components is the
   *real* regression risk and is rejected.
2. **Conditional trigger:** build step 9 **only if** the first-cohort surface (decided per §5)
   is desktop-heavy crypto/gaming communities. If first traffic lands on mobile, the empty
   720px desktop strip is not a first-impression problem and the flank waits. Munger's
   surviving asymmetry: an arena that *looks broken on arrival* is a traffic problem, not
   gold-plating — but only on the surface where the cohort actually lands.
3. **Verification gate:** after the flank, re-verify the mobile column in-browser at ≤899px
   (visual + tab-order + the live cash-out loop) BEFORE the deploy is called done. The mobile
   loop working post-flank is the acceptance criterion. If it regresses, revert step 9 — it is
   isolated in one `@media` block precisely so revert is a one-line deletion.

The whole bet: spend Cycle 12 on the cheap, reversible, everyone-benefits fixes; treat the
single irreversible-ish change as conditional and gate it three ways; then turn the company
toward the only thing that has ever been the real blocker — **traffic.**
