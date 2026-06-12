// Pure-logic verification for mute-preference resolution.
// Run: node src/audio/prefs.test.ts
import { resolveMuted } from './prefs.ts';

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

console.log('resolveMuted — explicit choice wins, reduced-motion only defaults:');
// Explicit override beats reduced-motion in both directions.
check('stored "0" stays unmuted even under reduced-motion', resolveMuted('0', true) === false);
check('stored "1" stays muted even without reduced-motion', resolveMuted('1', false) === true);
// Unset → reduced-motion is the default.
check('unset + reduced-motion → muted', resolveMuted(null, true) === true);
check('unset + no reduced-motion → unmuted', resolveMuted(null, false) === false);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall audio-pref checks passed');
