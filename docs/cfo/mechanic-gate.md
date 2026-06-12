# Mechanic Pivot — Re-Baselined Retention Gate for B (Ladder Duel)

_Campbell thinking. The number is the strategy — and the number has to measure the same thing across mechanics or it lies to you. The cycle-2 gate was written for a short single-round duel. B's atomic unit is a 5-round, multi-minute duel. A raw "≥3 rematches" bar would fail B for being longer, not for being worse. This doc re-baselines the gate so it tests the loop, not the clock._

**Date:** 2026-06-11 | **CFO:** cfo-campbell
**Supersedes (for B only):** the rematch-count sub-gate in `docs/cfo/cycle2-unit-economics.md` Part 2, Gate A.
**Inputs:** cycle-2 gate, `docs/product/mechanic-retention-analysis.md` §7.2 (the normalization flag), `docs/ceo/mechanic-ranking.md`.

---

## The problem with porting the cycle-2 gate verbatim

Cycle-2 Gate A = **median ≥3 rematches/session** + **≥35% rematch-click after a loss** + **D1 ≥18%**, with a **≥300 players / ≥7 days** floor.

That gate was implicitly calibrated to the *original* mechanic: a single-round duel resolving in ~15–30 seconds. Under B:

- **A B-duel is several minutes (5 rounds).** "3 rematches" under the original = ~3 × 30s ≈ 90 seconds of play. "3 rematches" under B = ~3 × 5 rounds ≈ **15+ rounds, many minutes**. Same number, wildly different demand on the player.
- **Raw rematch *count* therefore penalizes B for having a longer atomic unit** — exactly the apples-to-oranges error product flagged (§7.2). A player who plays *two* full B-duels may be more engaged than one who plays three 15-second single-rounders, yet the raw gate scores them lower.
- **Cost basis is unchanged:** still ≈ $0 (INSFORGE + Cloudflare free tiers, no real-money rails — cycle-2 Part 1 holds in full). The pivot changes *what we measure*, not *what we spend*. No escalation trigger.

**The fix: keep the thesis-critical sub-gate (post-loss rematch) exactly as strict, and replace the count-based sub-gate with two time/rate-normalized bars that mean the same thing across any mechanic.**

---

## Re-baselined Gate for B (pre-registered, set before we see data)

Two gates, **both must pass.**

### Gate A — The rematch loop (the make-or-break; tests the dopamine-penalty cure)

**A1 — Post-loss rematch rate ≥ 35%. UNCHANGED. This is the real test and it is already mechanic-agnostic.**
- Definition: of players who *lose* a completed B-duel, the share who start another duel within the session.
- Why unchanged: it's already a *rate*, not a count, so duel length doesn't distort it. And it is the entire thesis — does a player who lost a *multi-round* duel (not just one greedy round) come back? If losers don't re-queue, B's "comeback narrative" claim is false and the dopamine cure failed. **No softening of this number. 35% stays.**

**A2 — Replaces "median ≥3 rematches." Use BOTH of these (normalized, mechanic-agnostic):**
- **A2a — Median duels per session ≥ 3.** (A *duel*, not a *round* — a B-duel is the atomic competitive unit, equivalent to one original single-round duel.) This is the honest like-for-like port of "≥3 rematches": 3 *competitive resolutions* per session, regardless of how many rounds each contains.
- **A2b — Median engaged session length ≥ 8 minutes.** A time bar catches the case where duels-per-session looks low only because each B-duel is long. 3 B-duels ≈ 15 rounds ≈ ~8–12 min of active play; this bar confirms real engaged time, not just clicks. (Measure *active* time — rocket-watching + decision moments — not idle tab time.)

> **Pass A2 if EITHER A2a OR A2b clears** (not both). Rationale: the two are substitutes — a player who plays 3 full duels passes A2a; a player who plays 2 long, intense duels passes A2b. Requiring both would re-introduce the length penalty we are trying to remove. One of the two clearing = the loop is sticky on *its own* unit.

### Gate B — Day-1 retention. UNCHANGED.
- **D1 ≥ 18%.** Mechanic-agnostic already; no reason to move it. (Report D7 as a leading indicator, don't gate on it.)

### Sample floor. UNCHANGED.
- **≥ 300 players completing ≥1 duel, over ≥ 7 days.** At 300 players, the 35% post-loss rate carries a ±~5.5pp 95% CI — tight enough to act on.

---

## One new instrumentation requirement the pivot forces

B has a tuning variable that the gate must be able to *attribute to*, or a fail is uninterpretable. Per Munger's pre-mortem and product §B, the **variance-protection dial** (how much a built lead is protected from one catastrophic round) trades directly against the comeback driver. So:

- **Instrument the variance-protection setting as an experiment arm.** Pre-register ≥2 settings tested in parallel (recommend: **drop-lowest-round** vs **banked-points** — both protect a lead, differently). 
- **Decision rule:** pick the arm that maximizes **A1 (post-loss rematch rate)**, not designer taste. If neither arm clears A1, the dopamine cure failed for B regardless of tuning, and we fall back to D.

This is the one place the pivot adds a measurement requirement beyond cycle 2. It costs ~nothing (a config flag + a cohort split in the existing event log) and it prevents the most likely false-negative: killing B because we happened to ship the wrong dial setting.

---

## Phase-2 rake math — does B change it?

**No material change. The rake model is mechanic-independent** (research §Cross-Hypothesis: every viable analog rakes a peer-matched pool; the open question was always the mechanic, never the monetization). One nuance to model later:

- A B-duel settles **one matched pot per duel** (best-of-5 → single settlement), so rake-per-duel math is unchanged from cycle-2 Part 3: 5% rake, ~$0.20/duel at $2 avg stake, ~$0.50 at $5. Break-even ramen still ~200–500 settled duels/day. **Trivially small IF retention + conversion hold.**
- **Watch-item for Phase 2:** a B-duel takes longer than a single-round duel, so *duels-per-active-hour* is lower → for the same daily-duel volume you need either more concurrent players or higher stakes. This affects *volume planning*, not the per-duel unit economics. Re-model only after the gate passes and we have a real session-length number. **Not a basis for any spend now.** (Munger veto #1 unchanged.)

---

## CFO Recommendation

- **GO to build + run the B play-money experiment.** Cost ≈ $0, no escalation, decisive information (Munger confirmed B's experiment is decisive in both directions). Best option on the board.
- **The re-baselined gate above is the new contract for B.** Pre-registered, both gates required, 300-player/7-day floor. A1 (35% post-loss) and D1 (18%) are unchanged and non-negotiable; only the count sub-gate is normalized to A2a/A2b to stop penalizing B's longer unit.
- **Instrument the variance-protection dial as a pre-registered arm.** Pick the winning setting on A1, not on feel.
- **NO Phase-2 crypto spend authorized.** Unchanged. The pivot changed the mechanic, not the one-way door.
