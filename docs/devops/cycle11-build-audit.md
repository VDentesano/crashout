# Cycle 11 — Build Pipeline Audit (DevOps / SRE)

**Owner:** devops-hightower (Kelsey Hightower model)
**Scope:** Issue 8 — "no estoy seguro si se está minificando y ofuscando"
**My lane:** the build/deploy PIPELINE — how it builds, what ships to prod, observability. (fullstack-dhh owns the in-config minifier tradeoff.)
**Method:** empirical. I opened the actual `dist/` output AND the live production response. No assertions from defaults.

---

## 1. Empirical Verdict — IS production minified/obfuscated?

**Yes. Definitively. Verified against live prod, not assumed.**

Evidence:

| Check | Result |
|---|---|
| `dist/assets/index-CHHuFa5X.js` head | `var e=(e,t)=>()=>(t\|\|...` — single-letter vars, no whitespace, no comments. Minified + mangled (esbuild default). |
| Live prod `index.html` asset ref | `assets/index-CHHuFa5X.js` — **same content-hash as local dist** → what's on disk is what's live. |
| Live prod JS head | identical minified bytes to local dist. |
| Sourcemaps in `dist/` | **None.** No `*.map` files. Source is not exposed in prod. |
| Wire transfer (Brotli) | raw 212,756 B → **67,239 B over the wire** (`content-encoding: br`). Cloudflare compresses at the edge automatically. |
| CSS | `index-C5a0e5Xp.css` 12 KB, minified. |

**Answer to the user's literal question:** the JS shipping to https://crashout-euq.pages.dev IS minified and variable-mangled, and contains no sourcemaps — so it's effectively obfuscated to a casual reader. This happens automatically via Vite's default `esbuild` minifier; the bare `vite.config.ts` (just `react()`) does not disable it. Nothing is broken here. The concern is real but the symptom is not present.

**Important nuance on "ofuscación":** esbuild minification mangles *local* variable names but does NOT obfuscate logic, string literals, or control flow. Anyone determined can read what the code does. For a client-side crash game this is the correct posture — **never put secrets, the crash seed, or fairness logic client-side and expect minification to hide it.** Minification is a size optimization, not a security control. (Flagged for fullstack-dhh / fairness design — out of my lane but worth one line.)

---

## 2. Pipeline Risk Diagnosis — the real issue

We ARE minifying. The user asked the wrong question. The right question is:

> **Does the pipeline GUARANTEE that a clean, reproducible, minified build is what ships — every time?**

Today the answer is **no, it relies on operator discipline.**

### The deploy model (verified)
```
package.json: "deploy": "pnpm build && wrangler pages deploy dist --branch main"
```
- Build runs on the **operator's local machine**.
- `wrangler pages deploy dist` uploads **whatever bytes are sitting in `dist/`** at that moment.
- There is **no CI** (`.github/workflows/` does not exist — confirmed at repo root and in `projects/crashout/`).
- Cloudflare Pages git integration is **not** wired up (current deploys are direct-upload, not git-triggered remote builds).

### Concrete risks of local-build-and-push

| Risk | Severity | Why |
|---|---|---|
| **Stale `dist/` ships** | Medium | If someone runs `wrangler pages deploy dist` without `pnpm build` first (or build fails silently mid-script), an old bundle goes live. The `deploy` script chains build, but any out-of-band `wrangler pages deploy` bypasses it. dist mtime is newer than src — fine today, but this is luck, not a guarantee. |
| **Non-reproducible build** | Medium | Build depends on the operator's local Node version, local `node_modules`, uncommitted local edits. "Works on my machine" failure mode. No record of what commit produced the live bundle. |
| **Hand-modified `dist/`** | Low | Nothing prevents editing built files and shipping them. No integrity check. |
| **No build-output verification** | Medium | Pipeline never asserts "JS is minified / under size budget / no sourcemap leaked / no `console.log` of secrets." A regression (e.g. someone sets `build.minify: false`, or `build.sourcemap: true` for debugging and forgets) ships silently. **This is the actual mechanism by which the user's fear could come true.** |
| **`.wrangler/` untracked** | Low | Present in `git status` (untracked). Confirm it's gitignored; it can contain local state. |

### Headers / caching / observability on Pages (verified live)

| Finding | Status | Note |
|---|---|---|
| Content-hashed asset cache | **Suboptimal** | `index-CHHuFa5X.js` returns `cache-control: public, max-age=0, must-revalidate`. Content-hashed assets are immutable — they should be `max-age=31536000, immutable`. Every visit re-validates instead of serving from browser cache. Wasted round-trips. |
| `index.html` cache | Correct | `max-age=0, must-revalidate` is right for the HTML entry point. |
| Compression | Good | Brotli auto-applied at edge. No action needed. |
| Security headers | Minimal | `x-content-type-options: nosniff` present (Pages default). No CSP, no HSTS — acceptable for a 0-user game, revisit before scale. |
| Observability | **None** | No error tracking, no analytics on the deployed bundle, no build-size tracking over time. We are blind to client-side JS errors in prod. |

---

## 3. Recommendations (prioritized — reject overkill, keep what earns its place)

Guiding principle: this is a **0-user game**. Most "production hardening" is premature. I'm only recommending what removes a *real* failure mode or costs near-zero. Less YAML, more shipping.

### TIER 1 — Worth doing now (low effort, removes real risk)

**1a. Cache headers for hashed assets via `_headers` file.**
Effort: 10 min. Risk: none.
Add `projects/crashout/public/_headers`:
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```
Pages picks this up automatically. Fixes the wasted-revalidation finding. Pure win, zero downside (assets are content-hashed so immutable caching is always safe).

**1b. Build-output sanity assertion in the deploy script.**
Effort: 20 min. Risk: none.
Cheapest possible guard against the "minification silently regressed" fear. Before `wrangler pages deploy`, assert the bundle looks minified and no sourcemaps leaked:
```jsonc
"deploy": "pnpm build && node scripts/verify-dist.mjs && wrangler pages deploy dist --branch main"
```
`verify-dist.mjs` (≈15 lines): fail if any `dist/**/*.map` exists, fail if main JS > a size budget (e.g. 400 KB raw), warn if JS contains long whitespace runs (un-minified signal). This directly answers the user's anxiety: the pipeline now *proves* it minified instead of trusting the default.

### TIER 2 — Worth doing when a second person/machine touches deploys, or before real traffic

**2a. Cloudflare Pages git integration (remote builds) — REPLACES local-build-push.**
Effort: 30–45 min (one-time setup in CF dashboard). Risk: low (keeps the working direct-upload as fallback during cutover).
This is the single highest-leverage fix for the *real* pipeline risk. Connect the GitHub repo to the Pages project; set build command `pnpm build`, output dir `dist`, root `projects/crashout`. Then **`git push` to main = clean, reproducible, remote-built deploy.** Eliminates stale-dist, "works on my machine," and hand-modified-dist risks in one move. Every deploy is tied to a commit SHA. This is the Hightower-approved answer: push code, infra builds it, you stop thinking about it.
*Caveat:* requires the monorepo subdirectory build setting; verify CF Pages supports the `projects/crashout` root path (it does via "root directory" setting).

**2b. Client-side error tracking.**
Effort: 30 min. Reject heavyweight APM. Sentry free tier or a 10-line `window.onerror` → existing dashboard ingest endpoint. We currently have zero visibility into prod JS errors. For a game about to seek users, flying blind on client crashes is the gap that matters more than minification.

### TIER 3 — Defer / reject for now

- **GitHub Actions CD pipeline:** Redundant with 2a (Pages git integration). Only build a GH Actions deploy if you need test gates *before* deploy that CF Pages build can't express. For now, **reject** — it's more YAML for no added safety over 2a.
- **Sourcemap upload for error tracking:** Nice-to-have *after* 2b exists. Generate sourcemaps in build but upload them privately to the error tracker (NOT to `dist/`/prod). Defer until there's traffic generating errors worth symbolicating.
- **CSP / HSTS / full security headers:** Defer to pre-scale. Add to the same `_headers` file when it matters.
- **Bundle splitting / code-split:** 212 KB raw / 67 KB Brotli single bundle is **fine.** Do not split a 67 KB-wire bundle. Premature.

---

## 4. Estimated Scope

| Item | Effort | When |
|---|---|---|
| 1a `_headers` cache rule | 10 min | Now |
| 1b `verify-dist.mjs` guard | 20 min | Now |
| 2a Pages git integration | 30–45 min (CF dashboard, one-time) | Before seeking traffic |
| 2b Error tracking | 30 min | Before seeking traffic |

**Tier 1 total: ~30 min, ships this cycle.** Tier 2: ~1.5 hr, next cycle or when traffic is imminent.

---

## 5. Dependencies

- **1a / 1b:** none — purely in-repo, no external access. Can ship immediately.
- **2a (Pages git integration):** requires **human action** — connecting the GitHub repo in the Cloudflare dashboard needs account access (escalation trigger per CLAUDE.md: infra config). Agent can prep the build settings; human flips the switch. Verify monorepo root-directory support.
- **2b (error tracking):** if Sentry → new account/DSN (human, free tier). If reusing the dashboard ingest endpoint → no dependency, agent can wire it.
- **fullstack-dhh:** owns whether to make minification *explicit* in `vite.config.ts` (vs. relying on default) — coordinate so 1b's guard and his config choice agree.
- **Fairness/security:** the "minification ≠ obfuscation ≠ security" note (§1) must reach whoever owns the crash-fairness design. Out of my lane, flagged.

---

## 6. Honest Take

Is the deploy pipeline production-grade enough to drive traffic? **Half.** The *output* is genuinely fine — prod is minified, Brotli-compressed, no sourcemap leak, single small bundle, verified live. A user hitting the site gets a clean, fast, obfuscated bundle. But the *pipeline* is a hand-cranked `pnpm build && wrangler pages deploy` from one person's laptop with zero CI, zero build verification, and zero prod error visibility. That's acceptable for a 0-user game and I would NOT over-engineer it — but the moment we point real traffic at CRASHOUT, the manual local build becomes a genuine liability: a stale or accidentally-misconfigured bundle can ship with nothing to catch it, and if it breaks in someone's browser we won't even know. The fix is cheap and Hightower-shaped: a 30-minute `_headers` + verify-dist guard now, then move the build off the laptop onto Cloudflare Pages git integration before launch so `git push` is the only deploy action a human ever takes. Do that and "are we minifying?" stops being a question anyone can ever ask again, because the pipeline answers it on every deploy.
