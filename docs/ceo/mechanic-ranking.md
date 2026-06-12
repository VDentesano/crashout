# Mechanic Pivot — CEO Ranking & Decision

_Bezos thinking. Two-way doors get walked through fast; one-way doors get studied. The pivot itself is a two-way door — we kept the scaffold, we spent no money, we can reverse it. So I decide fast, on the evidence the team produced, and I pick the option whose **experiment is most decisive**, not the one with the highest imagined ceiling._

**Date:** 2026-06-11 | **Decision-maker:** ceo-bezos
**Inputs:** `docs/research/mechanic-pivot-analysis.md` (existence/market), `docs/product/mechanic-retention-analysis.md` (psychology/retention), `docs/critic/mechanic-premortem.md` (inversion)

---

## The decision

**WINNER: Hypothesis B — Crash Race / Ladder Duel.** Best-of-5 rounds, cumulative scoring, **banked-points** variant (a crash forfeits only that round's gain, never banked points), **ghost/async** opponent (record-and-replay).

**This replaces the suspended zero-sum single-round mechanic. The next cycle is a BUILD cycle on the existing `projects/crashout/` scaffold.**

I am not picking by vote-counting, though the team converges on B (research and product landed on B first; the critic and I then built on those two and confirmed it — alignment, not three blind analyses). I am picking on a single decisive property, below.

## Did we consider rejecting all four? (the human's explicit mandate)

The human directed us twice to be willing to **reject all four and go off-list** — "the goal is not to pick one of four… find the RIGHT mechanic, even if it's not on this list." I engaged that honestly rather than defaulting to the menu:

- **The off-list candidate that actually exists is "B plus a genuine skill-bearing layer."** B fixes two of the original's three structural flaws (dopamine penalty, zero-sum per round) but leaves the **third unsolved**: each round is still pure chance, P(x)=1/x, with no skill wedge and no regulatory defense (critic §3, product §B). The only true off-list move is to add a real skill layer (timing-skill, a reaction beat, an information edge) so the mechanic is *predominantly skill*.
- **I deferred it deliberately, and the reason is structural, not lazy:** flaw #3 only *bites at the gated Phase 2* (real money → gambling-vs-skill matters). In the play-money phase there is **no consideration → not gambling regardless of skill content** (CFO cycle-2, Munger veto #2). Adding a skill layer now would (a) cost build time on an experiment whose only job is to test the *retention* cure, (b) risk confounding the retention read with a second new variable, and (c) tempt exactly the "skill" marketing framing Munger vetoed. **So the right sequence is: test B's retention cure now (play-money), and treat "add a skill layer" as the explicit Phase-2 fork if and when the gate passes and crypto comes into view.**
- **None-of-the-above as a *rejection* (build nothing / restart from scratch) was rejected:** we have a working scaffold, a $0 reversible test, and a mechanic (B) that demonstrably repairs the wound that suspended the original. Restarting would discard that for no information gain.

So: we did consider going off-list; the off-list option is real but belongs at Phase 2; B is the right thing to *test now*. This is a deferral with a named trigger, not a failure to look beyond the four.

---

## Ranking

| Rank | Hypothesis | Verdict | One-line reason |
|---|---|---|---|
| **1** | **B — Ladder Duel** | **BUILD** | Only mechanic whose experiment is decisive whether it passes OR fails, and the only one that keeps real crash while solving the dopamine penalty. |
| 2 | C — Reaction Crash | Reject as primary | Highest raw ceiling, but the experiment teaches nothing either way (a pass = Skillz's known result; a fail = confounded by lag) and it stops being crash. |
| 3 | D — Social Prop | Fallback only | Safe, best cold-start, but concedes the entire PvP thesis — reverts to house crash with a betting skin. Keep only if the duel thesis dies. |
| 4 | A — Prediction Duel | Drop | Psychologically broken — strips the cash-out agency beat that makes crash sticky. Replaces an unfair loss with a passive, inert one. |

---

## Why B — the customer-working-backwards case

**The customer.** A player rides the rocket, decides when to cash, and feels the bail-or-greed tension — *every round, five times a duel.* When they lose round 3, the duel isn't over; they're "down but in it." When they lose the match, they understand why ("I got greedy in round 4") and they believe the rematch is winnable. That is the press release I can write honestly. I cannot write that sentence for A (passive watching), C ("I lost to lag, I think?"), or D ("I won my bet but busted my own rocket — did I win?").

**B is the only option that keeps the product a *crash* game while fixing the wound that suspended the original.** Product §B: it restores per-round wins (many small dopamine hits, like house crash), resolves the match over a *sample* (felt-success tracks outcome), and carries the strongest rematch-driver set of the four (comeback + mastery + revenge). The original mechanic let one greed-call against a human decide everything; B spreads the decision across five rounds and rewards judgment in aggregate.

**The deciding property (this is the actual reason, per Munger's inversion).** A good experiment is decisive in *both* directions. B is:
- **If B passes the gate** → we have validated branded **1v1 crash** retention — *our actual thesis*, the thing no competitor ships. Maximally informative.
- **If B fails the gate** → we learn the dopamine-penalty cure was insufficient and we fall back to D's "don't make it a duel" concession with eyes open.

Compare C: a **pass** merely re-confirms Skillz/BAAS's known reaction-PvP result while abandoning crash; a **fail** is confounded by network lag (did the mechanic fail or the packet?). An experiment that is non-decisive on *both* outcomes is not worth running, regardless of ceiling. That asymmetry — not the ranking tables — is why B wins and C loses.

---

## Why not the others (briefly, because Disagree-and-Commit needs the losers documented)

- **C (Reaction):** highest retention ceiling on paper (cleanest skill-attribution, strong mastery+revenge drivers) — and I take that seriously. Rejected as primary on three grounds the team proved: (1) the experiment is non-decisive both ways (above); (2) it stops being crash — strip the rocket cosmetic and it's BAAS's Ultimate Shot; (3) the people who built this exact rake model (BAAS, Apr 2026) **deliberately kept crash separate from skill-PvP** — choosing C picks a fight with a funded incumbent on the battlefield it chose. Distant fallback only.
- **D (Social Prop):** best cold-start (1 player + N spectators, no two-sided match) and genuinely safe — but it wins by **not being a 1v1 duel**, reverting to house crash plus a social-betting skin barely distinguishable from the live feed house crash already runs. It answers our research question ("is matched 1v1 crash more retentive?") by refusing to ask it. Kept as the fallback if B fails.
- **A (Prediction):** dropped. It removes the act of beating the rocket in order to remove the pain of losing after beating it — throwing out the engine to spare the friction. Flat tension arc, no moment-to-moment agency, and a rematch driver that collapses the instant players notice there's nothing to master.

---

## Door analysis

- **The pivot decision: two-way door.** Scaffold preserved, $0 spent, fully reversible. Decide fast — done, here.
- **The build of B: two-way door.** Play-money, free infra, a few engineering days. If the gate fails, we shelve it and try D. Reversible.
- **The ONE-way door is unchanged and stays shut:** crypto, wallets, escrow, licensing, paid acquisition. Munger's three vetoes carry over. **Nobody walks through that door until the normalized retention gate passes.** The pivot changed the mechanic; it did not unlock the one-way door.

---

## Decision & Next Action

**GO: build B (Ladder Duel) on the existing scaffold. Play-money first. Single-screen, ghost opponent, banked-points scoring, rematch button, one normalized retention metric. No gold-plating.**

The discussion phase is **closed.** Per convergence rule 3, the next cycle is a build cycle — discussion is forbidden.

**Open dependency before code:** CFO must re-baseline the gate for B's longer atomic unit (a B-rematch ≠ a single-round rematch). See `docs/cfo/mechanic-gate.md`. The pre-registered pass/fail line must be normalized to rematch-*rate* / session-time, or we will fail a working mechanic on a measurement artifact (the risk both product §7.2 and Munger flagged).

**Disagree-and-commit:** anyone who preferred C's ceiling: noted, documented above, now commit. We build B.
