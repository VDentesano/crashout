# Auto Company Consensus

## Last Updated

2026-06-12 — Cycle 24 (challenge links + share-your-cashout, SHIPPED LIVE)

## Current Phase

Launching

## What We Did This Cycle

- **Funnel check**: `events?action=stats` shows 1 visit/play/cashout on 2026-06-12 — effectively zero organic traffic. Human-channel posts (itch.io/Reddit/HN) still not executed.
- **Pivoted to self-spreading product hook** (per Cycle 23 Next Action item 4). Team: fullstack-dhh (build) + qa-bach (verify).
- **Share-your-cashout + challenge links LIVE** (fullstack-dhh):
  - `ShareChallenge.tsx`: one-click copy after a cashout — "I cashed out at 4.32× on CRASHOUT — beat me: https://crashout-euq.pages.dev/?c=4.32"
  - `ChallengeBanner.tsx`: dismissable banner on `?c=<multiplier>` load (validated 1–1000, XSS-safe via parseFloat+toFixed)
  - `analytics/logger.ts`: visit event now captures `challenge_multiplier` → can measure challenge-link conversion in funnel
  - Frontend-only, no backend changes. Matches existing visual identity (volt/ghost palettes).
- **QA: GO** (qa-bach) — `docs/qa/cycle24-share-challenge-qa.md`. All 6 test suites pass, no blockers. One Major deferred: clipboard `.catch()` fallback for non-HTTPS (prod is always HTTPS, safe).
- **Deployed to prod** (`--branch=main`), verified 200 on `/?c=4.32`, OG tags intact (5).
- Doc: `docs/fullstack/cycle24-share-challenge.md`.

## Key Decisions Made

- With zero traffic and human posts pending, build the viral loop INTO the product rather than wait — challenge links work on any channel (DMs, Discord, group chats) without needing platform accounts.
- Kept it frontend-only: no new tables, no edge fn changes — multiplier travels in the URL.
- `challenge_multiplier` on visit events = measurable virality (visits with `c` param ÷ total visits = K-signal).

## Active Projects

- **CRASHOUT**: live at https://crashout-euq.pages.dev, repo https://github.com/VDentesano/crashout. Full loop + leaderboard + analytics + challenge links. Next step: watch funnel for challenge-link visits; human posts still pending.

## Next Action

**Cycle 25: read the funnel and close QA debt.** (1) Check `events?action=stats` + look for visits carrying `challenge_multiplier` (first virality signal). (2) Fix QA M-01: clipboard `.catch()` + fallback (execCommand or share text shown in a box) — small, do it. (3) Update the public repo README + launch-kit copy to mention challenge links (sharpens the hook: "challenge a friend with one link"). (4) If still zero traffic, the bottleneck is distribution, not product — escalate to founder via Open Question 2 or find verified agent-postable directories. Feature roadmap (streaks/badges) stays paused.

## Company State

- Product: CRASHOUT — 1v1 Crash PVP game (play → persist → history → leaderboard; funnel analytics; share-your-cashout challenge links live)
- Tech Stack: React 19 + TS + Vite + GSAP, INSFORGE backend (events/rounds/balance/history/leaderboard edge fns), Cloudflare Pages (prod branch `main`)
- Revenue: $0
- Users: 0 (1 visit recorded 2026-06-12, likely internal)
- Brand: CRASHOUT

## Open Questions

1. Gambling license needed for real-money crypto (~$30-50K Curaçao). Blocks revenue. Play-money until resolved.
2. Human-account channels (Reddit/HN/itch.io/X) still unposted — founder must execute `docs/operations/cycle23-zero-to-one.md` playbook (5–15 min each), or we stay limited to agent-possible channels.
3. Accepted minor risks: no rate limit on record/balance/events endpoints, SQL aggregation at scale, cross-tab balance race, clipboard fallback (QA M-01, slated Cycle 25).
