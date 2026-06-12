# Mechanic Pivot — Pre-Mortem & Inversion on the Top 2 (B, C)

_Munger thinking. Invert, always invert. I judge the two finalists research and product surfaced (B = Ladder Duel, C = Reaction Crash), find how each kills us, and name the safest._

**Date:** 2026-06-11 | **Critic:** critic-munger
**Inputs:** `docs/research/mechanic-pivot-analysis.md`, `docs/product/mechanic-retention-analysis.md`
**Scope:** Pre-mortem on the two finalists only. A and D are not finalists (A psychologically broken; D concedes the PvP thesis) — I do not spend a veto on either.

---

## The question I answer

Not "which mechanic is best?" — the two analyses already converged on **B**. My job is the inversion: **assume we shipped the winner and the company is dead 12 months later. What killed it?** And: **is the chosen mechanic still a cheap, reversible option, or did the pivot quietly turn it into an expensive bet?**

The good news up front: **the pivot does not change the cost structure.** B and C both build on the *existing* `projects/crashout/` scaffold, both run play-money-first, both cost ≈ $0 to test (CFO cycle-2 Part 1 still holds). So my three standing vetoes from cycle 2 carry over unchanged — no crypto spend before the gate, no "skill" framing without a skill-bearing mechanic, no synchronous-only MVP. The pivot is still an *option on the business*, not the business. I judge the option.

---

## Inversion A — How **B (Ladder Duel)** kills us

1. **The banked-points fix neuters the comeback, and the comeback was the whole point.** Product already named this tension (§B): the more you protect a leader from one catastrophic round, the less the trailing player can surge back — and "comeback / unfinished business" is B's primary rematch driver. **Failure mode: we tune for fairness, the lead becomes unloseable by round 3, the trailing player mentally quits, and a 5-round duel becomes a 3-round duel with two dead rounds.** This is the most likely way B dies and it is *not* a money risk — it's a tuning risk, surfaced for $0 by the prototype. **Mitigation: treat the variance-protection dial as the #1 prototype variable. Pre-register that we test ≥3 settings (no protection / drop-lowest / banked-points) and pick on rematch-rate, not on a designer's taste.**

2. **5 rounds is too long and the session dies of friction, not of a bad loop.** A B-duel is several minutes. On mobile, in an empty play-money lobby, that's a long time to ask of a stranger — and ghosting only half-solves it (a recorded 5-round run still takes the live player several minutes to play against). **Failure mode: the loop is fine but the session length suppresses rematch *count*, we read the raw gate as a fail, and we kill a working mechanic for a measurement artifact.** Product flagged exactly this (§7.2: a B-rematch is not the same unit as a C-rematch). **Mitigation: CFO must normalize the gate to rematch-*rate* / session-time, not raw count — see `docs/cfo/mechanic-gate.md`. If we gate B on raw "≥3 rematches" we will fail a winner.**

3. **It's still pure chance under the hood, and we talk ourselves into a skill story we can't defend.** B rewards cash-out *judgment over a sample*, which *feels* more skillful — but each round is still P(x)=1/x. **Failure mode: "aggregate rewards skill" becomes "CRASHOUT is a skill game" in the Phase-2 marketing deck, and we walk into the exact regulatory trap my cycle-2 veto #2 was built to stop.** Over 5 rounds, variance shrinks but does not become skill. **Mitigation: standing veto #2 is unchanged and now *more* dangerous, because B's "skill over a sample" framing is more seductive than raw crash. Aggregate variance reduction ≠ predominance of skill. A lawyer would not buy it. Market chance as chance.**

4. **We over-build the ladder.** Streaks, 5-round animations, leaderboards, ladder cosmetics — on an experiment whose only job is to answer one yes/no question about post-loss rematch. Cycle-2 veto on gold-plating still applies. **Mitigation: single-screen, ghost opponent, banked-points scoring, rematch button, one normalized metric. Nothing else earns its place pre-gate.**

---

## Inversion B — How **C (Reaction Crash)** kills us

1. **Lag-injustice poisons the metric and we can't tell signal from noise.** Product's sharpest finding (§C): in a reaction duel decided by ~15ms, the loser cannot distinguish "they were faster" from "my packet was late," and players resolve that ambiguity self-servingly → "I lost to lag" → rage-quit. **Failure mode: low rematch-after-loss, but we never learn whether the *mechanic* failed or the *network* did. The experiment stops being decisive — which is the one property that justified building it.** Unlike B's risks, this one is **hard to design away** (you cannot fully fix client-side latency variance) and it **corrupts the read**, not just the result.

2. **It stops being crash, so even a WIN doesn't validate the thesis.** This is the inversion that should end the debate. Suppose C *passes* the gate. What did we learn? That **a reaction duel with a rocket backdrop is retentive** — which Skillz and BAAS already proved at scale (research §C). We would have spent the experiment confirming someone else's validated model while abandoning our own genre. **A passing C is barely more informative than a failing one.** That is a terrible property for a decisive experiment.

3. **We pick a fight with funded incumbents on their home turf.** Research §C, the decisive signal: **BAAS (Apr 2026) explicitly keeps crash SEPARATE from skill-PvP** — the people who built this exact rake model *chose reaction over crash on purpose*. Choosing C means competing with a funded B2B platform at the thing it is purpose-built to sell, with crash as cosmetic. **You do not invert your way into a war with the incumbent on the one battlefield they picked.**

4. **Worst cold-start of the four and the hardest to ghost.** Reaction needs two humans at the same *millisecond*; a recorded reaction time is gameable and feels fake (product §C, §5). My cycle-2 veto #3 (no synchronous-only MVP) is hardest to honor here — which is itself a signal that C fights the constraints rather than fitting them.

---

## Which is safest?

**B is clearly safer, and the inversion makes the case more strongly than the rankings did.**

| | B — Ladder | C — Reaction |
|---|---|---|
| Worst failure mode | Tuning (comeback vs fairness) — **fixable in prototype, $0** | Lag-injustice — **corrupts the metric, hard to fix** |
| Does a PASS teach us anything? | **Yes** — validates branded 1v1 *crash* retention (our actual thesis) | **No** — validates a reaction duel Skillz already proved |
| Does a FAIL teach us anything? | Yes — dopamine cure insufficient, reconsider | Ambiguous — was it the mechanic or the network? |
| Honors cycle-2 vetoes? | Yes (ghost-able, chance-as-chance, no gold-plate) | Strains veto #3 (synchronous), weak ghosting |
| Cold-start | Forgiving if async-first | Worst of four |

The decisive asymmetry: **B's experiment is decisive in BOTH directions; C's is decisive in NEITHER.** A pass on C confirms a competitor's known result; a fail on C is confounded by lag. An experiment that cannot teach you on either outcome is not worth running, no matter how high its raw "retention ceiling." That is the inversion C cannot survive.

---

## Verdict

**NO VETO on building B (Ladder Duel) as the pivot mechanic.** It is the same cheap, reversible, decisive option I cleared in cycle 2, now pointed at a better loop. Build it on the existing scaffold, play-money first.

**Recommend AGAINST C as the primary build.** Not a veto — there is no spend to veto — but a documented warning: C's experiment is non-decisive in both directions and starts a war with the incumbent on its own ground. Keep it only as a distant fallback, and only if someone first solves the lag-attribution problem.

**My three standing vetoes carry over UNCHANGED and one gets sharper:**

1. **VETO any crypto/wallet/escrow/licensing spend until the (normalized) retention gate passes.** The pivot did not change this. The gate is the gate.
2. **VETO "skill" / "skill duel" framing in real-money marketing — now explicitly extended to B's "skill over a sample" story.** Aggregate variance reduction is not skill. This framing is *more* tempting under B and therefore *more* dangerous. Market chance as chance.
3. **VETO a synchronous-only MVP.** Ghost/async opponent mandatory. B can honor this (record-and-replay a 5-round run); that it can is part of why B wins.

**One new instruction to the build cycle:** the variance-protection dial (no-protection / drop-lowest / banked-points) is **the** experiment variable. Pre-register that we test it. Do not let a designer pick the "fun" setting by feel — pick it on post-loss rematch-rate, or B dies the tuning death described above.

**One sentence:** _Build B because its experiment teaches us the truth whether it passes or fails; refuse C because its experiment teaches us nothing either way; and do not let "skill over a sample" smuggle a chance game past a regulator._
