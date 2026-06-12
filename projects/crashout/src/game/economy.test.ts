// Pure-logic verification for economy helpers.
// Run: node src/game/economy.test.ts
import { applyDelta, BET_OPTIONS_SET, computeDelta, reconcileBalance } from './economy.pure.ts';

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

console.log('computeDelta — win/loss/draw:');
check('win  +100', computeDelta('win', 100) === 100);
check('loss -100', computeDelta('loss', 100) === -100);
check('draw   0', computeDelta('draw', 100) === 0);
check('win  +500', computeDelta('win', 500) === 500);

console.log('\napplyDelta — clamp at 0:');
check('1000 + 100 = 1100', applyDelta(1000, 100) === 1100);
check('100 - 200 clamps to 0', applyDelta(100, -200) === 0);
check('0 + 0 = 0', applyDelta(0, 0) === 0);

console.log('\nreconcileBalance — server wins, negative clamped:');
check('positive value returned as-is', reconcileBalance(750) === 750);
check('zero is valid', reconcileBalance(0) === 0);
check('negative server value clamped to 0', reconcileBalance(-5) === 0);

console.log('\nBET_OPTIONS_SET — valid bets:');
check('50 is valid', BET_OPTIONS_SET.has(50));
check('100 is valid', BET_OPTIONS_SET.has(100));
check('250 is valid', BET_OPTIONS_SET.has(250));
check('500 is valid', BET_OPTIONS_SET.has(500));
check('75 is not valid', !BET_OPTIONS_SET.has(75));
check('1000 is not valid', !BET_OPTIONS_SET.has(1000));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall economy checks passed');
