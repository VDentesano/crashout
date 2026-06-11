# Cycle 1 — CEO PR/FAQ + Concept Ranking

_Bezos thinking. Working backwards. Act at 70% info. Ramen profitability first._

---

## 1. Working-Backwards PR/FAQ

**Headline:** _"You vs. Them. One crash. Winner takes the pot."_

**Sub-headline:** A new 1v1 crypto duel where two players ride the same rocket and the one with the steel nerves — not the bigger wallet — walks away with both stakes.

**Press release (one paragraph):**
Today we launched [BRAND], the first head-to-head Crash game where you don't play against the house — you play against one real human. Both players stake the same amount and watch a single shared multiplier climb. Cash out too early and you look weak; cash out too late and you crash to zero. Highest valid cash-out wins the entire pot. Every round is provably fair and verifiable on-chain, so the only edge is your nerve. No lobby grind, no whales buying wins — just a 20-second duel, a rematch button, and a leaderboard that remembers. Matches resolve in under a minute and payouts settle instantly to your wallet.

**Top FAQ:**
- _Why is this different from existing Crash?_ House-vs-player Crash is a slot machine. This is PvP — the tension is social, and the "house edge" becomes a small rake on a zero-sum duel, which is more defensible and more honest.
- _Why would I trust it?_ Provably fair seed + on-chain escrow. You can verify every crash point.
- _How does the company make money?_ A flat rake (target 5%) on each settled pot. No need to win against players.

---

## 2. Top 3 Concept Variations (ranked)

### #1 — B: Free-to-play core loop + optional crypto stakes (cosmetic economy layer)
- **Wedge:** Anyone can duel for free (play-money / ladder points); crypto stakes are an opt-in upgrade once they're hooked. Cosmetics + leaderboards monetize the top of funnel.
- **Who it's for:** Competitive gamers + crypto-curious players who want the thrill without immediately risking money. Wide top of funnel.
- **Why it wins:** Solves the cold-start + liquidity problem (you need bodies to match against). Free players create the matchmaking pool that makes paid duels instant. Regulatory softer landing — gambling is opt-in, not the front door.
- **Biggest risk:** Free players never convert to crypto stakes; you carry CAC for non-payers. Cosmetic revenue alone won't hit ramen profitability fast.

### #2 — A: Pure crypto-bet 1v1 duels
- **Wedge:** Real money from minute one. Sharpest, simplest value prop. No fake currency.
- **Who it's for:** Existing crypto degens / Crash players already comfortable staking on-chain.
- **Why it wins:** Cleanest unit economics — rake on every match, day one revenue, no F2P overhead. Fastest path to ramen profitability if liquidity exists.
- **Biggest risk:** Cold-start liquidity. An empty PvP game is dead on arrival — no opponents, no matches, no rake. Also the hardest regulatory/wallet-friction wall on the very first screen.

### #3 — C: Tournament / bracket Crash
- **Wedge:** Scheduled bracket events — 8/16/64 players, single-elimination Crash duels, big pooled prize.
- **Who it's for:** Spectacle-seekers, streamers, prize-hunters.
- **Why it wins:** Built-in hype, shareability, and streaming moments. Higher pot sizes per event.
- **Biggest risk:** Requires critical mass to fill brackets — even worse cold-start than A. Episodic, not habit-forming; no "one more round" loop. This is a phase-2 feature, not a launch wedge.

---

## 3. Single Riskiest Assumption (kills everything if false)

**"Two real humans staking against each other is more compelling — and more retentive — than a player vs. a house RNG."**

If the PvP framing doesn't actually raise tension/retention above ordinary house-Crash, we've added matchmaking + liquidity complexity for no edge, and existing house-Crash products (with their built-in liquidity) crush us. Everything — the wedge, the rake model, the moat — rests on PvP being _felt_ as better, not just described as fairer.

Secondary near-fatal risk: **liquidity / time-to-match.** Even if PvP is great, if a player waits 60s for an opponent, the magic dies.

---

## 4. Recommendation

**Recommended #1: Concept B** — free-to-play duel core with opt-in crypto stakes. It's the only variation that defuses the cold-start/liquidity bomb (the secondary fatal risk) while keeping a clean path to crypto revenue. A and C both assume liquidity we don't have yet.

**What we ship first (thinnest viable slice):**
> A single-screen, play-money 1v1 Crash duel: shared rising multiplier, two players, cash-out button, highest valid cash-out wins, instant rematch. **No crypto, no wallet, no cosmetics yet** — just prove the PvP tension is real and people hit "rematch." If that retention signal fires, bolt on on-chain escrow + rake.

_Validation gate before adding crypto: median session has ≥3 rematches and D1 retention clears a set bar. If the play-money duel isn't sticky, no amount of crypto saves it._
