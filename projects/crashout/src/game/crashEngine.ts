// Provably-fair crash engine.
//
// The crash point is derived deterministically from an HMAC-SHA256 over a
// server seed (committed via its hash BEFORE the round) and a client seed.
// Anyone can re-run `crashPointFromHash` on the revealed seeds to verify the
// round was not manipulated. This is the standard bustabit-style scheme.

import type { FairProof } from './types';

/** Growth rate of the multiplier, per millisecond. Tuned so 2.00x ≈ 5.8s. */
export const GROWTH_RATE = 0.00012;

/** ~3% instant-bust rate — the only house edge, here purely cosmetic (play money). */
const INSTANT_BUST_DIVISOR = 33;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}

async function hmacSha256Hex(key: string, msg: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg)));
}

/** Map a hex hash to a crash multiplier with a ~1/x distribution (median ≈ 2x). */
export function crashPointFromHash(hash: string): number {
  const h = parseInt(hash.slice(0, 13), 16); // 52 bits
  if (h % INSTANT_BUST_DIVISOR === 0) return 1.0;
  const e = 2 ** 52;
  return Math.floor((100 * e - h) / (e - h)) / 100;
}

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a fresh, fully-verifiable round. */
export async function generateRound(clientSeed: string, nonce: number): Promise<FairProof> {
  const serverSeed = randomHex(32);
  const serverSeedHash = await sha256Hex(serverSeed);
  const roundHash = await hmacSha256Hex(serverSeed, `${clientSeed}:${nonce}`);
  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    crashPoint: crashPointFromHash(roundHash),
  };
}

/**
 * Verify a revealed round: the server's seed hashes to its committed hash, and
 * the crash point was derived from it (not chosen). This is what makes the
 * "PROVABLY FAIR" claim true — anyone can re-run it on the revealed seeds.
 */
export async function verifyReveal(r: {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
}): Promise<boolean> {
  const hashOK = (await sha256Hex(r.serverSeed)) === r.serverSeedHash;
  const roundHash = await hmacSha256Hex(r.serverSeed, `${r.clientSeed}:${r.nonce}`);
  const crashOK = crashPointFromHash(roundHash) === r.crashPoint;
  return hashOK && crashOK;
}

/** Multiplier shown at elapsed time `ms` into the round. */
export function multiplierAt(ms: number): number {
  return Math.floor(100 * Math.exp(GROWTH_RATE * ms)) / 100;
}

/** Milliseconds until the multiplier reaches `target`. */
export function timeToReach(target: number): number {
  return Math.log(target) / GROWTH_RATE;
}
