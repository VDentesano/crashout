// CRASHOUT audio — fully synthesized via Web Audio (no asset pipeline, tiny
// bundle). Framework-agnostic singleton: React talks to it through useGameAudio.
//
// Three constraints shape this file:
//  • Mobile autoplay: the AudioContext starts 'suspended'. We resume it on the
//    FIRST user gesture via one-shot global listeners — robust to whichever
//    control the player touches first (ENTER DUEL, onboarding dismiss, a key).
//  • Mute is persisted; prefers-reduced-motion is only the default (see prefs).
//  • The rising tick is a self-rescheduling scheduler (never per-frame).
import { MUTE_KEY, resolveMuted } from './prefs';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

let muted = false;
(function initMuted() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(MUTE_KEY) : null;
  const rm =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  muted = resolveMuted(stored, rm);
})();

// ── First-gesture unlock ──────────────────────────────────────────────
// One global listener per gesture type, self-removing. Catches the first
// interaction regardless of which control it was.
function unlock() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') void c.resume();
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

// ── Synthesis primitives ──────────────────────────────────────────────
type Wave = OscillatorType;

/** A single enveloped tone. Exponential ramps avoid click artifacts. */
function tone(freq: number, dur: number, delay: number, type: Wave, peak: number) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** A pitch-swept tone — used for the crash plunge. */
function sweep(f0: number, f1: number, dur: number, type: Wave, peak: number) {
  const c = ensureCtx();
  if (!c || !master) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// ── Rising tick (self-rescheduling) ───────────────────────────────────
let tickTimer: ReturnType<typeof setTimeout> | null = null;
let getLevel: () => number = () => 1;

function tickStep() {
  if (muted) {
    tickTimer = null;
    return;
  }
  const lvl = Math.min(Math.max(getLevel(), 1), 25);
  // Pitch climbs with the multiplier; cadence tightens as the stakes rise.
  tone(200 + (lvl - 1) * 45, 0.045, 0, 'square', 0.1);
  tickTimer = setTimeout(tickStep, Math.max(55, 360 / lvl));
}

// ── Public API ────────────────────────────────────────────────────────
export const audio = {
  get muted() {
    return muted;
  },
  setMuted(m: boolean) {
    muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* storage blocked — keep the in-memory choice */
    }
    if (m) audio.stopTicks();
  },
  toggle(): boolean {
    audio.setMuted(!muted);
    return muted;
  },

  /** Begin the rising tick. `getter` returns the live multiplier each step. */
  startTicks(getter: () => number) {
    getLevel = getter;
    if (muted || tickTimer) return;
    tickStep();
  },
  stopTicks() {
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  },

  /** Player banked a round — bright rising two-note chime. */
  cashout() {
    if (muted) return;
    tone(660, 0.12, 0, 'sine', 0.4);
    tone(990, 0.16, 0.07, 'sine', 0.32);
  },
  /** Player busted — low plunge. */
  crash() {
    if (muted) return;
    sweep(180, 38, 0.5, 'sawtooth', 0.45);
    tone(70, 0.32, 0, 'sine', 0.35);
  },
  /** Match won — four-note ascending fanfare. */
  win() {
    if (muted) return;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, i * 0.09, 'triangle', 0.34));
  },
  /** Match lost / drawn (no bust) — soft descending sigh. */
  lose() {
    if (muted) return;
    tone(330, 0.2, 0, 'sine', 0.28);
    tone(247, 0.28, 0.12, 'sine', 0.26);
  },
};
