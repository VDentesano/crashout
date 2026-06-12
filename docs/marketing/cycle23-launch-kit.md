# Cycle 23 — CRASHOUT Launch Kit

*Marketing (Seth Godin) — Cycle 23. Zero users → first 50 real players. No ad budget. Word of mouth is the strategy.*

---

## 1. Smallest Viable Audience

**Not "gamers." Not "crypto people."**

Target: **18–28 year olds who already know crash games (Aviator, JetX, Roobet Crash) and are bored of gambling against a faceless algorithm.** They want a human to beat. They want bragging rights. They play browser games at work or on mobile. They use Reddit, Discord, X. They share clips in group chats.

This is a tribe of maybe 10,000 people globally. We don't need 10,000. We need 50 who become evangelists.

---

## 2. The Purple Cow Hook

**One sentence:**

> "It's a crash game — but instead of a house, you're facing a real person who can feel you winning."

**Why they share it:** Every other crash game is you vs. math. CRASHOUT is you vs. a named human. When you hold longer and they detonate, that screenshot is a flex. The moment is shareable. The humiliation/revenge loop drives rematches. You don't buy distribution — the duel clip IS the distribution.

**The change we create:** "I gambled" → "I won a duel." Skill story, not luck story.

---

## 3. Channel Launch Copy

### Channel 1 — Reddit r/WebGames

**Post title:**
```
I made a 1v1 crash game where you play against a real person, not the house — free, no crypto needed [Browser]
```

**Body:**
```
Hey r/WebGames — built this because I was tired of crash games where you're just clicking against an RNG.

CRASHOUT is a 1v1 duel in the browser. You and an opponent both watch the multiplier climb. You each decide when to cash out. First to hesitate wrong loses. It's play money — no real crypto, no gambling, just competition.

What makes it different: you can literally watch your opponent's behavior through the shared ticker. And it has a leaderboard, match history, and net delta stats if you're into that.

Would love brutal feedback — especially on whether the 1v1 angle actually feels different from regular crash, or if it's just the same thing with extra steps.

Play free: https://crashout-euq.pages.dev
```

**Why it works:** r/WebGames rewards "I made this" posts that are honest about what the thing is. No fake hype. Inviting criticism signals authenticity and generates engagement.

---

### Channel 2 — Hacker News Show HN

**Post title:**
```
Show HN: CRASHOUT – a 1v1 browser crash duel (play money, no gambling)
```

**Comment (to post immediately under the submission):**
```
I built this because the "crash game" mechanic is psychologically interesting — it's a real-time test of nerve and greed — but every existing implementation pits you against a house algorithm, which removes the human element entirely.

CRASHOUT puts two players on the same curve. You don't know exactly when your opponent will cash out. You're making a bet on your own risk tolerance AND reading theirs.

Stack: React 19 + Vite front-end, INSFORGE backend (edge functions + D1), deployed on Cloudflare Pages. The multiplier curve uses a provably-fair seeded PRNG so neither player can predict the crash point.

It's free, no signups required, no real money. Happy to discuss the architecture or the game design decisions.

https://crashout-euq.pages.dev
```

**Why it works:** HN rewards builders who explain the interesting technical and design decision. "Why does 1v1 change the psychology" is an interesting question for HN. Keep it intellectual, not promotional. No superlatives.

---

### Channel 3 — itch.io Page Description

**Game title:** CRASHOUT — 1v1 Crash Duel

**Short description (shown in listings):**
```
A multiplayer crash game where you duel a real person, not the house. Free. No real money.
```

**Full description:**
```
CRASHOUT is a 1v1 browser duel built around the crash game mechanic.

You and an opponent both watch a multiplier climb from 1x. At any moment, either of you can cash out — and lock in your winnings. The game crashes at a hidden point: anyone still in when it blows loses their stake.

The twist: you're not playing against math. You're playing against a person.

You can feel the difference. Watching the ticker while knowing another human is making the same calculation — hold or fold — changes the experience completely. It becomes a test of nerve, not just luck.

Features:
- Instant play, no download, no account required
- Persistent leaderboard with net delta, win rate, best cashout
- Match history and stats
- Play money only — no real gambling, no real crypto

Built by a two-person team as an experiment: can a crash game feel like a competitive sport?

Play free in your browser: https://crashout-euq.pages.dev
```

**Tags:** multiplayer, browser, strategy, competitive, free

**Why it works:** itch.io audiences respect honesty about what a game is. "Play money only" is a feature here, not a disclaimer — it lowers the barrier to entry completely. The philosophical framing ("competitive sport, not slot machine") positions it for sharing.

---

### Channel 4 — X/Twitter (thread)

**Tweet 1:**
```
Built a crash game where you duel a real person instead of the house.

Free. Browser. No crypto needed.

The difference is insane.

🧵
```

**Tweet 2:**
```
In a normal crash game, you're watching a number go up and deciding when to click.

You're alone. It's you vs. math.

In CRASHOUT, there's someone else on the same curve. They're making the same call. You can feel them hesitating.

That changes everything.
```

**Tweet 3:**
```
Hold longer than your opponent and they detonate.

Cash out too early and watch them collect while you walk away with scraps.

It's not gambling — it's a duel. Play money only.

Try it free 👇
https://crashout-euq.pages.dev
```

**Why it works:** Three-tweet thread lets the hook breathe. Tweet 1 is the scroll-stopper — "real person instead of the house" is the differentiator in one line. Tweets 2–3 explain the psychology. No hype words ("amazing," "game-changing"). Honest about play money.

---

## 4. Landing Experience Audit

**What was audited:** `curl https://crashout-euq.pages.dev` (HTML source), og.png confirmed present in `/public/`.

**Findings — ranked by impact:**

### Fix #1 (Highest Impact): Add og:description and og:image meta tags

The `<head>` contains only `<title>CRASHOUT — 1v1 Crash Duel</title>`. There is no `<meta name="description">`, no `<meta property="og:description">`, no `<meta property="og:image">` pointing to `og.png`.

When someone shares the URL on Discord, Reddit, X, iMessage, or Slack, no preview card renders — just a bare link. For a game that lives or dies on word-of-mouth sharing, this is the highest-leverage single fix.

**Recommended additions:**
```html
<meta name="description" content="1v1 crash duel in the browser. Play against a real person, not the house. Free — no real money." />
<meta property="og:title" content="CRASHOUT — 1v1 Crash Duel" />
<meta property="og:description" content="Duel a real person on the same crash curve. Hold your nerve or detonate. Free, no crypto needed." />
<meta property="og:image" content="https://crashout-euq.pages.dev/og.png" />
<meta property="og:url" content="https://crashout-euq.pages.dev" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://crashout-euq.pages.dev/og.png" />
```

---

### Fix #2 (Medium Impact): Refine the `<title>` tag

Current: `CRASHOUT — 1v1 Crash Duel`

The title is decent but misses the "vs real player" hook and "free" qualifier that differentiate it from gambling sites. Search results and browser tabs show this text.

**Recommended:**
```
CRASHOUT — Duel a Real Player in a Live Crash Game (Free)
```

This is still under 60 characters, surfaces the human-vs-human differentiator, and pre-qualifies with "Free" to lower the click barrier.

---

### Fix #3 (Lower Impact but Easy): Add `<meta name="robots">` and canonical URL

Currently there are no SEO directives. If the page eventually gets indexed, the lack of a canonical URL can cause duplicate indexing issues. Not urgent for Day 1, but costs 2 lines to add.

**Recommended:**
```html
<link rel="canonical" href="https://crashout-euq.pages.dev/" />
<meta name="robots" content="index, follow" />
```

---

## 5. Distribution Calendar (Week 1)

| Day | Action |
|-----|--------|
| Day 1 | Ship og:image + meta fixes (10 min). This must be done before any post goes live. |
| Day 2 | Post to r/WebGames. Monitor comments. Reply to every one. |
| Day 3 | Post Show HN. Be present for the first 2 hours. |
| Day 4–5 | Create itch.io page. Submit to the "newly released" section. |
| Day 6 | Post Twitter thread. Tag 2–3 crash game communities. |
| Day 7 | Measure: unique sessions, rematch rate, any Discord/Reddit mentions. |

**The metric that matters this week:** Did any player share the URL unprompted? That's the signal. Everything else is noise.

---

*Output: docs/marketing/cycle23-launch-kit.md — Cycle 23, Marketing (Seth Godin)*
