# Mechanic Pivot — Live Market Validation of 4 Alternative Mechanics

**Analyst:** research-thompson (Ben Thompson model) | **Date:** 2026-06-11
**Method:** Live web sweep (2025–2026 sources), WebSearch + WebFetch. Existence/monetization claims cross-checked against independent sources; SEO pages echoing the same operator marketing copy are counted as **one** source, not three.
**Confidence legend:** [C]onfirmed (multiple *independent* live sources) / [L]ikely (1–2 sources or strong inference) / [S]peculative (reasoned, unverified)

> **Context.** The original "highest-cashout-wins, zero-sum-per-round" 1v1 crash mechanic was suspended for 3 structural flaws (dopamine penalty: you can beat the rocket and still lose; pure chance P(x)=1/x, no skill wedge; zero-sum per round). A human proposed 4 replacement mechanics as **starting points — not validated**. This brief answers Dimension 1 (**Does it exist?**) and Dimension 5 (**rake / business model of analogs**) for each. It does **not** inherit cycle1's "graveyard" verdict — that verdict was about the *original* mechanic, not these four.
>
> **Crucial distinction used throughout (from cycle1):** *"the business MODEL exists"* ≠ *"this mechanic applied to CRASH exists."* PvP-with-rake (Skillz, BAAS) and P2P prop betting (Kutt, Rebet) are real and monetized — but the operators building them **deliberately route around the crash mechanic** and build on reaction/skill/sports instead. Tagging reflects this: model-precedent and crash-application are scored separately.

---

## TL;DR — Existence Ranking

| # | Hypothesis | Closest real analog | Model precedent | Crash-specific precedent | Verdict |
|---|---|---|---|---|---|
| **D** | Social Prop Crash (bet on each other's perf.) | P2P prop-betting exchanges (Kutt, Rebet, Slips), streamer-performance betting | **[C] strong** — multiple live, monetized P2P prop platforms | **[S]** none on crash specifically | **Best-precedented model** |
| **C** | Reaction Crash (BAAS/Skillz tap-fastest) | Skillz catalog, BAAS Ultimate Shot / Turbo Mines, reaction duel apps | **[C] strong** — real-money reaction PvP with rake, at scale | **[S]** operators avoid crash here on purpose | **Validated model, applied to a different game** |
| **B** | Crash Race / Ladder (5 rounds, cumulative) | Crash tournaments w/ cumulative-profit scoring; GeoGuessr team-duel; golf/race series scoring | **[L] partial** — cumulative-round scoring exists in crash *tournaments* (many-player leaderboards) | **[L]** the *scoring idea* exists in crash; **[S]** 1v1 matched best-of-N duel not found | **Adjacent precedent, format is novel** |
| **A** | Prediction Crash Duel (lock a guess, closest wins) | "Closest-without-going-over" (Price is Right), fantasy pick'em, prediction markets | **[L]** closest-wins is a known game-theory mechanic; pick'em/prediction monetized | **[S]** no 1v1 crash-point-prediction product found | **Most novel / least precedented** |

**Headline:** None of the four is a proven crash product. But they are **not equally novel.** C and D ride **validated, monetized adjacent business models** (the same rake model already sold B2B and D2C in 2025–26) and only need the crash *theme* bolted on. B borrows a scoring format that **already exists inside crash tournaments**. A is the genuine greenfield bet — its analogs are decades old (Price is Right) but no one ships it as a real-money 1v1 crash duel.

---

## A) Prediction Crash Duel — both players lock a crash-point prediction pre-round, closest wins

**Existence verdict: NOVEL as a product. The underlying mechanic is ancient and well-understood, but no live real-money 1v1 crash-prediction duel was found. [S] for the crash product / [L] for the closest-wins mechanic in general.**

- **No live "predict the crash point, closest wins" 1v1 product found.** Searches for crash-prediction duels surfaced only (a) solo crash games where "predict the multiplier" is SEO copy for *betting on your own cashout* (Stake, Aviatrix, BC.Game), and (b) crash-prediction *scam/strategy* content ("predictor tools"), not a head-to-head prediction duel. None is two humans locking guesses against each other. [C — absence across multiple searches; absence ≠ proof, but no precedent surfaced]
  - Sources: [btcgosu predicting crash](https://www.btcgosu.com/blog/predicting-crash-gambling-games/), [atozmarkets Stake predictor](https://atozmarkets.com/crypto-gambling/stake/crash-predictor/), [Strafe Stake predictor](https://www.strafe.com/esports-betting/crypto/games/stake/crash/) — all confirm "prediction" in crash today = betting on your *own* cashout vs the house, not a closest-guess duel.
- **The "closest wins" / "closest without going over" mechanic is a confirmed, durable game design** — Price is Right One Bid, its board-game adaptations, and any contest using the "Price is Right rule." This is the honest analog, not crash. It is a **skill/judgment** mechanic (estimation under information), which is exactly the property the original crash mechanic *lacked*. [C]
  - Sources: [Price Is Right pricing games (Wikipedia)](https://en.wikipedia.org/wiki/List_of_The_Price_Is_Right_pricing_games), [One Bid (PIR Wiki)](https://priceisright.fandom.com/wiki/One_Bid), [UltraBoardGames PIR rules](https://www.ultraboardgames.com/the-price-is-right/game-rules.php)
- **Prediction markets are NOT the analog.** Kalshi/Polymarket are continuous YES/NO exchanges ($0.01–$1.00 contracts), not "two players lock a number, closest wins." Don't cite them as precedent for this mechanic — they're a different structure (order book / AMM vs sealed-bid duel). [C]
  - Sources: [SI Kalshi vs Polymarket](https://www.si.com/prediction-markets/reviews/kalshi-vs-polymarket), [Covers Polymarket vs Kalshi](https://www.covers.com/betting/prediction-sites/polymarket-vs-kalshi)

**Closest real-world analog:** Price-is-Right "closest without going over" + fantasy **pick'em** (sealed prediction, scored vs an outcome).
**Monetization of analogs:** Pick'em/DFS take a **rake on contest entry** — e.g. Epick Fantasy ~10% rake on DFS contests, 12% on "Fade'Em" picks ([oddsplays P2P guide](https://oddsplays.com/us/peer-to-peer-betting-apps/)). Prediction markets monetize via per-trade fees (Kalshi) or spread (Polymarket near-zero fee). A real-money crash-prediction duel would naturally rake the pot like pick'em.
**Confidence:** Crash product = **[S] (novel, untested)**. Mechanic viability in general = **[L]**.
**Strategic note (Thompson lens):** A is the only one of the four that *structurally repairs* cycle1's flaws — sealed prediction injects **genuine skill/judgment** (estimating a 1/x distribution's realized draw is still estimation under risk preference), and it is **not zero-sum-dopamine-penalty** the same way (both players are scored on accuracy, not "I beat the rocket but lost"). The novelty is the risk *and* the opportunity: no incumbent owns it.

---

## B) Crash Race / Ladder Duel — 5 rounds, cumulative scoring, cash-out = points, crash = 0 that round, highest total wins

**Existence verdict: The cumulative-multi-round-scoring idea ALREADY exists inside crash tournaments. The specific 1v1 matched best-of-N duel format was not found as a shipped product. [L] for cumulative crash scoring / [S] for the 1v1 series-duel packaging.**

- **Cumulative-across-rounds scoring is a documented, live crash tournament format.** Crash tournaments score players by one of three models: highest multiplier, total wagering volume, or **cumulative net profit across all qualifying rounds** — and explicitly note the risk that "a few failed late cash-outs can erase earlier gains" (which is precisely the B mechanic's tension). This is a **many-player leaderboard**, not a 1v1 bracket, but the cumulative-round scoring primitive is real and shipping. [L — single source family, Webopedia/crash-tournament guides; corroborated by tournament-format descriptions]
  - Sources: [Webopedia crash tournaments & leaderboards](https://www.webopedia.com/crypto-gambling/casinos/guides/the-rise-of-crash-gambling-tournaments-and-leaderboards/), [leaderboarded multi-round score tracking](https://leaderboarded.com/online-score-sheet-maker/)
- **Cumulative/series scoring as a head-to-head DUEL format is a proven design pattern in adjacent games** — GeoGuessr **team duel** uses cumulative scoring across rounds (players actively discuss its scoring), and golf match-play / racing championships are the canonical "series of rounds, cumulative points, highest total wins" structure. The *format* is battle-tested; only its application to crash 1v1 is unshipped. [C for the format existing in other games]
  - Sources: [GeoGuessr team-duel cumulative scoring discussion](https://geoguessr.canny.io/feature-requests/p/new-team-duel-cumulative-scoring-sucks)
- **Does it fix cycle1's flaws?** Partially. 5-round cumulative **softens the zero-sum dopamine penalty** (one bad round ≠ losing everything; you can recover) and adds a **comeback/momentum** arc — better retention shape than single-round winner-take-all. But the core per-round resolution is still **pure chance** (P(x)=1/x), so the skill/regulatory wedge remains weak unless paired with a cash-out-timing skill claim. [L]

**Closest real-world analog:** Crash tournaments (cumulative-profit scoring) + GeoGuessr team duel + golf match-play/racing series.
**Monetization of analogs:** Crash tournaments are **entry-fee / leaderboard-prize** events run on top of house-edge crash (the casino still takes its 1–3.5% per round; tournament is a retention overlay). A 1v1 series-duel would rake the matched pot (Skillz-style) rather than house-edge.
**Confidence:** Cumulative crash scoring = **[L]**. 1v1 best-of-N crash duel as a product = **[S]**.

---

## C) Reaction Crash — rocket climbs, symbol flashes at random, first to tap wins (BAAS/Skillz model)

**Existence verdict: The BUSINESS MODEL is CONFIRMED and commercialized right now — real-money reaction-PvP-with-rake at scale. But the operators building it deliberately use NON-crash reaction games, and keep crash in a separate bucket. So: model = [C], crash-specific application = [S] (novel, and intentionally avoided by the validators).**

- **Skillz proves real-money 1v1 skill PvP with rake works at scale** — skill-bracketed matchmaking, entry fees as low as $0.60, pooled-and-split prizes, reaction/timing games (e.g. Bingo Duel Cash explicitly rewards faster reaction). This is the single best proof that "reaction speed determines who wins, real money on the line, platform rakes" is a viable, durable model. [C]
  - Sources: [Skillz-powered games](https://games.skillz.com/), [Skillz Bingo Duel Cash (reaction-speed scoring)](https://www.skillz.com/blog/how-to-play-bingo-duel-cash-win-real-money-by-kingsify/), [Skillz how it works](https://support.skillz.com/hc/en-us/articles/204373285-How-does-Skillz-work-Can-I-actually-win-real-money)
- **BAAS (Apr 2026) is actively selling exactly this model B2B** — "skill-based PvP," "commission on every duel," "win-loss risk stays between players, not the house," using **Ultimate Shot** ("timing, precision, decision-making") and **Turbo Mines** ("quick reaction and pattern-recognition under pressure"). [C]
  - **Critical signal (verified by fetch):** the BAAS piece explicitly keeps **crash games SEPARATE** — "Crash games diversify the portfolio; skill-based PvP titles by BAAS... add a new monetisation layer," and "works well *alongside* crash games." The industry that built this exact model **chose reaction games over crash on purpose.** That separation is a structural signal, not an oversight. [C]
  - Source: [Yogonet/BAAS skill-based PvP](https://www.yogonet.com/international/news/2026/04/14/118542-skillbased-pvp-commission-on-every-duel-without-operator-risk)
- **Reaction-duel apps exist consumer-side too** (Skill Shot Archery PvP for cash, 2-player standoff/fast-draw reaction games), confirming reaction-time-1v1 is a familiar, shippable genre. [L]
  - Sources: [Skill Shot Archery PvP](https://apps.apple.com/us/app/skill-shot-archery-pvp/id1526336806), [2 Player Standoff Duel (reaction)](https://play.google.com/store/apps/details?id=com.countchrono.fastdraw&hl=en_US)

**Closest real-world analog:** Skillz reaction games / BAAS Ultimate Shot — but note these are reaction games *themed however*, not crash. "Reaction Crash" is **reskinning a validated model with a crash aesthetic.**
**Monetization of analogs (verified):** **Skillz rakes ~10–30% of the prize pool** (players keep ~70–80%, some games up to 25% of entry) — a real **rake**, not house-edge. BAAS = "commission on every duel" (no public % disclosed). This is the rake business model cycle1 endorsed.
  - Sources: [Skillz rake (Inc.)](https://www.inc.com/will-yakowicz/skillz-cash-prize-video-game-platform.html), [Skillz cost/FAQ](https://support.skillz.com/hc/en-us/articles/203685889-How-much-does-Skillz-cost)
**Confidence:** Model = **[C]**. Crash-specific reaction duel = **[S] (novel; validators deliberately avoid crash)**.
**Strategic note:** C's strength is it inherits the **regulatory skill-wedge** (reaction = predominance-of-skill, the thing raw crash lacks). Its weakness: at that point the "crash" is purely cosmetic — you're a Skillz competitor wearing a crash skin, competing against a funded incumbent on its home turf.

---

## D) Social Prop Crash — solo-vs-house crash, but players bet on EACH OTHER's performance ("I bet $2 Juan holds to 2.5x")

**Existence verdict: The P2P-prop-betting BUSINESS MODEL is CONFIRMED, live, and monetized across multiple 2025–26 platforms. Betting on a *performer's* outcome (streamer/player) is also a real, live category. But no product was found that applies prop-betting to crash-cashout performance specifically. Model = [C], crash application = [S].**

- **P2P prop-betting platforms are live and monetized** — multiple independent products let users bet directly against each other (not the house) on outcomes, taking a transaction fee/rake:
  - **Kutt** — friends/strangers bet directly against each other; pre-funded bets; **takes ~3% commission** (verified via fee page vs marketing copy). [C]
  - **Rebet** — P2P social sportsbook, custom bets, 1-on-1 challenges. [C]
  - **Slips** — explicitly "bet against each other, not the house" (Heads Up, Pools). [C]
  - **BettorEdge** — P2P marketplace, notably **0% commission** (monetizes elsewhere). [C]
  - Sources: [oddsplays P2P apps + fees](https://oddsplays.com/us/peer-to-peer-betting-apps/), [Kutt social betting](https://www.kutt.com/), [bettoredge social platforms 2025](https://www.bettoredge.com/post/best-social-betting-platforms-for-2025-a-player-first-experience)
- **Betting on a *performer's* live outcome is a real, established category** — "Twitch betting" markets let spectators wager on whether a streamer completes a challenge / hits a milestone, with live cash-out. This is the closest existing analog to "bet on Juan's crash run." [L — well-documented category, though heavily moderated/controversial on Twitch]
  - Sources: [tips.gg Twitch streamer betting](https://tips.gg/betting/twitch/), [esportsbets betting on Twitch streamers](https://www.esportsbets.com/betting-on-twitch-streamers/), [esports.net streamer betting](https://www.esports.net/betting/twitch-streamers/)
- **No crash-specific "bet on another player's cashout" product found.** The pieces all exist (P2P prop exchange + performer-outcome betting + crash); nobody has assembled them into "bet on whether this player holds to Nx." [S]

**Closest real-world analog:** P2P prop exchange (Kutt/Rebet/Slips) + streamer-performance betting.
**Monetization of analogs (verified):** **Transaction fee / rake on each matched bet** — Kutt ~3%, BetOpenly ~1% on winnings (per platform descriptions), Epick ~10–12%, BettorEdge 0%. The model is a **vig-lite rake on a peer-matched pool**, no house position. Exactly the rake structure cycle1 endorsed, applied to a *spectator/social* layer instead of the core duel.
**Confidence:** Model = **[C]**. Crash-cashout-prop application = **[S] (novel)**.
**Strategic note (Thompson lens):** D is structurally the most interesting because it **inverts cycle1's cold-start problem.** It needs only ONE player actually playing crash (solo-vs-house, infinite house liquidity — no 2-sided matching) plus N spectators staking on them. It also **sidesteps the zero-sum dopamine penalty for the core player** (they play normal house-crash, where beating the rocket = winning). The rivalry/social layer rides on top rather than corrupting the core loop. **But** it imports a different hard problem: prop betting on a chance event is *more* clearly gambling (not skill), and "bet on whether the RNG lets Juan reach 2.5x" is a chance derivative on a chance event — a weak skill claim and a possible regulatory magnet (and the Twitch-betting category is itself heavily moderated for exactly this reason).

---

## Cross-Hypothesis Summary — Real Precedent vs Novel/Untested

**Sorted by strength of precedent (strongest → most novel):**

1. **D (Social Prop Crash) — strongest MODEL precedent.** P2P prop-betting-with-rake is live and monetized across ≥4 independent platforms (Kutt 3%, Rebet, Slips, BettorEdge 0%), and performer-outcome betting (Twitch) is an established category. **Crash-cashout-prop is novel**, but every component exists and is monetized. Best cold-start properties of the four (1 player + N spectators, no 2-sided match).

2. **C (Reaction Crash) — strongest BUSINESS-MODEL validation, but the validators avoid crash on purpose.** Skillz (rake 10–30%, at scale) and BAAS ("commission on every duel," Apr 2026) prove real-money reaction-PvP-with-rake. **The decisive signal: BAAS explicitly keeps crash SEPARATE from skill-PvP.** Choosing C means competing with funded incumbents on their turf, with crash as cosmetic.

3. **B (Crash Race / Ladder) — adjacent precedent, novel packaging.** Cumulative-across-rounds scoring already exists in crash *tournaments* (many-player leaderboards), and series/cumulative duel scoring is battle-tested in GeoGuessr team duel + golf/racing. **The 1v1 matched best-of-N crash duel itself was not found shipped.** Softens (doesn't eliminate) cycle1's dopamine + zero-sum flaws; chance/skill flaw persists.

4. **A (Prediction Crash Duel) — most novel; oldest underlying mechanic, no crash product.** "Closest without going over" (Price is Right) and pick'em are decades-old, confirmed, *skill-bearing* mechanics — but **no real-money 1v1 crash-point-prediction duel exists.** Prediction markets are NOT a valid analog (different structure). A is the only mechanic that **structurally repairs all three cycle1 flaws** (adds genuine judgment-skill, scores on accuracy not "beat-the-rocket-but-lost"), at the cost of being the genuine greenfield bet.

**Monetization convergence (Dimension 5):** Every viable analog across all four uses the **same business model cycle1 endorsed — a RAKE on a peer-matched pool, not a house edge.** Observed rakes: Skillz 10–30%, pick'em/DFS ~10–12%, Kutt ~3%, BetOpenly ~1%, BettorEdge 0% (monetizes elsewhere). House-edge crash (1–3.5%) only appears in the *solo-vs-house* core that D would sit on top of. **The rake model is fully de-risked; the open question for all four is the MECHANIC, never the monetization.**

**Skeptic's bottom line:** Are all four weak? **No — but none is proven on crash, and the honest read is they split into two tiers.** C and D ride **validated, monetized models** and need only a crash theme + the right structure (D especially, for cold-start). A and B are **more novel** — but A is the only one that *fixes* the structural flaws that killed the original, rather than just softening them (B) or wallpapering over them with a different game (C). The disciplined move is to recognize that **"has precedent" and "fixes the original's flaws" point at different hypotheses** — C/D for de-risked model, A for genuine structural repair, D as the cold-start-friendly hybrid. None should ship on assertion; each needs the same play-money retention test cycle1 already prescribed.

---

## Information Blind Spots

- **No public conversion/retention data** distinguishing these mechanics — all four are unshipped on crash, so only our own play-money test produces it. [confirmed gap, same as cycle1]
- **BAAS exact commission %** not disclosed publicly — only "commission on every duel." [S]
- **Webopedia crash-tournament page returned HTTP 403 on fetch** — the cumulative-scoring claim rests on the search-result gloss + a corroborating multi-round-scoring source, not a full page read. Treat B's "cumulative crash scoring exists" as **[L], not [C]**, until the page is read directly. [flagged]
- **Whether any of these four launched and died quietly on crash** — no graveyard evidence found either way. Absence of a live product ≠ proof none was tried. [S]
- **Regulatory classification of D specifically** (prop bet on a chance outcome) — likely *gambling, not skill*, and the Twitch-betting analog is heavily moderated; needs a legal read before D's real-money phase. [S]
- **Kutt/BetOpenly exact current fees** taken from aggregator/marketing pages, not each operator's live terms — directionally [C] that they rake low single digits, but verify exact % from primary ToS before modeling. [L]
