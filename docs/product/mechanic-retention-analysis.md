# Mechanic Pivot — Psychological / Retention Analysis

**Author:** product-norman (Don Norman model) | **Date:** 2026-06-11
**Cycle:** MECHANIC PIVOT exploration
**Anchor problem:** `docs/research/cycle1-market-validation.md` §2b — the zero-sum dopamine penalty.

> **These 4 mechanics are human-proposed STARTING POINTS, not validated.** This document is a psychological model, not a green-light. Every verdict here is a hypothesis to be tested with a play-money build, per research's non-negotiable gate (§6.1: median ≥3 rematches + D1 bar).

---

## 0. The Yardstick (applied identically to all 4)

The original mechanic was suspended for the **dopamine penalty**. Precisely defined, the penalty is **not** "losing feels bad" — losing must feel bad or there are no stakes. The penalty is:

> **The decoupling of felt success from match outcome.** "I succeeded at the visible challenge and STILL lost."

In house crash, the player's mental model is clean: *beat the rocket → win.* Many winners per round, constant small dopamine hits, near-miss reinforcement. In highest-cashout-wins 1v1, the player beats the rocket — does the thing the game visibly asked — and still loses the stake to a human who went higher. The mental model ("I beat the rocket → I should win") does not match the system ("someone went higher"). That mismatch is the wound.

I score every hypothesis on **three axes**, the same way each time:

1. **Legibility of loss (the Norman spine).** When the player loses, do they *understand why*, and does the reason feel fair and recoverable? Illegible loss = churn. This is the single most discriminating criterion.
2. **Felt-success / outcome coupling.** Does the match result track what the player feels they earned? High coupling = penalty solved. Low coupling = penalty present (possibly relocated, not removed).
3. **Rematch driver** (the core retention question). I classify the *driver*, not just assert "they'd rematch." Driver durability, strongest to weakest:
   - **Revenge-against-this-human** (durable — a named rival is a retention engine)
   - **Mastery** ("I can be faster/smarter next time" — durable, self-sustaining)
   - **Comeback / unfinished business** (durable within a session)
   - **Near-miss** ("so close" — thin; works for slots, fades fast 1v1)
   - **Flat** (no driver — fatal)

**The trap I am explicitly avoiding:** checking only whether a mechanic *removes* the original penalty. Each one **introduces its own new penalty.** Removing the old wound while opening a worse one is a net loss. I hunt the new penalty in every case.

**Two constraints noted after the per-mechanic analysis (§5):** crash *identity* (a mechanic that wins retention by ceasing to be crash is changing the subject), and *liquidity* (synchronous mechanics are cold-start-brutal; §4 of research).

---

## A) Prediction Crash Duel

*Both players predict the crash multiplier pre-round; closest prediction wins the pot.*

### Emotional journey
- **Pre-round:** Lock a number (e.g. "2.4x"). A small deliberation beat — feels like skill, like a call.
- **During:** The rocket climbs. **You are a spectator.** Your bet is locked; nothing you do changes anything. You watch a number you can't influence approach or overshoot your guess.
- **Resolution:** Crash at 3.1x. You said 2.4, opponent said 5.0 — you're closer, you win. Or you said 2.4, opponent said 2.9 — they're closer, you lose by 0.5.

> **Why "it's pure luck" is NOT the argument against A.** Crash is P(x)=1/x pure RNG (§2c) — but so is house crash, the €160bn retentive baseline. House crash players *know* there's no skill and stay for years. So "luck dressed as skill" and "the driver collapses once players realize there's no skill" **cannot** be why A is broken; they'd condemn the baseline too. A's defect is something house crash has and A removes: **the agency beat.**

1. **Winning feels like:** mild vindication — "I called it." But **hollow in a way house-crash winning is not** — and the difference is the tell. House crash's win is also luck, yet it lands hard *because you chose the moment to cash out.* A's win has no chosen moment. You locked a guess and watched. The vindication has nothing you *did* attached to it.
2. **Losing feels like:** **arbitrary, and — crucially — passive.** "I was 0.5 off, they were 0.4 off." Not humiliating, not enraging — just *flat.* You didn't make a fatal greed-call; you didn't do anything at all after locking the number. There is no decision to regret, which sounds gentle but is actually the problem: **regret requires agency, and dopamine rides on agency.**
3. **Why rematch?** The driver is **near-miss with nothing to attach it to.** Near-miss is *not* weak — variable-ratio + near-miss is the most retentive engine in the category (it's the slot/house-crash engine). The problem is that in house crash the near-miss attaches to **an agency moment** ("I should've cashed at 2x, I'll bail earlier next time"). In A there is **no agency beat for the near-miss to grab onto** — "I'll guess better next time" is empty because there's nothing that makes a guess better. The near-miss fires once and finds nothing to hold. No revenge engine (you both lost to RNG, not to each other). No mastery moment.
4. **vs original — dopamine penalty:** **Different penalty, arguably no better.** It *technically* removes "I beat the rocket and still lost" — but only by **removing the act of beating the rocket entirely.** There is no cash-out tension, no agency moment, no climbing-the-rocket thrill. It replaces an *unfair* loss with a *passive, agency-free* one. Legibility of loss is high in form ("they were closer") but the loss is **inert** — nothing the player did, nothing they'll do differently.

### Verdict on A: PSYCHOLOGICALLY BROKEN — on ONE specific ground: it removes the agency beat.
I tested A against the "is there any tension arc / agency" check, and it **fails the check.** The arc is flat: deliberate once, then watch passively. **House crash proves luck-with-agency is wildly retentive; A is luck *without* agency.** It strips out the bail-or-greed cash-out decision — the single thing that makes house crash sticky despite being pure chance — and leaves a passive guessing game. (The skill claim a regulator would test also fails — §2c — but that's a regulatory problem, not the retention defect; the retention defect is the missing cash-out decision.) **Lowest retention potential of the four.**

---

## B) Crash Race / Ladder Duel

*5 rounds, cumulative scoring. Each round you cash out for points; a crash = 0 that round. Highest 5-round total wins.*

### Emotional journey
- **Per round:** This is **real crash** — you ride the rocket, you decide when to cash, you feel the climb and the bail-or-greed tension. The core loop is preserved intact.
- **Across rounds:** A score ladder. You're up after round 2, opponent surges round 3, you trade leads. A *narrative* forms over 5 rounds.
- **Resolution:** Best aggregate over a sample of 5 wins. Variance is dampened — one unlucky crash doesn't end you.

1. **Winning feels like:** **earned.** You made good cash-out calls across 5 rounds; the aggregate rewarded judgment over a sample, not a single coin flip. Closest of the four to "I played well → I won."
2. **Losing feels like:** mostly **legible and recoverable** — "they out-cashed me over 5 rounds, I got greedy in round 4." BUT there's a sharp failure mode (see new penalty).
3. **Why rematch?** **Strongest driver set of the four.** (a) **Comeback / unfinished business** — the 5-round structure manufactures momentum swings, and a player who lost a close ladder feels the rematch is *winnable.* (b) **Mastery** — "I'll manage my cash-out timing better next time" is a real, true belief; aggregate scoring rewards judgment, so the belief is *earned*, not illusory. (c) Some **revenge-against-this-human** if opponent identity persists. This is the durable trio.
4. **vs original — dopamine penalty:** **Clearly better.** It **restores per-round winning** (you cash out and score every round = many small dopamine hits, like house crash) and resolves the match over a *sample*, so the felt-success/outcome coupling is high. The original's wound was *one* round deciding everything on a single greed-call against a human; B spreads the decision across five and rewards skill-of-judgment in aggregate.

### The NEW penalty (hunted, per the trap):
**Variance injustice on a single catastrophic round.** "I was winning by a mile for 4 rounds, then one crash at the start of round 5 zeroed me and I lost the match." If a single 0-round can erase a built lead, the player experiences a *legibility break* — felt-success (4 rounds dominant) decoupled from outcome (lost). **This is the original penalty re-entering through the back door**, just rarer. **Mitigation is mandatory and designable:** weight scoring so no single round can fully erase a lead (e.g. drop-lowest-round, or diminishing per-round caps, or "you keep banked points, a crash just forfeits *that round's* gain"). With a "banked points, crash forfeits only that round" rule, the new penalty largely closes. Secondary penalty: **5 rounds = longer session**, which intersects badly with cold-start (§4) — a 5-round synchronous duel needs two humans for longer. **Ghost/async resolves this** (record opponent's 5-round run, replay it).

**Tension in the fix (name it, don't hide it):** the banked-points fix **trades against B's own rematch driver.** The more you protect the leader from variance injustice, the less the trailing player can surge back — and "comeback / unfinished business" is the driver B leans on. Protect the leader too hard and you flatten the swings that make a rematch feel winnable. This is a **dial to tune in the prototype**, not a free fix: find the point where a built lead is *defensible but not safe.*

### Verdict on B: STRONGEST CANDIDATE. Solves the original penalty by restoring per-round wins + aggregate fairness; its own new penalty (variance injustice) is real but **tunable** via banked-points scoring — tuned against the comeback driver, not for free. Ghost-able for liquidity.

---

## C) Reaction Crash

*Rocket climbs; a symbol flashes at a random moment; first to tap wins.*

### Emotional journey
- **During:** Tense alertness — you're poised, watching for the flash. Genuine arousal.
- **Flash → tap:** A spike. Pure reflex. Win or lose decided in ~200ms.
- **Resolution:** You tapped at 180ms, they tapped at 165ms. They win.

1. **Winning feels like:** a clean, **legible, skill-attributable** spike. "I was faster." This is the single best *felt-success* moment of the four — unambiguous, embodied, earned. This is exactly why BAAS/Skillz build PvP on reaction games (§2a): reaction has *real, defensible skill.*
2. **Losing feels like:** **"I was fast and still lost by 15ms"** — and critically, **the player cannot tell if they lost to skill or to lag/ping.** This is a NEW injustice penalty and it is nasty: it's *attribution-ambiguous.* In B you know why you lost. In reaction-over-network, "did they react faster, or did my packet arrive late?" is **unanswerable to the player**, and players resolve ambiguity self-servingly → "I lost to lag." Rage-quit fuel.
3. **Why rematch?** **Mastery + revenge, both strong** — "I can be faster" is the most viscerally true rematch belief of all four (reaction *is* trainable), and "that guy beat me by a hair, run it back" is potent revenge. On driver quality alone, C's rematch engine rivals B's.
4. **vs original — dopamine penalty:** **Better on coupling, but introduces a worse structural problem.** It fully solves felt-success/outcome decoupling (fastest tap wins, legible) — *if the network is fair.* The "lag injustice" penalty replaces the old wound with one that's **harder to design away** (you can't fully fix client-side latency variance) and **more enraging** (the player blames the system, not their own greed).

### The deeper problem (crash-identity, hunted):
**C is barely a crash game.** Strip the cosmetic rocket and this is **BAAS's "Ultimate Shot" with a rocket backdrop** — a reaction duel. There is **no cash-out decision, no greed-vs-fear, no riding-the-multiplier tension** — the defining crash mechanics are gone. It "solves" retention partly by *changing the subject.* The mission is a **crash** game (`CLAUDE.md`); C wins by abandoning the genre's core verb. That's a strategic flag, not just a UX one.

### Verdict on C: HIGH raw retention potential (best skill-attribution, strong mastery+revenge drivers) BUT two serious problems — (1) **lag-injustice penalty** that is hard to design away and enraging, and (2) **it stops being crash.** Also the **most synchronous mechanic** = worst cold-start (§4): reaction needs two humans at the same *millisecond*, brutal for an empty lobby, and the hardest of the four to ghost/async (a recorded reaction time is gameable/feels fake). Ranks below B on net.

---

## D) Social Prop Crash

*Solo-vs-house crash at the core; players place side-bets on each OTHER's performance.*

### Emotional journey
- **Core:** Each player rides their OWN house-crash rocket → **inherits house crash's healthy dopamine structure** (beat your rocket → you win your round; many winners).
- **Prop layer:** On top, you bet on whether the opponent will bust before 2x, over/under their cash-out, etc.
- **Resolution:** Two separate outcomes — your own round, AND your prop bet.

1. **Winning feels like:** potentially **doubled dopamine** — you nailed your own cash-out AND read your opponent right. Two wins stacked.
2. **Losing feels like:** **mixed-signal confusion.** "I beat my rocket but lost my prop bet" — or worse, "I busted my rocket but won my prop." The two outcomes can point opposite directions, and the player gets a **muddy emotional signal** instead of a clean win/lose. This is a NEW penalty: *outcome confusion.*
3. **Why rematch?** Driver is **diffuse.** It's closer to "place another bet" (gambling-loop continuation) than to a competitive rematch. There's weak revenge (you bet *on* them, didn't beat *them*), weak mastery (reading a 1/x opponent is barely a skill — §2c). The continuation driver exists (it's a bet, bettors re-bet) but it's **thin as a competitive/rivalry loop.**
4. **vs original — dopamine penalty:** **The core is genuinely safe — because the core ISN'T the duel.** By keeping solo-vs-house at the center, D **never creates the "I beat the rocket and still lost" moment in the core loop** — your own round is house-crash, you win when you beat your rocket. The original penalty is *avoided* rather than *solved*, because D **isn't really a 1v1 duel** — it's two solo players with a betting meta-layer.

### The honest flag (crash-identity + concept-identity):
**"Is this even a duel?"** D sidesteps the dopamine penalty by **not being PvP at the core.** That's clever risk-management but it concedes the entire thesis: research's whole question was "is true matched-stake 1v1 crash more retentive than house crash?" D answers by **reverting to house crash** and bolting on a social betting skin. It's the *safest* mechanic and the *least differentiated* — it's very close to the live-social-feed layer house crash already has (§2b notes social feed lifts session 25-35% *without* being zero-sum). Liquidity-wise it's the **most forgiving** (core is house-seeded, always available; prop layer can be async/ghost).

### Verdict on D: SAFE but EVASIVE. Avoids the dopamine penalty by not being a real duel; introduces mild outcome-confusion; rematch driver is a thin "re-bet" continuation, not a rivalry engine. Best liquidity profile, weakest differentiation — it's house crash with a betting skin.

---

## 5. Cross-cutting constraints

**Crash identity (the mission is a *crash* game):**
- **B** = most crash (real cash-out tension every round). 
- **D** = is crash, but solo-vs-house, not a duel.
- **A** = strips crash's tension arc (passive watching).
- **C** = least crash (a reaction duel with a rocket backdrop).

**Liquidity / cold-start (§4 — retention is moot if the lobby is empty):**
- **D** most forgiving (house-seeded core, always available).
- **A, B** ghost-able (record & replay opponent's run) → forgiving *if* built async-first.
- **C** worst (needs two humans at the same millisecond; hardest to fake/ghost convincingly).

---

## 6. Ranking by retention potential

| Rank | Mechanic | Solves dopamine penalty? | Rematch driver | Killer caveat |
|---|---|---|---|---|
| **1** | **B — Ladder Duel** | **Yes** (restores per-round wins + aggregate fairness) | **Comeback + mastery + revenge** (durable trio) | Variance injustice — *designable away* (banked-points scoring) |
| **2** | **C — Reaction Crash** | Yes on coupling, but adds lag-injustice | **Mastery + revenge** (strong) | Lag penalty hard to fix; **stops being crash**; worst cold-start |
| **3** | **D — Social Prop** | *Avoids* it (not a real duel) | Thin "re-bet" continuation | Evasive — concedes the PvP thesis; least differentiated |
| **4** | **A — Prediction** | No (replaces unfair loss with meaningless loss) | **Flat** once the no-skill reality lands | **Psychologically broken** — flat arc, no agency, luck-as-skill |

### Reasoning for the ranking

- **B is #1** because it is the only mechanic that *solves* the original penalty on the right terms — it keeps real crash, restores the many-small-wins dopamine structure of house crash, AND resolves the match over a sample so the felt-success/outcome coupling is high. Its sole serious flaw (one catastrophic round erasing a lead) is the original penalty sneaking back in, but unlike the others' flaws it's **a scoring-design choice we control.** Best legibility-of-loss with the banked-points fix. Ghost-able for liquidity. **This is the one to prototype first.**

- **C is #2** on the strength of its rematch engine (mastery + revenge are the most durable drivers, and reaction skill is real and trainable) and its clean skill-attribution. It drops because (a) the lag-injustice penalty is **harder to design away** than B's, (b) it **abandons the crash genre**, and (c) it has the **worst cold-start** profile. High ceiling, structurally compromised.

- **D is #3** — genuinely safe, but it earns safety by **not being a 1v1 crash duel.** It reverts to house crash and adds a betting skin that's barely distinguishable from the social feed house crash already has. If the company's thesis is "branded 1v1 crash identity," D quietly abandons it. Good fallback, weak wedge.

- **A is #4 / BROKEN.** It removes the *act of beating the rocket* to remove the penalty of losing after beating it — throwing out the baby to spare the bathwater. Flat tension arc, zero moment-to-moment agency, a win that's luck dressed as skill, and a rematch driver that collapses to flat the moment players notice there's nothing to master. It also can't back the skill claim regulators would test (§2c). **Recommend dropping A from the test set** unless someone can add a genuine agency beat to it.

---

## 7. Recommended test (Norman: validate the assumption, don't assert it)

Per research's non-negotiable gate, the only thing that settles this is a **play-money build.** Recommendation:

1. **Build B first** (Ladder Duel) with **banked-points scoring** (crash forfeits only that round's gain, never banked points) and **ghost/async opponents** (record-and-replay) to neutralize cold-start.
2. **A/B the rematch driver:** primary metric = **median rematches per session (gate: ≥3)** + **D1 retention bar**, per research §6.1. Secondary: self-reported "did you understand why you lost?" (legibility-of-loss proxy — my spine criterion).
   - **Normalize the gate per mechanic — "rematch" is not the same unit across the four.** A C-rematch is ~10 seconds; a B-rematch is 5 rounds / several minutes. A flat "≥3 rematches" gate is apples-to-oranges — 3 B-rematches is a 15+ round session, so B looks artificially worse on raw count while actually delivering far more engaged time. Interpret the gate as **rematch-*rate* or session-time-normalized**, not raw rematch count, or B is penalized for having a longer atomic unit.
3. **Keep C as the #2 challenger** *if* B underperforms the gate — but only after solving (or accepting) the lag-attribution problem, and with eyes open that it's a reaction game, not a crash game.
4. **Shelve A and D** for the core test. D survives as a low-risk fallback if the duel thesis dies entirely; A needs a redesign (an agency beat) before it deserves a slot.

**One caution (Norman):** all four verdicts above are *predictions about human behavior.* I have argued them from cognitive principle, not data — and §2b itself is flagged [L — strong structural argument, not yet empirically tested]. The build is the experiment. If B's rematch loop fires below the gate, the dopamine-penalty diagnosis was right but the cure was insufficient, and we reconsider — possibly toward D's "don't make it a duel" concession.
