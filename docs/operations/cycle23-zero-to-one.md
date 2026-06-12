# Cycle 23 — Zero-to-One Operations Plan

**Date:** 2026-06-12  
**Agent:** operations-pg  
**Status:** Executed + playbook

---

## Target Weekly Metric

**Unique visitors who complete at least one 5-round duel** — tracked via the `match_result` event in INSFORGE.

Why this metric: signups are a vanity metric at zero distribution. One completed duel means the loop landed. Post-loss rematch rate (≥35%) is the PMF gate; we can't measure it without first-time completions. Target for Week 1: **10 completed duels from ≥5 distinct players**.

---

## First-10-Users Strategy

PG law: the first 10 users must be recruited by hand, one at a time. No funnels. Direct personal ask.

**Who to target first:**
1. People the founder already knows who play any browser game, crypto game, or online gambling game.
2. Crypto-adjacent Discord servers where the founder is already a member (no cold join needed).
3. Developers on GitHub who star crash/crypto game repos — reachable via GitHub follow/watch.

**Script for the ask (DM or message):**
> "Hey — I built a 1v1 crash duel game, no money, no account, runs in the browser. Takes 3 minutes. Would you be willing to play one match and tell me what felt off? Link: https://crashout-euq.pages.dev"

Key rules:
- Ask for feedback, not signups. People resist "try my thing"; they engage with "help me understand".
- Follow up exactly once after 48 hours if no reply.
- Record every piece of feedback in `memories/user-feedback.md` (create it).

**Feedback channel:** GitHub Issues on `VDentesano/crashout` is the zero-friction public channel. For early personal recruits, a simple DM thread works. No Discord bot, no Typeform — those scale zero to one badly.

---

## Executed Actions

### 1. Public GitHub showcase repo — LIVE

- Repo: **https://github.com/VDentesano/crashout** (public)
- Description: "CRASHOUT — 1v1 Crash PVP Duel. Play free: https://crashout-euq.pages.dev"
- README contains: live link, how-it-works, stack, run-locally instructions, brand, status
- This makes the game discoverable via GitHub search for terms like "crash game", "pvp duel", "provably fair"
- Verified: `curl https://github.com/VDentesano/crashout` returns 200 with correct title

### 2. Live game URL verified

- https://crashout-euq.pages.dev — returns 200, full HTML, game loads

---

## Human Posting Playbook

These channels require a human with accounts. Reference copy from `docs/marketing/cycle23-launch-kit.md`.

**Time budget: 15 minutes total.**

### A. Reddit — r/WebGames or r/gamedev (5 min)

1. Go to reddit.com/r/WebGames
2. Click "Create Post" → Link post
3. Title: `CRASHOUT — 1v1 Crash Duel (free, no account) — feedback welcome`
4. URL: `https://crashout-euq.pages.dev`
5. Body (2 sentences): "Best-of-5 crash duel — multiplier climbs, cash out before it crashes, banked points across 5 rounds. Play-money MVP, would love to know what feels broken."
6. Post. Do NOT post to r/cryptocurrency or any gambling sub — wrong audience, wrong trust level.

**Timing:** Post Tuesday or Wednesday 10–11am EST (peak r/WebGames engagement).

### B. Hacker News — Show HN (5 min)

1. Go to news.ycombinator.com → Submit
2. Title: `Show HN: CRASHOUT – provably fair 1v1 crash duel (play-money, no account)`
3. URL: `https://crashout-euq.pages.dev`
4. Text (optional, 2–3 sentences): "Built a 1v1 crash game where you play against ghost opponents — recorded runs from real players. Best-of-5 format, banked scoring so a bust doesn't wipe your match. Looking for feedback on whether the loop feels fair/fun."

**Timing:** Monday or Tuesday 9–10am EST (HN front page window is narrow).

### C. itch.io — Game listing (5 min)

1. Go to itch.io → Dashboard → Create new project
2. Title: CRASHOUT
3. Kind: HTML (web game)
4. Description: copy from `docs/marketing/cycle23-launch-kit.md`
5. External link → set to `https://crashout-euq.pages.dev`
6. Tags: `crash`, `pvp`, `strategy`, `browser`, `free`
7. Publish.

**Note:** itch.io browser games get organic search traffic. This is the highest-leverage 5-minute action.

---

## Weekly Ops Dashboard

Check these 3 numbers every Monday morning:

| # | Metric | Source | Target |
|---|--------|--------|--------|
| 1 | **Unique players (completed ≥1 duel)** | INSFORGE → `matches` table: `SELECT COUNT(DISTINCT player_id) FROM matches WHERE created_at > now() - interval '7 days'` | +5 WoW until 50 reached |
| 2 | **Post-loss rematch rate** | INSFORGE → ratio of `rematch` events to `match_result` events where outcome=loss, last 7 days | Gate: ≥35% |
| 3 | **GitHub repo stars** | https://github.com/VDentesano/crashout (glanceable) | Leading indicator of developer word-of-mouth |

Do not track: raw page views, bounce rate, social impressions. Those are vanity at this stage.

---

## Next Action for Human Founder

**Single most important action: post to itch.io today (5 minutes).**

itch.io is the only channel that generates passive organic traffic from day one without needing followers or community trust. Reddit and HN require timing and luck; itch.io search is persistent.

After itch.io: DM 5 people you already know and ask for one play + one piece of feedback.
