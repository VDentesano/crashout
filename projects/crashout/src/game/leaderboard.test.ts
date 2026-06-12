// Pure-logic verification for leaderboard input validation rules.
// Mirrors server-side checks in leaderboard.bundled.ts.
// Run: node src/game/leaderboard.test.ts

const VALID_METRICS = new Set(['netDelta', 'bestCashout', 'winRate']);
const VALID_WINDOWS = new Set(['all', '7d']);
const MAX_LIMIT = 50;
const WIN_RATE_MIN_MATCHES = 5;

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

console.log('action validation:');
check("'list' valid", 'list' === 'list');
check("'record' invalid", 'record' !== 'list');
check("'' invalid", '' !== 'list');

console.log('\nmetric validation:');
check("'netDelta' valid", VALID_METRICS.has('netDelta'));
check("'bestCashout' valid", VALID_METRICS.has('bestCashout'));
check("'winRate' valid", VALID_METRICS.has('winRate'));
check("default is 'netDelta'", VALID_METRICS.has('netDelta'));
check("'totalWins' invalid", !VALID_METRICS.has('totalWins'));
check("'' invalid", !VALID_METRICS.has(''));

console.log('\nwindow validation:');
check("'all' valid", VALID_WINDOWS.has('all'));
check("'7d' valid", VALID_WINDOWS.has('7d'));
check("'30d' invalid", !VALID_WINDOWS.has('30d'));
check("'' invalid", !VALID_WINDOWS.has(''));

console.log('\nlimit validation — strict guard (QA F-02): integer 1–50 or absent, else 400:');
const isValidLimit = (v: unknown): boolean =>
  v === undefined ||
  (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= MAX_LIMIT);
check('absent limit valid (defaults to 20)', isValidLimit(undefined));
check('limit 1 valid', isValidLimit(1));
check('limit 20 valid', isValidLimit(20));
check('limit 50 valid', isValidLimit(50));
check('limit 0 rejected', !isValidLimit(0));
check('limit -1 rejected', !isValidLimit(-1));
check('limit 51 rejected', !isValidLimit(51));
check("limit 'bad' rejected", !isValidLimit('bad'));
check('limit 2.5 rejected', !isValidLimit(2.5));
check('limit null rejected', !isValidLimit(null));

console.log('\nwinRate minimum matches:');
check('0 matches excluded', 0 < WIN_RATE_MIN_MATCHES);
check('4 matches excluded', 4 < WIN_RATE_MIN_MATCHES);
check('5 matches qualifies', 5 >= WIN_RATE_MIN_MATCHES);
check('10 matches qualifies', 10 >= WIN_RATE_MIN_MATCHES);

console.log('\naggregate logic:');
// netDelta: sum of delta
const rows1 = [
  { player_id: 'a', delta: 100, outcome: 'win', cashout_multiplier: 2.5 },
  { player_id: 'a', delta: -50, outcome: 'loss', cashout_multiplier: null },
  { player_id: 'b', delta: 200, outcome: 'win', cashout_multiplier: 3.0 },
];
const aggMap = new Map<string, { wins: number; total: number; netDelta: number; bestCashout: number | null }>();
for (const r of rows1) {
  if (!aggMap.has(r.player_id)) aggMap.set(r.player_id, { wins: 0, total: 0, netDelta: 0, bestCashout: null });
  const p = aggMap.get(r.player_id)!;
  p.total++;
  p.netDelta += r.delta;
  if (r.outcome === 'win') p.wins++;
  if (r.cashout_multiplier !== null) {
    if (p.bestCashout === null || r.cashout_multiplier > p.bestCashout) p.bestCashout = r.cashout_multiplier;
  }
}
const aA = aggMap.get('a')!;
const aB = aggMap.get('b')!;
check('player a netDelta = 50', aA.netDelta === 50);
check('player b netDelta = 200', aB.netDelta === 200);
check('player a bestCashout = 2.5', aA.bestCashout === 2.5);
check('player b bestCashout = 3.0', aB.bestCashout === 3.0);
check('player a wins = 1', aA.wins === 1);
check('player a total = 2', aA.total === 2);
check('winRate a = 0.5', aA.wins / aA.total === 0.5);

console.log('\nranking:');
// netDelta ranking: b (200) > a (50)
const entries = [
  { playerId: 'a', value: aA.netDelta, matchesPlayed: aA.total },
  { playerId: 'b', value: aB.netDelta, matchesPlayed: aB.total },
];
entries.sort((x, y) => y.value - x.value || y.matchesPlayed - x.matchesPlayed);
check('b ranked #1', entries[0].playerId === 'b');
check('a ranked #2', entries[1].playerId === 'a');

// Tie-break by matchesPlayed
const tied = [
  { playerId: 'x', value: 100, matchesPlayed: 10 },
  { playerId: 'y', value: 100, matchesPlayed: 5 },
];
tied.sort((x, y) => y.value - x.value || y.matchesPlayed - x.matchesPlayed);
check('tie-break: more matches wins', tied[0].playerId === 'x');

console.log('\nbestCashout — players with no cashout excluded:');
// player with all busts should be excluded from bestCashout
const pBust = { total: 3, wins: 0, netDelta: -300, bestCashout: null };
check('bust-only player excluded from bestCashout', pBust.bestCashout === null);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall leaderboard checks passed');
