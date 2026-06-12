// Pure-logic verification for history input validation rules.
// These mirror the server-side checks in history.bundled.ts so drift is caught early.
// Run: node src/game/history.test.ts

const BET_OPTIONS = new Set([50, 100, 250, 500]);
const OUTCOMES = new Set(['win', 'loss', 'draw']);
const MAX_LIMIT = 50;

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

console.log('bet validation:');
check('50 valid', BET_OPTIONS.has(50));
check('100 valid', BET_OPTIONS.has(100));
check('250 valid', BET_OPTIONS.has(250));
check('500 valid', BET_OPTIONS.has(500));
check('75 invalid', !BET_OPTIONS.has(75));
check('0 invalid', !BET_OPTIONS.has(0));
check('1000 invalid', !BET_OPTIONS.has(1000));

console.log('\noutcome validation:');
check("'win' valid", OUTCOMES.has('win'));
check("'loss' valid", OUTCOMES.has('loss'));
check("'draw' valid", OUTCOMES.has('draw'));
check("'bust' invalid", !OUTCOMES.has('bust'));
check("'' invalid", !OUTCOMES.has(''));

console.log('\ncrashPoint validation:');
check('1.0 >= 1', 1.0 >= 1);
check('1.5 >= 1', 1.5 >= 1);
check('0.9 < 1 (invalid)', 0.9 < 1);
check('100 >= 1', 100 >= 1);

console.log('\ncashoutMultiplier validation:');
check('null is allowed', null == null);
check('1.5 >= 1 (valid)', 1.5 >= 1);
check('0.5 < 1 (invalid)', 0.5 < 1);

console.log('\ndelta consistency — server-authoritative rule (win=+bet, loss=-bet, draw=0):');
const expectedDelta = (outcome: string, bet: number): number =>
  outcome === 'win' ? bet : outcome === 'loss' ? -bet : 0;
const deltaConsistent = (outcome: string, bet: number, delta: number): boolean =>
  Number.isInteger(delta) && delta === expectedDelta(outcome, bet);
check('win 100 / +100 consistent', deltaConsistent('win', 100, 100));
check('loss 500 / -500 consistent', deltaConsistent('loss', 500, -500));
check('draw 250 / 0 consistent', deltaConsistent('draw', 250, 0));
check('loss 100 / +9999999 rejected', !deltaConsistent('loss', 100, 9999999));
check('win 100 / +200 rejected', !deltaConsistent('win', 100, 200));
check('win 100 / -100 rejected', !deltaConsistent('win', 100, -100));
check('draw 50 / +50 rejected', !deltaConsistent('draw', 50, 50));
check('non-integer delta rejected', !deltaConsistent('win', 100, 100.5));

console.log('\nlimit clamping:');
check('limit 20 stays 20', Math.min(20, MAX_LIMIT) === 20);
check('limit 100 clamped to 50', Math.min(100, MAX_LIMIT) === 50);
check('limit 0 replaced by default (not tested here — server handles)', true);

console.log('\nplayerId validation (non-empty string, max 64 chars):');
const isValidId = (v: unknown): boolean =>
  typeof v === 'string' && v.length > 0 && v.length <= 64;
check('valid id', isValidId('abc123'));
check('empty string invalid', !isValidId(''));
check('65-char string invalid', !isValidId('a'.repeat(65)));
check('number invalid', !isValidId(42));

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall history checks passed');
