# Cycle 13 — Mobile Usability Audit

**Author:** product-norman (Don Norman)
**Cycle role:** ANALYSIS ONLY. No code changes.
**Builds on:** cycle6-playtest-usability.md (game legibility), cycle11-layout-spacing.md (layout/spacing).
**Ground truth inputs:** `src/App.tsx` (375 LOC), `src/App.css` (730 LOC), client raw feedback.

---

## 1. Problem Inventory — Ranked by Impact

All problems are grounded in source code and verified against the client's stated complaints.

### Severity scale
- **P0 — Integrity blocker:** false signal or broken trust
- **P1 — Critical usability:** users cannot complete or understand a core action
- **P2 — High friction:** users can proceed but with confusion or repeated effort
- **P3 — Polish:** experiential degradation without blocking the task

---

### P0 — Header trust-signal contradiction (Fairness chip)

**Source:** `App.tsx:104–117`, `App.css:57–74`
**Norman principles violated:** Visibility (the system's true state is hidden), Signifiers (the label claims a capability the system does not have)

The PROVABLY FAIR / FAIR chip shows a server-seed hash (`state.proof.serverSeedHash.slice(0,8)`) — but when `fairMode !== 'server'`, the DEMO RNG chip is shown. The chip occupies 8-char code width, is 11px, and lives crammed into the header row alongside brand, LIVE/LOCAL chip, and three buttons. Even in the correct DEMO RNG mode, the 8-dot placeholder (`········`) signals "there is something to verify" to a curious player — and there is not. This is Cycle 6's Issue 5 (dishonest FAIR chip) persisting forward in a different form.

**The problem has two layers:**
1. The chip is too small to be read at 11px on mobile (9-char code at 10px is below the iOS/Android legibility floor of ~12px).
2. Its position in the header row — flanked by three icon-only buttons — makes it impossible for a new player to understand what it means or why it matters, even if the size were fixed.

This is the highest-priority problem not because it blocks gameplay but because it is the single biggest trust signal in a crypto-money product. A player who notices the mismatch between "PROVABLY FAIR" label and an 8-dot hash they can't verify will not trust the product with money.

---

### P1-A — Header row: 6+ interactive/informational elements in one horizontal strip

**Source:** `App.tsx:99–137`, `App.css:37–105`
**Norman principles violated:** Affordance (buttons at 30×30px are below the 44×44pt iOS minimum touch target), Mapping (utility functions—sound, help—share equal visual weight with brand identity), Visibility (all elements compete equally; nothing reads as primary)

**Current contents of `.hud-right`:**
1. PROVABLY FAIR / DEMO RNG chip (11px text, variable width)
2. LIVE / LOCAL chip (11px text)
3. Sound toggle `🔊` — `ghosttoggle` 30×30px
4. Help `?` — `ghosttoggle` 30×30px
5. Gate instrument `∑` — `ghosttoggle` 30×30px (client says: DELETE)

On a 390px-wide phone with `clamp(12px,3vw,22px)` padding (~12px each side), the usable header width is ~366px. Fitting the brand word CRASHOUT (28px bold, ~120px wide) plus 5 hud-right items with 8px gaps requires ~250px — leaving ~0px margin. On a 375px phone (SE, common) these items wrap or overflow visually.

**The 30×30px touch target is a P1 not a P3.** On a touch device where the primary verb is "tap CASH OUT before it crashes," having secondary utility buttons at 30px risks mis-taps during the high-stress cash-out moment — or worse, a user tapping mute when they meant to cash out. The iOS Human Interface Guidelines require 44×44pt minimum; Android Material requires 48×48dp. The current `.ghosttoggle` at 30×30px fails both.

---

### P1-B — "CASHED 1.01×" text lacks prominence at the decisive moment

**Source:** `App.tsx:228–233`, `App.css:421–433`
**Norman principles violated:** Feedback (the system's response to the most important action is visually undifferentiated), Signifiers (the word "CASHED" is 13px at the bottom of the stage, the same channel as a crash message)

The `.crashword` and `.crashword.safe` share the same font-size (13px) and position (`bottom: 16px`). A crash reads "CRASHED @ 1.80×" in `var(--crash)` red; a cash reads "CASHED 1.01×" in `var(--volt)` green. The color difference is correct but the SIZE difference is zero — both are 13px. 

A crash is unambiguous: the curve stops, red flash fills the screen, the ticker turns red. A successful cash-out has: a micro-burst ring animation (opacity:0 → opacity:1, 0.32s), a green `.cashword`, and the LOCKED button state. The micro-burst is the most prominent element — but it's centered on the stage and gone in 320ms. The 13px "CASHED 1.01×" word is what persists, and it is too small to read as a reward. The player cashed out because they want to know what they locked in; the confirmation should be the most legible thing on screen for at least 1–2 seconds.

---

### P1-C — Touch target failures across the board

**Source:** `App.css:93–101` (ghosttoggle 30×30px), `App.css:507–515` (primary button 20px padding — this one is fine)

The primary CASH OUT button is well-sized (full width, 20px vertical padding → ~57px tall at 17px font). The problem is every secondary control:
- `.ghosttoggle`: 30×30px — **14pt short** of iOS minimum
- `.chip` elements with `title` attributes are hover-only affordances; on touch devices the tooltip is inaccessible entirely
- `.pip` elements are 6px tall — purely visual, no tap target needed, but they are the only history indicator and have no accessible label

The 30×30px buttons sit in the header where a player's thumb during active gameplay will be swiping or tapping near the primary action area. The mis-tap cost is: accidentally toggling sound mid-round, opening the help overlay mid-round, or (if ∑ is retained) toggling the debug gate.

---

### P2-A — Visual hierarchy: secondary info (ladder, standings) equal weight to primary info (stage)

**Source:** `App.css:1–10` (grid), `App.css:107–191` (ladder section), `App.css:192–239` (matchinfo)

The `.app` grid is `grid-template-rows: auto auto auto 1fr auto`. The `1fr` correctly gives the stage the dominant row — but the three `auto` rows before it compete visually because their type sizes and spacing give them identical weight:
- `.ladder-label`: 10px, `var(--muted-rd)`
- `.standing .lead`: 12px, varies by state
- `.standing .gap`: 13px, `var(--ink)`
- `.score` in panels: 26px, `var(--ink)` — this IS appropriately large

There is no dominant "status" typeface. The player's score (26px) and the match leader indicator (12px) sit at a 2:1 ratio when the intended ratio for a game is closer to 4:1. The result is that scanning from top to bottom, the eye finds no obvious resting point before reaching the stage ticker.

**Cycle 11 established this was a vertical-budget problem, not a spacing problem.** The solution is demotion and hierarchy, not size inflation. This audit refines that diagnosis: the header region specifically needs a single dominant line that answers "what matters right now" and smaller everything else.

---

### P2-B — Sound and Help buttons belong in a secondary menu, not the header

**Source:** `App.tsx:122–135`

The client explicitly flags 🔊 and ? as misplaced in the header. From a Norman lens: these are utility functions that a user visits once (help: first visit) or occasionally (sound: personal preference). Their presence in the primary navigation bar — sharing visual real estate with the brand — violates the principle of mapping: the controls are not located near what they affect, and their prominence suggests they are core to the game loop, which they are not.

A floating action button or a single settings icon (⋯ or ☰) that expands to reveal mute + help solves this at lower visual cost. The pattern is established: mobile games universally place secondary settings behind a gear/hamburger/ellipsis rather than inline with the game state.

---

### P2-C — LIVE/LOCAL chip: meaningful signal with no recovery path

**Source:** `App.tsx:118–121`, `App.css:57–77`
**Norman principles violated:** Feedback (the signal exists but has no affordance for "what does this mean / what should I do?"), Constraints (there is nothing the user can do about LOCAL mode)

The LOCAL chip shows a red dot and the word LOCAL when the backend is down. This is honest. But it is 11px text with no tooltip on mobile (tooltips don't fire on touch). A new player sees a red dot next to the brand with no explanation of what it means for their game. It creates anxiety without resolution. The chip should either:
- Have a tap-expand that explains "No server — play money mode, your progress saves locally" and disappears, or
- Be moved out of the header entirely and placed in the provably-fair disclosure panel where its meaning is contextualized

---

### P2-D — Compact round verdict: `ROUND WON` / `ROUND LOST` undersized relative to match verdict

**Source:** `App.tsx:239–252`, `App.css:435–497`

`.vmain` is 20px for round verdicts, 24px for match verdicts. The difference is small. The round verdict (`ROUND WON`) is the most frequent resolution beat in the game — it happens 5 times per match — and it should feel like a moment, not a label. At 20px it reads the same as the standings text. The match verdict at 24px is only marginally more prominent. Both need stronger visual differentiation from ambient text: weight, size, or dedicated stage real estate.

---

### P2-E — `.roundline` "CASHED 1.01×" in the score panel is 12px, `var(--muted)`

**Source:** `App.css:335–345`

When the player cashes out, their panel's `.roundline` updates to `CASHED 1.01×` in `var(--volt)` — but the font-size is 12px. The player's total cumulative score at 26px dominates the panel, which is correct. But the round-specific action ("I cashed at X") is the thing they want to verify immediately after tapping. At 12px it is buried under the score. This is the same feedback problem as P1-B, present a second time inside the score panel.

---

### P3-A — Pip row: 6px hit targets with no accessible names

**Source:** `App.tsx:144–156`, `App.css:125–159`

The 5 pips are `<span>` elements with CSS classes but no `aria-label`. Screen readers get nothing. On mobile, they are purely decorative in the interactive sense — no tap action. But they carry match history state that a player does need to read. At 6px tall in a `flex` row, they are visually fine but close to the legibility floor on small screens with low-resolution displays.

---

### P3-B — `.hint` text is three different strings with no differentiation

**Source:** `App.tsx:278–283`

The `.hint` paragraph changes content based on game phase (running / matchEnd / else). This is correct progressive disclosure. But the text style (11px, `var(--muted-rd)`) is identical across all states, so the phase-change is invisible unless the player re-reads the line. A subtle transition or a brief fade on text change would signal "this guidance updated."

---

### P3-C — `∑` gate instrument button: DELETE

**Source:** `App.tsx:133–135`

Client explicitly requests deletion. This is a debug/developer tool that has no business being on a production screen. It is the rightmost button in the header, occupying one of the most reachable thumb positions on a right-handed user's grip. A player who taps it expecting a game action gets a floating data panel. Delete unconditionally from the production build; gate behind `import.meta.env.DEV` if retention for development is needed.

---

## 2. Mobile Information Hierarchy Redesign

### The mental model the game must support

A player holding their phone in one hand, thumb near the bottom, watching a number climb, under time pressure. Their questions in order of urgency:
1. **Right now:** Is it still running? What's the multiplier?
2. **This round:** Have I cashed? Has the ghost cashed?
3. **This match:** Who's ahead and by how much?
4. **Background:** How many rounds left? What round is this?
5. **Meta:** Is the game fair? Is sound on?

The current layout answers question 5 (chips in the header) at the same visual weight as questions 1–2 (stage). That is inverted.

### Proposed three-tier hierarchy

**Tier 1 — Primary (the live action zone, bottom 60% of screen)**
- Stage canvas with ticker: full height of the `1fr` row, no reduction
- CASH OUT button: full width, 56px+ tall, thumb zone
- Round result crashword: enlarged to 18–20px, not 13px (fixes P1-B)

**Tier 2 — Secondary (the duel status band, ~25% of screen, just above the action zone)**
- Score panels (GHOST | YOU): retain 26px score, but reduce panel padding to 8px 10px to slim the row
- Standing line (`YOU LEAD +1.40 · 2 rounds left`): keep as-is, this is already compact
- Round progress pips: retain, the 6px height is fine here since they are status, not tappable

**Tier 3 — Tertiary (ambient header, ~15% of screen, top)**
- Brand wordmark: `clamp(16px, 4.5vw, 22px)` — reduce from 20–28px to reclaim vertical budget (brand is already known after first visit)
- Single settings button (⋯ / ⚙) replacing the three ghosttoggle buttons + ∑: 44×44px minimum tap target, opens a bottom sheet
- Bottom sheet contents: sound toggle, how-to-play, provably-fair disclosure panel (see Section 3), connection status

### What gets cut from the header row

| Element | Disposition | Rationale |
|---|---|---|
| DEMO RNG / PROVABLY FAIR chip | Moved to settings bottom sheet | P0 trust issue deserves its own disclosed panel, not a cramped chip |
| LIVE / LOCAL chip | Moved to settings bottom sheet | Contextually meaningful there, not inline with brand |
| 🔊 mute toggle | Moved to settings bottom sheet | Utility, not game state |
| ? help button | Moved to settings bottom sheet | First-visit only; re-openable from settings |
| ∑ gate button | **DELETE** from production | Debug tool only |

**Net header result:** Brand wordmark + single ⋯ button. The header shrinks to ~40px tall, reclaiming ~30–40px for the stage.

### Touch target specifications

| Element | Current size | Required minimum | Recommended |
|---|---|---|---|
| Primary button (CASH OUT / NEXT / ENTER) | 100% width × ~57px | 44pt × 44pt | Keep as-is — correct |
| ghosttoggle buttons | 30×30px | 44×44pt | **Replace with 44×44px ⋯ button** |
| Settings bottom sheet items | — | 48×48dp | 52px tall list items with full-width tap area |
| Pip spans | 6px tall (no tap) | N/A | Add `aria-label="Round N: won/lost/draw/pending"` |

---

## 3. Provably-Fair Verification Experience

### The current state and why it fails

`App.tsx:104–117` shows a chip with 8 characters of a server seed hash. When `fairMode === 'server'`, a tooltip says "the server commits the seed… so you can verify." When `fairMode !== 'server'`, a DEMO RNG chip shows.

From a trust-design perspective: **the chip pattern is structurally too small for what provably-fair verification requires.** Real casino provably-fair systems (Stake, Roobet, BC.Game) work because they give the player a full disclosure flow — not a badge. The chip communicates "we are fair" (a claim); what builds trust is "here is how to verify it yourself" (a process).

The player cannot act on an 8-char hash. They need: the full hash (pre-round), the revealed seed (post-round), and a verification instruction. All three must be accessible.

### The commit → reveal → verify flow

This is the canonical provably-fair model. Every element of the chain must be visible to be meaningful:

**Before the round begins:**
- Server generates `serverSeed` (kept secret)
- Server computes `serverSeedHash = SHA256(serverSeed)` and sends to client
- Client is given a `clientSeed` (can be user-customizable for power users)
- Combined: `crashPoint = derived from HMAC-SHA256(serverSeed, clientSeed + nonce)`

**After the round resolves:**
- Server reveals `serverSeed`
- Player can now verify: `SHA256(serverSeed) === serverSeedHash` (proves the seed was not changed)
- Player can recompute: `HMAC-SHA256(serverSeed, clientSeed + nonce)` → derives the same crash point (proves the outcome was predetermined, not chosen after bets)

**The UX chain that must exist:**

```
[Chip — pre-round]        [Panel — post-round / expandable]
┌─────────────────────┐   ┌────────────────────────────────────────────────┐
│ ● PROVABLY FAIR      │→  │ ROUND #12 VERIFICATION                         │
│ Server seed hash:    │   │                                                │
│ 3f8a92c1 ▸ expand   │   │ Server seed hash (committed before round):     │
└─────────────────────┘   │ 3f8a92c1d7e4b903a2f...  [copy]                 │
                           │                                                │
                           │ Server seed (revealed after round):            │
                           │ a7f3b2...  [copy]  ✓ matches hash             │
                           │                                                │
                           │ Client seed: your-browser-seed-1234  [change] │
                           │ Nonce: 12                                      │
                           │                                                │
                           │ Crash point formula:                           │
                           │ HMAC-SHA256(serverSeed, clientSeed:nonce)      │
                           │ → result maps to 1.01× to ∞                   │
                           │                                                │
                           │ [Verify in browser console ▸]                  │
                           │ [View on Fairness Docs ▸]                      │
                           └────────────────────────────────────────────────┘
```

### Implementation model (collapsed chip → expandable proof panel)

**State 1 — Pre-round (round hasn't resolved yet):**
The chip reads: `● PROVABLY FAIR · seed committed`. The dot is green (volt). Tap expands a half-height bottom sheet showing the server seed hash (full 64 chars, copyable), the client seed, and a note: "The crash point is already determined. We'll reveal the server seed when the round ends."

**State 2 — Post-round (round resolved, seed revealed):**
The chip gets a checkmark: `✓ PROVABLY FAIR · verify this round`. Tap expands the same panel, now with:
- Server seed (revealed, full value, copyable)
- Hash verification: `SHA256(revealed) === committed` shown as a green checkmark or a red cross
- The derivation formula
- A "verify yourself" button that opens a pre-filled browser console command or a link to a hosted verifier

**State 3 — Demo/DEMO RNG:**
The chip reads `● DEMO MODE · play money`. Tap expands: "This is a demo using client-side randomness. Provably-fair server verification will be available when crypto duels launch. No money is at stake."

### What this achieves

- The chip remains small and unobtrusive in the header (or settings sheet)
- The full verification chain is one tap away — it exists and is reachable
- First-time players see the collapsed chip and understand it means "fair"; skeptics can tap and read the proof
- It matches the pattern real crypto casinos use (Stake's "Provably Fair" modal is the industry standard)
- The DEMO RNG state is honest and clear (Cycle 6 recommendation implemented correctly)

---

## 4. Feedback & Signifier Improvements for Core Moments

### 4A — Cash-out confirmation (post-action feedback)

**Current:** `.cashburst` ring animation (0.32s, gone), `.crashword.safe` "CASHED 1.01×" at 13px bottom-of-stage, LOCKED button state, `.roundline` in the panel at 12px.

**Problem:** The most important thing a player wants to know after tapping CASH OUT is "did that register, and at what value?" The cashburst disappears in 320ms — too fast. The "CASHED 1.01×" crashword at 13px is the persistent confirmation, but it is undersized.

**Recommended changes:**
1. Increase `.crashword.safe` to 20–22px (from 13px). Same font-mono. The crash version can stay at 13px or go to 16px.
2. Add a brief (400ms) secondary state on the button after cashing: the LOCKED button already turns `var(--volt-dim)` with the multiplier — make the multiplier text on the LOCKED state larger: `font-size: clamp(19px, 5vw, 23px)` and show a small ✓ prefix. This is the primary confirmation anchor since the button is the element the thumb just touched.
3. Extend cashburst ring: increase animation duration from 0.32s to 0.55s and hold visible for a second cycle. The ring at 320ms is below the threshold of conscious perception (humans need ~400ms to register a change as intentional feedback, not artifact).

**Signifier addition:** The button while LOCKED should visually distinguish "I cashed, waiting for crash" from "I didn't cash, round is over." Currently LOCKED state uses `var(--volt-dim)` background — correct. Consider adding a subtle border pulse (not distracting, 1–2 cycles at 800ms) to signal the round is still live and the player's lock is held.

---

### 4B — Crash moment (loss feedback)

**Current:** `.redflash` full-screen overlay (0.5s), `.is-crashed` shake animation (0.42s), `.crashword` at 13px "CRASHED @ 1.80×", ticker turns `var(--crash)`.

**Assessment:** This is well-designed. The multi-sensory crash (visual flash + shake + color change + audio) is strong. The only gap is the 13px crashword — at the moment the screen is shaking and flashing red, a 13px line is lost in the noise. Increase to 18px. The color (`var(--crash)`) is already correct.

**One addition:** The round verdict panel (`ROUND LOST` / `vmain` at 20px) appears after the crash resolves. The current design shows it beneath the stage, which requires a visual shift downward. On a short phone (667px iPhone 8), the verdict panel may be partially outside the viewport if the stage is tall. Verify viewport overflow in the 375×667 baseline. If overflow occurs, the verdict should briefly show a toast over the stage before the panel renders.

---

### 4C — Round verdict (ROUND WON / ROUND LOST)

**Current:** `.vmain` at 20px in the verdict panel below the stage. `.vsub` at 12px showing `you 2.05× · GHOST 1.85×`.

**Problem:** 20px is insufficiently differentiated from ambient text. The round verdict is the primary resolution beat for 80% of game time (5 rounds per match × every match). It should be designed as a moment.

**Recommended changes:**
1. `font-size: 28px` for `.vmain` in round verdicts (not match verdicts — match is already 24px, bump it to 32px).
2. Add a subtle background color to the verdict panel on win: `background: linear-gradient(135deg, rgba(0,255,133,0.06), var(--panel))` on `.verdict.win` — stronger than the current `border-color: var(--volt-dim)` alone.
3. On loss: `background: linear-gradient(135deg, rgba(255,59,48,0.06), var(--panel))` — same treatment.
4. The `.vsub` "you 2.05× · GHOST 1.85×" is the key comparison. Increase to 14px and differentiate: player's value in `var(--volt)` or `var(--ink)`, ghost's value in `var(--ghost)` or `var(--muted)`. Currently both are `var(--muted)` — color-coding makes the win/loss instant to read without parsing the text.

---

### 4D — Match verdict (YOU WIN / YOU LOSE)

**Current:** `.vmain` 24px in `.verdict.match`, `.vscore` 20px showing `X.XX vs Y.YY`.

The `.voltflash` and `.win-pop` animations are strong win signals. The loss case has no equivalent — the `.redflash` fires on round loss (if player busted) but NOT on match loss when the player cashed. A player can lose the match on points having cashed out cleanly in the final round — and get zero loss feedback visuals. The verdict panel appears with a red border, but no flash, no shake.

**Recommended:** On match loss (regardless of how the final round ended), fire a brief `redflash` overlay variant — reduced intensity, 0.4s — to signal the match outcome. The round result already resolved; this is the match-level beat. Without it, a points-loss feels like nothing happened.

---

## 5. Usability Test Plan

### Goal
Validate that the redesigned mobile layout (Section 2), provably-fair disclosure (Section 3), and feedback improvements (Section 4) reduce confusion, improve trust perception, and increase cash-out action confidence. Test BEFORE implementation begins to establish a baseline; re-test after each P1 fix ships.

### Participants
- 6–8 people who have never seen CRASHOUT
- Mix: 3 crypto-adjacent players (Discord/Telegram community), 3 mobile-first casual gamers with no crypto background
- All tested on iPhone (375px wide preferred, SE or 14 baseline) — the design's primary failing platform

### Test format
Remote moderated, 20–25 minutes each. Share screen. Think-aloud protocol. Do not explain anything before the session.

---

### Task 1 — First contact legibility
**Task:** "Open this link. Tell me what this game is and what you're supposed to do. Don't click anything yet."
**Time allowed:** 60 seconds
**Success criterion:** Participant identifies the cash-out verb ("press something before it crashes") and the competitive element ("playing against someone") without being told. Target: 5/6 correct unprompted.
**Measures:** P2-A (hierarchy), the idle-state onboarding adequacy from Cycle 6

---

### Task 2 — First cash-out
**Task:** "Start a game and cash out during the first round. Tell me when you've done it and what you cashed at."
**Time allowed:** One round
**Success criteria:**
- Player successfully taps CASH OUT (not accidentally tapping a header button) — target: 6/6
- Player can state their cash-out multiplier within 5 seconds of the round ending — target: 5/6
**Measures:** P1-A (touch targets), P1-B (CASHED confirmation feedback), P1-C (mis-tap rate)

---

### Task 3 — Post-round comprehension
**Task:** After round 1 resolves: "Who's winning right now and by how much?"
**Time allowed:** 10 seconds
**Success criterion:** Player answers with a number (not just "me" or "them") within 10 seconds. Target: 5/6.
**Measures:** P2-A (standing line prominence), P2-D (round verdict legibility)

---

### Task 4 — Trust/fairness probe
**Task:** "Where would you look to find out if this game is fair?"
**Time allowed:** 30 seconds, free exploration
**Success criterion:** Player finds the provably-fair chip or any fairness-related control and can describe what it means at the level of "the server decides the outcome in advance and I can check it." Target: 4/6 find it; 3/6 can describe the model (these are hard targets — current state likely fails both).
**Measures:** P0 (trust chip discoverability), Section 3 (provably-fair UX)

---

### Task 5 — Settings discoverability (post-redesign only)
**Task:** "How would you turn off the sound?"
**Time allowed:** 20 seconds
**Success criterion:** Player finds the mute control (whether header button or settings sheet) without help. Target: 6/6 within 20 seconds.
**Measures:** P2-B (settings button relocation), verifies that collapsing into ⋯ does not hide it below discoverable

---

### Task 6 — Match completion + re-engagement
**Task:** Complete a full 5-round match (no time limit). After seeing the result: "What happened? Who won, and what were the scores?"
**Time allowed:** Until natural completion + 15 seconds for recall
**Success criteria:**
- Player can state their score and the ghost's score — target: 5/6
- Player initiates RUN IT BACK within 30 seconds without prompting — target: 4/6 (measures retention hook)
**Measures:** P2-D (verdict clarity), P4D (match-loss feedback), Cycle 6 retention loop

---

### Baseline metrics to capture before test

From the live deployment (`crashout-euq.pages.dev`):
- Cycle 12 post-loss rematch rate (from GATE panel aggregate when backend available)
- Engaged session time
- These establish the before-state; re-test after each P1 fix ships to detect movement

---

### Gating criteria for shipping P1 fixes

Ship only when:
- Task 2 success rate ≥ 5/6 (cash-out legible + no mis-tap)
- Task 3 success rate ≥ 4/6 (standing line readable)
- Task 5 success rate ≥ 6/6 (settings not buried)

If Task 4 (fairness probe) remains at < 3/6 correct description after the provably-fair panel ships, the panel design must be revised before crypto-money launch (it is a legal and trust requirement, not cosmetic).

---

## Summary of findings for implementation queue

| Priority | Problem | Section | Fix type |
|---|---|---|---|
| P0 | Trust chip: too small, claims not backed by accessible verification | 1, 3 | Replace chip with expandable proof panel |
| P1-A | Header: 6 elements, 30px buttons, ∑ must be deleted | 1, 2 | Collapse to brand + single ⋯ settings button |
| P1-B | "CASHED X.XX" too small (13px) to register as confirmation | 1, 4A | Increase crashword.safe to 20–22px; extend cashburst duration |
| P1-C | Touch targets at 30px on all utility buttons | 1, 2 | 44px minimum everywhere; delete ∑ |
| P2-A | No dominant hierarchy line above the stage | 2 | Tertiary demotion of header; Tier 2 status band owns match state |
| P2-B | Sound + Help in wrong place | 2 | Move to settings bottom sheet |
| P2-C | LIVE/LOCAL chip: no mobile tooltip, no recovery path | 1 | Move to settings sheet with contextual explanation |
| P2-D | Round verdict at 20px, undifferentiated | 4C | Increase to 28px; color-code vsub comparison |
| P2-E | Panel roundline at 12px muted after cashing | 1 | Increase to 14px, retain volt color |
| P3-A | Pips have no aria-labels | 1 | Add aria-label per pip |
| P3-B | Hint text changes silently | 1 | Add fade transition on text change |
| P3-C | ∑ gate button in production | 1 | DELETE from production; gate behind DEV flag |
