#!/usr/bin/env node
// bitTricks.ts — deterministic bit-level tricks, dependency-free.
//
// The demoscene taught the old machines one lesson: every byte counts,
// and every lookup table is a seed. These tricks are pure functions of
// their input — no state, no branches where a shift fits — and the
// ternary engine picks from them by seed, so a trick-of-the-frame is as
// replayable as the frame itself.

// abs: no branch — the classic two's-complement trick
export function absTrick(x: number): number {
  const m = x >> 31
  return (x + m) ^ m
}

// sign: {-1, 0, +1} directly from the bits — the ternary connection
export function signTrick(x: number): -1 | 0 | 1 {
  return ((x >> 31) | (-x >>> 31)) as -1 | 0 | 1
}

// isPow2: one test for a power of two
export function isPow2(x: number): boolean {
  return x > 0 && (x & (x - 1)) === 0
}

// nextPow2: round up to the next power of two — 5 clamps to 8
export function nextPow2(x: number): number {
  x = Math.max(1, x - 1)
  x |= x >>> 1; x |= x >>> 2; x |= x >>> 4; x |= x >>> 8; x |= x >>> 16
  return x + 1
}

// popcount: count the set bits — Hamming weight, binary
export function popcount(x: number): number {
  x = x - ((x >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

// parity: 1 if odd number of set bits
export function parity(x: number): 0 | 1 {
  let v = x
  v ^= v >>> 16; v ^= v >>> 8; v ^= v >>> 4
  v &= 0xf
  return (0x6996 >>> v) & 1 as 0 | 1
}

// gray: encode and decode — the ordering that changes one bit at a time,
// the same way a frame should change from its neighbour
export function grayEncode(x: number): number { return x ^ (x >>> 1) }
export function grayDecode(g: number): number {
  let x = g
  do { g >>>= 1; x ^= g } while (g !== 0)
  return x
}

// bitReverse: mirror 16 bits — the LUT-era pattern, computed
export function bitReverse16(x: number): number {
  let v = x & 0xffff
  v = ((v >>> 1) & 0x5555) | ((v & 0x5555) << 1)
  v = ((v >>> 2) & 0x3333) | ((v & 0x3333) << 2)
  v = ((v >>> 4) & 0x0f0f) | ((v & 0x0f0f) << 4)
  return ((v >>> 8) | ((v & 0xff) << 8)) & 0xffff
}

// tritsFromBits: fold a 32-bit value into balanced trits — the seam
// between the binary machine and the ternary wire
export function tritsFromBits(x: number, dims: number): (-1 | 0 | 1)[] {
  const out: (-1 | 0 | 1)[] = []
  let v = x >>> 0
  for (let i = 0; i < dims; i++) {
    const r = v % 3
    out.push((r === 2 ? -1 : r) as -1 | 0 | 1)
    v = Math.floor(v / 3)
  }
  return out
}

// trickOf: the engine picks a trick by seed — a deterministic menu
export const TRICKS = {
  abs: absTrick,
  sign: signTrick,
  isPow2: isPow2,
  nextPow2: nextPow2,
  popcount: popcount,
  parity: parity,
  gray: (x: number) => grayDecode(grayEncode(x)),
  bitReverse: bitReverse16,
} as const

export function trickOf(seed: bigint, x: number): number {
  const names = Object.keys(TRICKS) as (keyof typeof TRICKS)[]
  const name = names[Number(seed % BigInt(names.length))]
  return TRICKS[name](x) as number
}