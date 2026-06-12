// Pure-logic verification for the gate-critical paths.
// Run: node src/game/logic.test.ts
import { crashPointFromHash } from './crashEngine.ts';
import { decideMatch, decideOutcome, resolveGhost, roundScore, scoreMatch } from './ghosts.ts';
import type { Cashout, Ghost } from './types.ts';

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

console.log('decideOutcome — winner = highest VALID cash-out, bust never wins:');
check('player cashes, ghost busts → win', decideOutcome({ multiplier: 1.2 }, { multiplier: null }) === 'win');
check('player busts, ghost cashes → loss', decideOutcome({ multiplier: null }, { multiplier: 2.0 }) === 'loss');
check('both bust → draw', decideOutcome({ multiplier: null }, { multiplier: null }) === 'draw');
check('player higher → win', decideOutcome({ multiplier: 2.5 }, { multiplier: 1.8 }) === 'win');
check('player lower → loss', decideOutcome({ multiplier: 1.3 }, { multiplier: 1.8 }) === 'loss');
check('equal → draw', decideOutcome({ multiplier: 2.0 }, { multiplier: 2.0 }) === 'draw');

console.log('\nresolveGhost — ghost cashes iff intent < crash point:');
const greedy: Ghost = { id: 'a', name: 'g', intent: 2.5 };
const meek: Ghost = { id: 'b', name: 'g', intent: 1.3 };
const rider: Ghost = { id: 'c', name: 'g', intent: null };
check('intent 2.5 vs crash 3.0 → cashes 2.5', resolveGhost(greedy, 3.0).multiplier === 2.5);
check('intent 2.5 vs crash 2.0 → bust', resolveGhost(greedy, 2.0).multiplier === null);
check('intent 1.3 vs crash 1.31 → cashes 1.3', resolveGhost(meek, 1.31).multiplier === 1.3);
check('rode-to-bust always busts', resolveGhost(rider, 99).multiplier === null);

console.log('\ncrashPointFromHash — distribution sanity (median ≈ 2x, all ≥ 1):');
// Deterministic pseudo-hashes; just assert range + rough median, not exact values.
const samples: number[] = [];
// Seeded mulberry32 → uniform float, mapped across the FULL 52-bit hash range.
let seed = 0x9e3779b9;
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
for (let i = 0; i < 20000; i++) {
  const h = Math.floor(rand() * 2 ** 52); // full-range 52-bit value
  const hash = h.toString(16).padStart(13, '0'); // first 13 hex == h
  samples.push(crashPointFromHash(hash));
}
const allValid = samples.every((m) => m >= 1.0);
samples.sort((a, b) => a - b);
const median = samples[Math.floor(samples.length / 2)];
check('all crash points ≥ 1.00', allValid);
check(`median in [1.7, 2.4] (got ${median.toFixed(2)})`, median >= 1.7 && median <= 2.4);

console.log('\nroundScore — cash-out banks its multiplier, a bust banks 0:');
check('cash 2.4 → 2.4', roundScore({ multiplier: 2.4 }) === 2.4);
check('bust → 0', roundScore({ multiplier: null }) === 0);

console.log('\nscoreMatch — banked sums all, drop-lowest drops the single worst round:');
const scores = [2.0, 0, 1.5, 3.0, 1.0]; // a 5-round run with one bust (0)
check('banked = sum of all (7.5)', scoreMatch(scores, 'banked') === 7.5);
check('drop-lowest = sum minus worst 0 (7.5)', scoreMatch([...scores], 'drop-lowest') === 7.5);
check(
  'drop-lowest with no bust drops the smallest cash-out',
  scoreMatch([2.0, 1.2, 1.5, 3.0, 1.0], 'drop-lowest') === 7.7, // drops 1.0 → 2.0+1.2+1.5+3.0
);
check('banked of all busts = 0', scoreMatch([0, 0, 0, 0, 0], 'banked') === 0);

console.log('\nscoreMatch — SYMMETRY: the same arm must score both sides by the same rule:');
// If the arm scored player and ghost differently, the gate denominator would be biased.
const playerRounds: Cashout[] = [{ multiplier: 2.0 }, { multiplier: null }, { multiplier: 1.5 }, { multiplier: 3.0 }, { multiplier: 1.0 }];
const ghostRounds: Cashout[] = [{ multiplier: 2.0 }, { multiplier: null }, { multiplier: 1.5 }, { multiplier: 3.0 }, { multiplier: 1.0 }];
for (const arm of ['banked', 'drop-lowest'] as const) {
  const ps = scoreMatch(playerRounds.map(roundScore), arm);
  const gs = scoreMatch(ghostRounds.map(roundScore), arm);
  check(`identical rounds → identical score under '${arm}' (${ps} === ${gs})`, ps === gs);
}

console.log('\ndecideMatch — higher cumulative score wins, equal = draw:');
check('player higher → win', decideMatch(8.5, 6.2) === 'win');
check('player lower → loss', decideMatch(4.0, 9.1) === 'loss');
check('equal → draw', decideMatch(7.0, 7.0) === 'draw');

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
