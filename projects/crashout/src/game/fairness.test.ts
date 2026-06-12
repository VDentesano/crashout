// Round-trip verification for the provably-fair scheme — the one claim that IS
// the product. Gates all fairness marketing: an honest reveal must verify, and
// any tampering (seed OR crash point) must be rejected.
// Run: node src/game/fairness.test.ts
import { generateRound, verifyReveal } from './crashEngine.ts';

let failures = 0;
function check(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${name}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

const reveal = await generateRound('player-client-seed', 7);

console.log('verifyReveal — honest reveal verifies, tampering is rejected:');

// 1. Honest round-trip: the revealed seed hashes to its commitment and the
//    crash point was derived from it (not chosen) → verifies true.
check('honest reveal → true', (await verifyReveal(reveal)) === true);

// 2. Tampered server seed: a swapped seed no longer hashes to the committed
//    serverSeedHash → the commitment check fails → false.
check(
  'tampered serverSeed → false',
  (await verifyReveal({ ...reveal, serverSeed: reveal.serverSeed.replace(/.$/, (c) => (c === '0' ? '1' : '0')) })) === false,
);

// 3. Tampered crash point: the seed still hashes correctly, but the claimed
//    crash point no longer matches the value derived from the seed → false.
//    This is the attack the scheme exists to catch: a server picking the result.
check('tampered crashPoint → false', (await verifyReveal({ ...reveal, crashPoint: reveal.crashPoint + 0.5 })) === false);

// 4. Tampered client seed: re-deriving with a different client seed yields a
//    different round hash → derived crash point no longer matches → false.
check('tampered clientSeed → false', (await verifyReveal({ ...reveal, clientSeed: 'attacker-seed' })) === false);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
