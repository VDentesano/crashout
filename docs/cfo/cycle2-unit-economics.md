# Cycle 2 — Unit Economics & The Retention Gate: CRASHOUT

_Campbell thinking. The number is the strategy. You can't price what you haven't measured, and you can't model LTV before you have a retention curve. This doc does two honest things: (1) prove the experiment is ~free, (2) define the exact bar Phase-2 spend must clear._

**Date:** 2026-06-11 | **CFO:** cfo-campbell

---

## Part 1 — Cost to run the play-money phase (the only spend on the table)

The experiment generates **$0 revenue by design** (no consideration = no rake = not gambling). So the entire financial question is: *what does it cost to run, and is that affordable without escalation?*

| Item | Plan | Cost |
|---|---|---|
| Backend (INSFORGE) | Free tier — Postgres, auth, edge functions | **$0** until well past experiment scale |
| Hosting (Cloudflare Pages/Workers) | Free tier — static frontend + WS via Workers/Durable Objects | **$0** at low-thousands DAU |
| Domain | crashout.* — defer until/if we promote publicly | $0 now (escalate ~$10–15/yr only if we buy) |
| Real-money rails, wallets, escrow, license | **Not built this phase** | **$0** |
| **Total cash cost of the experiment** | | **≈ $0** |

**Conclusion:** The only real cost is build time. There is **no money-spend escalation trigger** to build and run the play-money MVP. We are buying a decisive piece of information for the price of a few engineering days. That is the best risk-adjusted spend available to us.

---

## Part 2 — The retention gate (pre-registered, before we see data)

Per Munger's standing veto #1, the bar must be set **now**. Two gates, both must pass:

### Gate A — The rematch loop (the make-or-break, tests the dopamine-penalty thesis)
- **Median rematches per session ≥ 3.** (A "session" = a player who completes ≥1 duel.)
- **Rematch-click rate after a LOSS ≥ 35%.** ← This is the real test. Winning and re-queuing is easy; the whole thesis is whether a player who *beat the rocket and still lost* comes back. If losers don't rematch, the zero-sum penalty is fatal and crypto cannot save it.

### Gate B — Day-1 retention
- **D1 retention ≥ 18%.** Rationale: casual mobile games average ~25% D1; gambling-adjacent loops can run higher but we have NO brand, NO real-money hook, NO marketing in this phase — pure mechanic stickiness. 18% is a deliberately *modest* bar that still proves the loop has teeth without a money incentive. Below 18% on a frictionless free game = the loop is not intrinsically sticky. (We will also report D7 as a leading indicator but not gate on it this phase.)

### Sample-size floor (so we don't fool ourselves on noise)
- **≥ 300 players completing ≥1 duel, over ≥ 7 days.** Below that, results are anecdote, not signal. With ~300 players a 35% loss-rematch rate has a ±~5.5pp 95% CI — tight enough to act on.

**If Gate A and Gate B both pass → Phase-2 (crypto) financial case opens.**
**If either fails → NO-GO on crypto; iterate the mechanic or kill.** (Munger: a fail is the market talking, not a bug.)

---

## Part 3 — Phase-2 rake math (illustrative only — DO NOT spend against this until the gate passes)

This exists to confirm there *is* a business worth gating toward, not to justify spending now.

**Model: flat 5% rake on settled pots.**
- A duel = 2 players each stake `S` → pot = `2S` → rake = `0.10S` per duel (5% of 2S).
- Revenue per duel at avg stake $2 → **$0.20/duel.** At $5 avg stake → **$0.50/duel.**

**Break-even for ramen profitability (define ramen = ~$3k/mo to cover a lean licensed operation incl. ~$15–20k/yr Anjouan license amortized + rails + infra ≈ $3k/mo all-in):**
- At $2 avg stake ($0.20 rake/duel): need **15,000 settled duels/month** = ~500/day.
- At $5 avg stake ($0.50 rake/duel): need **6,000 settled duels/month** = ~200/day.
- Sanity vs. category: Aviator does 400k *bets/minute*. 200–500 paid duels/**day** is a rounding error — **the volume bar for ramen is trivially small IF retention + conversion hold.** The risk was never "is the rake big enough"; it's "do enough people play and convert."

**The two unknowns that decide everything (and which only the gate's data begins to price):**
1. **F2P → paid conversion rate.** No public Skillz figure found (research blind spot). Until we have our own, LTV is unknowable. Model placeholder ONLY: if 5% of active players ever fund a real-money duel and a payer averages 10 duels/mo at $2 → $2.00 rake/payer/mo. Need ~1,500 payers for ramen → ~30,000 actives at 5% conversion. **This number is a guess and is explicitly NOT a basis for spend.**
2. **CAC.** Unknown for crypto-gambling players in any geo (research blind spot). LTV:CAC cannot be computed until both sides exist. **No paid acquisition until we have a measured payer LTV.**

---

## CFO Recommendation

- **GO to build + run the play-money experiment.** Cost ≈ $0, no escalation, decisive information. Best option on the board.
- **The gate (Part 2) is the contract.** Pre-registered, both gates required, 300-player/7-day floor.
- **NO Phase-2 crypto spend authorized.** The Part-3 math proves a business *can* exist at trivial volume, but LTV and CAC are both unmeasured. Real-money spend stays vetoed until: (a) gate passed, AND (b) a measured F2P→paid conversion rate from our own funnel, AND (c) a CAC read from a small paid test. Until then, every crypto dollar is a bet on two blank numbers.
