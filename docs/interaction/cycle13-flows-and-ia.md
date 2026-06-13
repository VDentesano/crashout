# Cycle 13 — Interaction Design: Flows, IA, and Platform Vision

**Author:** Interaction Design Director (Alan Cooper framework)
**Date:** 2026-06-12
**Scope:** Analysis-only. No code changes. Design proposal for review against UI and Product proposals.

---

## 0. Method Note

Every design decision here is derived from a specific named person's goal in a specific scenario. "The user" is not a design target. Whenever a decision could go two ways, the tie-breaker is: which path does Marcus complete without confusion at 11 PM on his phone?

---

## 1. Primary Personas

### Persona A — Marcus, the Curious Degenerate (Primary Persona)

**Age:** 24
**Context:** Saw a tweet or TikTok clip showing a multiplier screaming past 12x then crashing. Tapped the link. He is on his phone, standing in line or lying in bed. He has no wallet connected. He does not know what "best-of-5 ladder" means and does not care.

**Life Goal:** Feel like a sharp, lucky person who wins with nerve.
**Experience Goal:** The first 30 seconds must feel electric, not bureaucratic.
**End Goal (this session):** Cash out at a higher multiplier than the ghost. Then do it again.

**What Marcus absolutely will not do:**
- Create an account before seeing what the game is
- Read a rules overlay before his first round fires
- Connect a wallet before he's felt what it's like to win

**What Marcus will do if onboarding goes right:**
- Play 3+ practice rounds unprompted
- Hit "Play for Real" himself, because he wants the win to mean something
- Accept a username prompt AFTER the wallet is connected, because it feels like naming his fighter

**The critical "first 30 seconds" goal flow:**

```
Land → see multiplier rising → understand the one action available → tap CASH OUT →
see result vs ghost → feel something (win: volt flash / loss: crash red) →
tap NEXT ROUND immediately
```

That is the entire job of the first session. Everything else — wallet, username, leaderboard, platform — is round 2 or round 5.

---

### Persona B — Crypto Carlos, the Competitive Regular (Secondary Persona)

**Age:** 28
**Context:** Already plays on Rollbit or Stake. Found CRASHOUT because 1v1 format is novel. Connects wallet on first visit if the product signal is strong enough.

**End Goal:** Win a crypto duel with real stakes, brag about it.
**Experience Goal:** Platform feels professional. Not another demo toy.

**What Carlos needs that Marcus does not:**
- Provably fair verification visible before he bets real money
- Match history and win rate
- Real opponent matching (not always a ghost)
- Leaderboard he can appear on

Carlos is the monetization persona. But he converts ONLY after Marcus's path is cleared — if the anonymous experience feels amateur, Carlos bounces before ever connecting a wallet.

**Design rule:** Build for Marcus first. Carlos will self-serve once crypto rails are live.

---

## 2. Onboarding Flow — State Diagram

### States

```
[ANONYMOUS]
    |
    | (first visit, or no localStorage key)
    v
[PRACTICE_IDLE]
    State: Ghost bot loaded. No wallet. No signup prompt.
    UI: CRASHOUT header. "ENTER DUEL" button. No wallet CTA visible.
    Gated: nothing. Everything works.
    |
    | (player taps ENTER DUEL)
    v
[PRACTICE_RUNNING]
    State: Live round vs ghost. CASH OUT button alive.
    UI: Full game, zero friction.
    |
    | (match ends — any outcome)
    v
[PRACTICE_MATCH_END]
    State: Result shown. Volt or crash FX has fired.
    UI: "RUN IT BACK" button (free) + soft CTA: "Win something real →"
    The CTA is text-link weight, not a modal. Non-blocking.
    |
    |--- player ignores CTA → [PRACTICE_IDLE] (loop)
    |
    |--- player taps "Win something real →"
    v
[PLAY_FOR_REAL_INTENT]
    State: Bottom sheet (mobile) or inline modal (desktop) slides up.
    Content: "Connect a wallet to play for crypto. Your practice record carries over."
    Two actions: "Connect Wallet" (primary) · "Keep Practicing" (secondary)
    No account creation here. No email. No password.
    |
    | (player taps "Connect Wallet")
    v
[WALLET_CONNECTING]
    State: Standard wallet modal (WalletConnect / MetaMask / Phantom depending on chain).
    UI: Native wallet modal — CRASHOUT does not design this screen.
    On success → wallet address becomes the user identity.
    |
    v
[WALLET_CONNECTED — ANONYMOUS_USERNAME]
    State: Wallet connected. User has an identity (0xABCD…). Fully functional for crypto play.
    UI: Optional username prompt appears ONCE as a dismissible bottom sheet.
    Text: "Give yourself a name? Opponents see this in the duel."
    Input + "Save" · "Skip for now" (neither is destructive)
    This is NOT a gate. Player can dismiss and play immediately.
    |
    |--- sets username → [REGISTERED_NAMED]
    |--- skips → [REGISTERED_WALLET_ONLY]
    v
[CRYPTO_PLAY_IDLE]
    Full platform access. Real stakes. Leaderboard entry.
```

### Gate Rules — What Is Free vs Gated

| Action | Anonymous | Wallet Connected |
|---|---|---|
| Practice vs ghost | FREE | FREE |
| See multiplier / crash FX | FREE | FREE |
| Match history (this session) | FREE | FREE |
| Leaderboard (read) | FREE | FREE |
| Crypto duel (real bet) | GATED | OPEN |
| Match history (persistent) | GATED | OPEN |
| Leaderboard (appear on) | GATED | OPEN |
| Taunts / social | GATED | OPEN |
| Cosmetic purchase | GATED | OPEN |

**Design rule:** The wallet gate appears exactly once, triggered by the player's own intent ("Win something real"), never by the system pushing them. Wallet connection is the identity creation event — no separate account step.

### What to Delete from Current Onboarding

The existing `Onboarding` overlay (how-to-play modal on first visit) should be **replaced** by the practice match itself. Marcus learns the game by playing one round, not by reading three bullets. The overlay can survive as the `?` help button for players who want to re-read the rules — but it should not block the first duel.

---

## 3. Information Architecture — Multi-Game-Mode Navigation

### Current state

Single game, single mode, no navigation needed.

### Target state (Cycle 13 planning horizon)

```
CRASHOUT Platform
├── Crash
│   ├── 1v1 Duel (current)
│   ├── Solo (ride as long as you dare, no opponent)
│   └── Tournament (bracket, scheduled)
├── [Future] Dice
├── [Future] Roulette
└── [Future] Jackpot
```

### Navigation Pattern Decision

**Mobile: Bottom Tab Bar — Game Lobby Model**

Do NOT use a hamburger menu. Do NOT use a top nav. The bottom tab bar is the correct pattern because:
- It maps to thumb reach on mobile
- It survives with 3–5 permanent destinations
- Rollbit and Roobet both use it on mobile, and their retention proves it

```
Mobile bottom bar (when platform expands beyond 1 game):
┌─────────────────────────────────────────┐
│  [CRASH]  [DICE]  [ROULETTE]  [ACCOUNT] │
└─────────────────────────────────────────┘
```

Within Crash, mode switching (1v1 / Solo / Tournament) lives as a segmented control at the top of the Crash screen — not a separate nav destination.

```
┌─────────────────────────────────────────┐
│  CRASHOUT                    [sound] [?]│
│ ┌──────────┬──────────┬───────────────┐ │
│ │  1v1     │  SOLO    │  TOURNAMENT   │ │
│ └──────────┴──────────┴───────────────┘ │
│  ...game content...                     │
└─────────────────────────────────────────┘
```

**Desktop: Left Rail — Persistent Game Sidebar**

The left rail on desktop replaces the stretched-mobile-column problem. It is always visible at desktop widths (>= 1024px), collapses to the bottom tab on mobile.

```
Desktop layout at 1280px:
┌──────────────┬─────────────────────────────────────────────────┐
│              │                                                 │
│  LEFT RAIL   │              CRASH ARENA                        │
│  (Dynamic    │                                                 │
│   Island)    │   ┌────────────────────────────────────────┐   │
│              │   │  GHOST panel    |    YOU panel          │   │
│  [game nav]  │   └────────────────────────────────────────┘   │
│  [stats]     │                                                 │
│  [wallet]    │         [ CURVE STAGE + TICKER ]                │
│  [history]   │                                                 │
│  [live feed] │         [ VERDICT / RESULT ZONE ]               │
│              │                                                 │
│              │         [ CASH OUT BUTTON ]                     │
│              │                                                 │
└──────────────┴─────────────────────────────────────────────────┘
```

The arena never changes width on desktop. It stays at its mobile natural width (max 720px), centered. The left rail fills the surplus space. This avoids a "stretched mobile column" without redesigning the game canvas.

---

## 4. The Dynamic Island Left Sidebar

### Design Philosophy

The sidebar is called "Dynamic Island" by the client. The right reference is Apple's Dynamic Island: a floating, inert, glass surface that swells into relevance when something needs your attention, then recedes. It does NOT compete with the game canvas. It is context, not content.

**Physical spec:**
- Width: 260–280px, fixed
- Position: Left edge, full height, with 20px inset from the window edge
- Shape: Rounded rectangle with large corner radius (24px), frosted glass background
- Not a panel with a border. A floating pill with depth.

### States

#### State 1 — IDLE (no active match)

```
┌────────────────────────────────┐
│                                │
│   [CRASHOUT logo wordmark]     │
│                                │
│   ──────────────────────────   │
│                                │
│   W/L RECORD    3W · 1L · 0D   │
│   WIN RATE      75%            │
│   BEST MULTI    14.22×         │
│   STREAK        ↑ 3            │
│                                │
│   ──────────────────────────   │
│                                │
│   LIVE NOW                     │
│   · Crypto Carlos riding 6.2×  │
│   · vamp_x busted @ 1.8×       │
│   · ghost_9 cashed 11.3×       │
│                                │
│   ──────────────────────────   │
│                                │
│   [0x1A2B...C3D4]  [Wallet]    │
│                                │
└────────────────────────────────┘
```

Live feed is ambient social proof — it runs automatically and is read-only. Marcus sees that real things are happening.

#### State 2 — IN MATCH (round running)

The sidebar compresses. Non-essential items collapse. The live feed is replaced by opponent context.

```
┌────────────────────────────────┐
│                                │
│   ROUND 2 / 5                  │
│   YOU LEAD  +1.44              │
│                                │
│   ──────────────────────────   │
│                                │
│   GHOST STATUS                 │
│   riding…                      │
│   (last round: 3.21×)          │
│                                │
│   ──────────────────────────   │
│                                │
│   YOUR HISTORY                 │
│   R1  cashed 4.65×   W         │
│   R2  —                        │
│   R3  —                        │
│   R4  —                        │
│   R5  —                        │
│                                │
└────────────────────────────────┘
```

Ghost status is the key addition here — on mobile this is NOT visible (the ScorePanel handles it). On desktop we have room to show "what the opponent is doing RIGHT NOW" as a sidebar fact. This creates genuine tension.

#### State 3 — MATCH END

```
┌────────────────────────────────┐
│                                │
│   MATCH RESULT                 │
│   YOU WON  4.88 vs 3.22        │
│                                │
│   ──────────────────────────   │
│                                │
│   SESSION                      │
│   Matches played   4           │
│   Net score        +6.22 pts   │
│   Time played      12 min      │
│                                │
│   ──────────────────────────   │
│                                │
│   [TAUNT GHOST]                │
│   [SHARE RESULT]               │
│                                │
│   ──────────────────────────   │
│                                │
│   [PLAY FOR REAL →]            │
│   (anonymous only)             │
│                                │
└────────────────────────────────┘
```

Taunt and Share only appear at match end — not during the round. The wallet CTA appears only if anonymous. This is the correct moment: Marcus just won, his guard is down.

#### State 4 — WALLET CONNECTED (replace idle footer)

Bottom section replaces the wallet CTA with:

```
│   [0x1A2B…C3D4]                │
│   Balance: 0.042 ETH           │
│   [Deposit] [Withdraw]         │
```

---

## 5. Core Duel Interaction Patterns

### 5.1 Cash Out — Make It Physical

The current CASH OUT button is correct in principle (full-width, volt green, pulses). The pattern to preserve and sharpen:

- The button label must live-update with the multiplier: `CASH OUT  6.44×` — this is already implemented and is exactly right.
- After cash-out, the button should NOT just go grey. It should show a locked confirmation: `LOCKED IN AT 6.44×` with a checkmark glyph. The player needs to feel the decision is irreversible and safe — not just disabled.
- On mobile, the cash-out tap area should be at least 72px tall (currently 20px padding = ~61px). The moment of maximum heart rate should have the largest possible tap target.
- Sound: the cash-out click (already implemented) is load-bearing. Do not remove it.

### 5.2 Rematch — Reduce Decision Friction

The "RUN IT BACK" button is the right label. Rollbit uses "Bet Again" which is weaker — it sounds transactional. "RUN IT BACK" has competitive language that implies the ghost challenged you back.

**Pattern to add:** After a LOSS, the button should carry a subtle red glow (not a hard crash color) and the label can read: `RUN IT BACK ↻ — prove it`. This is a micro-taunt from the product itself. After a WIN, it reads: `RUN IT BACK ↻`. Asymmetry between win/loss rematch copies drives re-engagement.

### 5.3 Taunts — Asynchronous Social Signal

Taunts are for crypto mode only. The pattern:

- After a round result (not mid-round — never mid-round), a 2-second window opens.
- Three taunt options appear as quick-tap chips: `GG · THAT'S LUCK · TOO EASY`
- The ghost receives it (visually) at the start of the NEXT round as a notification on their panel.
- On mobile: the chips slide up from the verdict zone, auto-dismiss after 2 seconds if not tapped.
- Taunts cost nothing. They are the cheapest form of social glue.

This pattern is pulled from Rollbit's chat and Stake's reaction system, but distilled: no chat box (too slow for a fast-paced duel), just instant-tap chips that feed the competitive tension.

### 5.4 Partial Cash-Out — Future Pattern

Not for now. Deferred to Cycle 16+. The interaction complexity (bet sizing UI, partial lock mechanics) would confuse Marcus and add no value until crypto is live. Flag for future design cycle.

**When it arrives, the right pattern is:**
A slider below the CASH OUT button that appears only if the player has held past 3×. Default is 100%. Drag left to lock a percentage. The button updates: `CASH OUT 50% (2.22×)`. The remaining 50% continues riding.

This is pulled from how Rollbit handles partial exits, but the slider pattern is better than their button-toggle approach.

---

## 6. Header Cleanup — Concrete Spec

The client's feedback is precise. Here is the exact interaction design spec:

### Delete entirely
- The `∑` (GatePanel button) — it is a developer instrument, not a user control. It should only be accessible via a keyboard shortcut in dev mode (e.g., `Shift+G`), invisible to players.

### Move or demote
- `🔊` (mute toggle) — move to the Dynamic Island sidebar on desktop. On mobile, move to the onboarding card and a persistent small icon in the footer hint area. Do NOT remove it — audio feedback is load-bearing for Marcus's experience.
- `?` (help) — move to the Dynamic Island sidebar on desktop. On mobile, accessible via a "How to play" link in the footer (idle state only).

### What stays in the mobile header
```
┌─────────────────────────────────────────┐
│  CRASH OUT         [PROVABLY FAIR chip] │
│                    [LIVE / LOCAL chip]  │
└─────────────────────────────────────────┘
```

Two chips maximum. Brand left. Status right. Nothing else. The HUD communicates trust (provably fair) and connection status (live) — both are genuinely user-facing signals.

The seed hash in the provably fair chip (currently 8 characters of the hash) should remain — it is the proof that Marcus can verify the game wasn't rigged. This is a trust signal, not a debug readout.

---

## 7. The "Best of 5" Footer Text

The client says: delete "best-of-5 ladder · highest cumulative score takes the duel" once crypto is implemented.

The design-level recommendation is more nuanced:

- **Delete the static footer text now.** It is redundant. The ladder rail and pip states already communicate "best of 5" visually. The match-info standing line communicates "who's winning." The rule is taught once in the `?` overlay.
- **Replace it with nothing.** The footer should be: CASH OUT button + keyboard hint. That is enough. The `cryptosoon` line (`Play money — on-chain crypto duels coming soon`) can stay until crypto ships, then it goes too.

---

## 8. Platform Evolution — IA Horizon

### Phase 1 (now — Cycle 14): Clean single game
- Delete ∑ button, demote 🔊 and ?, clean header to 2 chips
- Remove ladder footer text
- Onboarding: replace overlay-first with practice-first
- Wallet gate: appear only on "Play for Real" intent

### Phase 2 (Cycle 15–17): Crypto live
- Wallet connect flow
- Username prompt (post-wallet)
- Persistent match history
- Leaderboard entry

### Phase 3 (Cycle 18–22): Multi-mode
- Segmented control: 1v1 / Solo / Tournament
- Dynamic Island sidebar on desktop
- Taunts and share

### Phase 4 (Cycle 23+): Multi-game platform
- Bottom tab nav (mobile) / Left rail nav (desktop)
- Game lobby: Crash, Dice, Roulette
- Platform brand above game brands

### What NOT to build yet
- Chat (too slow, moderation cost too high, Stake has it but it is a distraction for a single-game duel)
- Power-ups (adds decision complexity before Marcus even understands the base loop)
- Cosmetics shop (no revenue path until crypto rails exist)
- Tournament brackets (requires matchmaking, scheduling, notifications — Phase 4 minimum)

---

## 9. Stake / Roobet / Rollbit Pattern References

| Pattern | Source | Apply to CRASHOUT? |
|---|---|---|
| Ambient live-bet feed (right rail) | Stake | YES — left sidebar, idle state |
| Bottom tab game navigation | Rollbit mobile | YES — Phase 4 |
| Instant reaction chips after round | Stake (chat reactions) | YES — simplified to 3 chips |
| Wallet balance always visible | All three | YES — sidebar footer |
| "Bet Again" / rematch button | Rollbit | YES — already have it, improve copy |
| Provably fair hash in HUD | Stake | YES — already have it, keep it |
| Partial cash-out slider | Rollbit | DEFERRED — Phase 4 |
| Live multiplier chart | All three | YES — already have it, it is the product |
| Leaderboard in sidebar | Roobet | YES — Phase 2 |
| Sound toggle in HUD | All three | MOVE to sidebar / footer |
| Game categories in left nav | Stake desktop | YES — Phase 4 |

The key differentiator versus all three: CRASHOUT is **1v1**, not "you vs the house." The ghost opponent is the product's unique mechanic. Stake/Roobet/Rollbit are all solo play against a provably-fair RNG. The social/competitive angle is CRASHOUT's moat. Every interaction decision should amplify that — the ghost panel, the standing line, the taunts, the "you lead / ghost leads" readout. This is the design direction that cannot be copied by simply cloning Stake's UI.

---

## 10. Prioritization — Build Order

### Now (unblock Marcus's first 30 seconds)
1. Delete ∑ button (the GatePanel is a dev tool, not a UX feature)
2. Remove ladder footer text (redundant with visual pips)
3. Demote 🔊 and ? from the header on mobile — move to footer or sidebar
4. Replace Onboarding overlay-first with practice-first (overlay becomes ? trigger only)

### Next (before crypto ships — trust and conversion)
5. Wallet connect flow + bottom sheet intent gate ("Win something real")
6. Username prompt post-wallet (optional, dismissible)
7. "LOCKED IN AT X×" button state post-cash-out
8. Win/loss asymmetric rematch copy

### After crypto ships (platform feel)
9. Dynamic Island sidebar for desktop (idle / in-match / match-end states)
10. Persistent match history + leaderboard entry
11. Taunt chips (post-round, 2-second window)
12. Segmented control for game modes (1v1 / Solo / Tournament)

### Defer
- Partial cash-out slider
- Multi-game nav
- Cosmetics shop
- Tournament brackets
- Chat

---

*End of proposal. For review against UI-Duarte and Product-Norman proposals.*
