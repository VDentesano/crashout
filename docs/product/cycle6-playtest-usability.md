# Cycle 6 — Playtest Usability: Making Ladder Duel Legible

**Author:** product-norman (Don Norman model)
**Scope:** Minimum visible game state + first-visit experience for CRASHOUT Ladder Duel (best-of-5, play-money).
**Status:** Design spec. Verified against `src/App.tsx`, `src/game/useMatch.ts`, `src/game/ghosts.ts`, `src/game/types.ts`.

---

## 0. The core diagnosis

The human playtest says "the UI is opaque." It is opaque because **the designer's concept model and the player's mental model do not match.** The interface presents five pips and the words "BEST OF 5," which plant the model *"first to 3 rounds wins."* But the engine (`decideMatch`, ghosts.ts:90) decides the match on **cumulative points**, not rounds won. A player can win 3 pips and lose the match. Everything else in the opacity complaint flows from that one mismatch: if you don't know what you're racing toward, you can't tell if you're ahead, you can't feel a comeback, and you can't tell the rules changed under you (the experiment arms).

So the spec below has one spine: **make the real win condition — cumulative points — the loudest thing on screen, and make the pips secondary.**

---

## 1. Issue 1 — The ghost leak (highest-priority correctness fix)

### What's broken
When the rising multiplier passes the ghost's `intent`, `useMatch.ts:200` writes the exact value into `ghostCashed`, and `App.tsx:99` renders it live (e.g. "1.85×") in the GHOST panel **while the player is still in the air.** The player now sees the exact bar to beat. Bail-or-greed tension dies: there is no decision left, only an arithmetic instruction.

### Why "show CASHED, hide the number" is NOT enough
The naive fix — flip the panel to "CASHED" but hide the multiplier — still leaks. The multiplier ticker is shared and center-stage. The instant the ghost panel changes state, the player reads the live ticker and infers the bar within a tick. **The state change *is* the number.** There are two live tells, both keyed off `ghostCashed`, and both must be suppressed during `running`:
- the `roundLine` text (App.tsx:99)
- the panel `kind` class that swaps to `'cashed'` styling (App.tsx:104)

### The rule (what to show, when)

| Phase | GHOST panel round-line | GHOST panel styling |
|---|---|---|
| `running` (player in the air) | **`riding…`** — constant, never changes, no number, no state flip | neutral/idle only |
| `roundEnd` / `matchEnd` (round resolved) | reveal result: `2.05×` or `BUST` | cashed / bust styling allowed |

The ghost's live status is **frozen as "riding…" for the entire airtime.** Its real outcome is revealed only at round end — which the existing verdict already does well (`you 2.0× · GHOST 1.85×`, App.tsx:151). That reveal *is* the payoff beat. Let it land there and nowhere earlier.

### Resolving the design tension ("ghost is pre-recorded, we *could* show it")
Yes — because the ghost is an async replay, there's no real-time-integrity reason we *must* hide its live state. But "can" is not "should." The only *effect* of surfacing the ghost's live cash-out is to leak the target. There is zero gameplay upside and a total loss of tension. **Suppress it.** Pre-recorded status is exactly why we're free to choose the dramatically better option: hold the reveal for the resolution beat.

> Implementation note for fullstack-dhh: this is presentational only. `ghostLiveTarget` is already nulled on cash (useMatch.ts:200). The fix is to make the GHOST `roundLine` and `kind` ignore `ghostCashed` whenever `phase === 'running'`.

---

## 2. Issue 2 — Minimum always-visible state set

Two design failures here: (a) the pips imply the wrong win condition, and (b) the live score lies under the `drop-lowest` arm.

### 2a. Pips imply "first to 3" — they don't decide anything
Pips must be **demoted to a progress tracker** ("which round are we on, how did each go"), and the **cumulative score + gap promoted to the primary match-state readout.** A one-line, plain-language win condition must sit with the score so the model can't be misread:

> **Highest total points wins — not the most rounds.**

### 2b. The live score must be computed under the active arm
`playerLiveScore` / `ghostLiveScore` (useMatch.ts:36–37) are **raw banked sums.** Under `drop-lowest`, the final match score drops each side's worst round (`scoreMatch`, ghosts.ts:81) — so the raw running total will **not equal** the number the verdict announces. A headline number that contradicts the final result is worse than no number.

**Rule:** the always-visible score and the "who's ahead" indicator must be computed by running `scoreMatch(roundsSoFar, arm)` for each side — the *same function that decides the match* — not the raw sum.
- Edge case `n < 5` rounds played under drop-lowest: with one round played, drop-lowest drops it and shows 0 — confusing. **Until ≥2 rounds are banked, display the banked sum and don't yet apply the drop;** once the drop is active, footnote it (see "your worst round won't count" below). This keeps the live number monotonic and honest.

### 2c. The active scoring rule must be named, in plain language
The arm is currently invisible until the final verdict (App.tsx:226). It must be visible *during* play, in human words — never the internal token:

| Arm (`state.arm`) | Player-facing label | One-line explanation |
|---|---|---|
| `banked` | **Every round counts** | "Your points from all 5 rounds add up. A crash just banks 0 that round." |
| `drop-lowest` | **Worst round dropped** | "Your single worst round won't count. Crash once — you're still fine." |

### The minimum always-visible set (the "legibility floor")
Everything in this list must be on screen *during a live round*, without a click:

1. **Both sides' live cumulative score** — computed under the active arm (per 2b).
2. **The gap + who's ahead** — e.g. `YOU +1.40` / `GHOST +0.90`. A signed delta is the single most important number for the comeback feeling.
3. **Rounds remaining** — `ROUND 3/5` already exists (App.tsx:80); keep, but read it as progress, not score.
4. **Active scoring rule, named in plain language** (per 2c) — persistent, small, near the score.
5. **What a pip means** — a legend or self-evident shape: filled = won that round, hollow = lost, dot = draw, ring = current, ghost = pending. Pips are *history*, not *target*.
6. **The win condition sentence** — "Highest total points wins."

If an element isn't in this list, it can wait for a click or a resolution beat. The footer hint line (App.tsx:181) is good — keep it for verb-level coaching ("space — cash out before the crash"), not state.

---

## 3. Issue 3 — The comeback narrative (the retention driver)

A losing player needs to *feel* that the duel is not over. The honest mechanism is a **single mid-match line that names what this round would do to the gap** — but it must never present an impossible target as a goal.

### The rule: reachable → concrete; unreachable → qualitative
At round start, with `gap = ghostScoreSoFar − playerScoreSoFar` and rounds remaining `R`:

- **Behind, and the gap is catchable this round** (a plausible cash-out ≤ ~`gap + small` closes it):
  → `Cash out 2.10× to retake the lead.` (concrete, reachable target)
- **Behind, but not catchable in one round** (gap larger than a sane single cash-out):
  → `Down 4.2 — string together your best rounds.` (qualitative, still hopeful, no false target)
- **Ahead:**
  → `You're up 1.8 — protect the lead.` (loss-aversion keeps the leader engaged too)
- **Final round, behind, catchable:**
  → `Last round. Cash 1.9× or higher to steal it.` (maximum-tension framing)

> Never print "you need 6.50× this round" when the gap is unwinnable in one round — a mathematically dead goal *demotivates*; it confirms the loss instead of selling the comeback.

### Lean on drop-lowest's built-in safety net
Under `drop-lowest`, a single bust genuinely doesn't count. That is a real, true comeback message — use it the instant a player busts:
> **Worst round dropped — that crash won't count. Keep going.**
This converts the most demoralizing moment (a bust) into the arm's selling point, and it's *honest* under that arm.

---

## 4. Issue 4 — First-visit experience (first 10 seconds, no heavy tutorial)

A brand-new player must learn two ideas before round 1: **(a) cash out before the crash, (b) best total across 5 rounds wins.** No modal wall, no multi-step coach. Teach by *labeling the affordances already on screen.*

### The 10-second sequence
1. **Idle state (before ENTER DUEL):** the arena shows a flat curve and one ghosted sentence over the stage:
   > **Tap to cash out before the line crashes. Best total over 5 rounds wins the duel.**
   Two clauses = the two rules. This is the entire "tutorial."
2. **The button teaches the verb:** `ENTER DUEL` → first round, the primary button becomes `CASH OUT 1.32×` with the live number *on the button itself* (App.tsx:166 already does this). The rising number on a button that says CASH OUT is self-documenting affordance — the player learns "press this before it crashes" by watching it climb.
3. **First crash is the lesson:** if they bust round 1, the `CRASHED @ 1.80×` word (App.tsx:133) plus the dropped-round / banked-0 explanation teaches the cost. If they cash, the green `CASHED` + points landing in their score teaches the reward.
4. **First round-end verdict** shows the cumulative score panel for the first time with the win-condition line attached — so the "total points" model is taught at the exact moment it first matters, not before.

### Principle
Progressive disclosure: show the *verb* (cash out) in the first second via the live button; show the *goal* (total points) at the first round-end when score first changes. Don't explain the experiment arm, provably-fair, or pip semantics up front — surface each only when it first becomes relevant. No tutorial the player can fail.

---

## 5. Issue 5 — The FAIR chip is currently dishonest (blocks)

The chip says **FAIR** with tooltip *"Provably fair — verify the seed after the round"* (App.tsx:63). But the engine is **fully client-side** — `generateRound` runs in the browser (`useMatch.ts:215`), the "server seed" is generated locally, and there is no server commitment to verify against. **The fairness claim is presently false and the tooltip promises a verification path the backend does not back.**

This is an integrity problem, not a cosmetic one. In a (future) real-money crypto product, a false fairness claim is the single most damaging trust failure possible, and shipping the habit now normalizes it.

**Interim copy until the server commits the seed (recommended):**
- Replace `FAIR` with **`DEMO RNG`** or **`PLAY MONEY`** — honest about what it is today.
- Drop the "verify the seed" tooltip; replace with: *"Play-money demo. Provably-fair verification arrives with the live backend."*
- Keep the seed-hash code stub visible — it signals the intent — but do not label it as something a player can currently verify.

When the server commits the seed before the round and reveals it after (the real provably-fair flow), restore `FAIR` and the verify tooltip. That is the moment the chip earns its word.

---

## Prioritized: MUST-SHOW vs NICE-TO-SHOW

### MUST-SHOW (ship in Cycle 6 — these are correctness/legibility, not polish)
1. **Suppress the ghost leak** — GHOST panel frozen at "riding…" during `running`; reveal only at round end. *(Issue 1)*
2. **Live cumulative score for both sides, computed under the active arm** via `scoreMatch(roundsSoFar, arm)`. *(Issue 2b)*
3. **Signed gap + who's-ahead** indicator (e.g. `YOU +1.40`). *(Issue 2 / comeback)*
4. **Win-condition sentence:** "Highest total points wins — not the most rounds." *(fixes the pip mental-model trap, Issue 2a)*
5. **Active scoring rule named in plain language** ("Every round counts" / "Worst round dropped"), persistent during play. *(Issue 2c)*
6. **Honest FAIR chip** — relabel to DEMO RNG / PLAY MONEY until server-side seed commitment exists. *(Issue 5 — integrity blocker)*
7. **First-visit two-clause line** over the idle arena (cash-out + best-of-5 total). *(Issue 4)*

### NICE-TO-SHOW (Cycle 6+ if cheap, else next)
8. Mid-match comeback line with reachable/qualitative branching. *(Issue 3 — high retention value, but needs the gap math from #2/#3 first)*
9. "Worst round dropped — that crash won't count" toast on bust under drop-lowest. *(Issue 3)*
10. Pip legend / hover labels (win / loss / draw / current / pending).
11. Per-side score *delta animation* at round end (points flying into the total) to reinforce cause→effect feedback.

> Dependency note: #8 and #9 depend on #2 and #3 landing first (you can't write the comeback line until the live score is computed under the arm). Ship the legibility floor first, then the narrative layer.

---

## Validation plan (cheap, 5–8 players, no instrumentation needed)

Run the same human playtest protocol that surfaced these issues, with one scripted comprehension probe. After ~2 minutes of play, *pause and ask*:

1. **"Who's winning right now, and by how much?"** → tests #2/#3 (gap legibility). Target: ≥80% answer correctly within 3 seconds.
2. **"What do you have to do to win the match?"** → tests the pip-vs-points mental model (#2a). Pass = they say *total points*, not *most rounds*.
3. **"Did the rules of scoring change for you vs. a normal game?"** under the drop-lowest arm → tests #2c. Pass = they can state "my worst round is dropped."
4. **During a live round: "What's the ghost going to cash at?"** → tests #1. Pass = they *can't* tell (that's the win).
5. **First-visit, fresh player, no explanation: "What is this button doing?"** during round 1 → tests #4. Pass = "I cash out before it crashes" unprompted.

The leak fix (#1) and the pip/points fix (#2a, #4 win-condition) are the two that, if a player still fails the probe, mean we have not actually fixed the opacity. Gate Cycle 6 on probes 1, 2, and 4.
