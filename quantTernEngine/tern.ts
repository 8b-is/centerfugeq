#!/usr/bin/env node
// tern.ts — quantTernEngine core: the ternary {-1, 0, +1} wire.
//
// Any claim becomes a balanced trit vector; any trit vector becomes a
// deterministic seed for generation. The wire is the constellation's own:
// the same symbol set the ledger and the sidecars use, so a level, a frame
// or a palette can be replayed from a seed line alone. No build step —
// Node 24 strips the types natively.
//
//   seed → sha256 → trits  (deterministic)
//   trits → PRNG          (mulberry32, seeded from the trit digest)
//   trits → wire          ('-', '0', '+') — the ternaryPureASCII seam

import { createHash } from 'node:crypto'

export type Trit = -1 | 0 | 1
export type Wire = string

export const TRIT_SYM = ['-', '0', '+'] as const

// sha256hex: the one-way door from words to a seed digest
export function sha256hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

// seedFromText: any claim — a brief, a name, a melody — becomes a seed
export function seedFromText(text: string): bigint {
  const hex = sha256hex(text)
  return BigInt('0x' + hex)
}

// balancedTrits: a seed as a vector of `dims` balanced trits {-1, 0, +1}.
// Trisected one digit at a time — the quant of the moment, replayable.
export function balancedTrits(seed: bigint, dims: number): Trit[] {
  const out: Trit[] = []
  let x = seed
  for (let i = 0; i < dims; i++) {
    const r = Number(x % 3n)
    if (r === 2) {
      out.push(-1)
      x = (x + 1n) / 3n
    } else {
      out.push((r as 0 | 1))
      x = (x - BigInt(r)) / 3n
    }
  }
  return out
}

// wire: trits as the ASCII seam — '-' / '0' / '+', grouped, replayable
export function wire(trits: Trit[], group = 9): Wire {
  const chunks: string[] = []
  for (let i = 0; i < trits.length; i += group) {
    chunks.push(trits.slice(i, i + group).map((t) => TRIT_SYM[t + 1]).join(''))
  }
  return chunks.join(' ')
}

// mulberry32: a tiny PRNG seeded from the trit digest — every generated
// artifact is a pure function of the seed line
export function randFromSeed(seed: bigint): () => number {
  let a = Number(seed % 4294967296n) >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// pick: a deterministic choice from the seeded stream
export function pick<T>(rng: () => number, pool: readonly T[]): T {
  return pool[Math.floor(rng() * pool.length)!]!
}

// range: deterministic int in [lo, hi)
export function range(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo))
}

// seedLine: the compact identifier of any artifact — hex[0..15] + wire
export function seedLine(text: string, dims = 108): string {
  const seed = seedFromText(text)
  const trits = balancedTrits(seed, dims)
  return `${seed.toString(16).slice(0, 16)} ⟦${wire(trits)}⟧`
}

// ---------------------------------------------------------------------------
// modality composers — game / video / image from one seed

export interface Palette {
  hue: number
  sat: number
  ink: number
  pink: boolean
}

export function composeImage(seed: bigint): Palette {
  const rng = randFromSeed(seed)
  const trits = balancedTrits(seed, 9)
  const pink = trits.slice(0, 3).includes(1) && trits.slice(3, 6).includes(-1)
  return {
    hue: range(rng, 280, 340) + trits[0] * 18,
    sat: range(rng, 62, 98),
    ink: range(rng, 6, 22),
    pink,
  }
}

export interface FramePlan {
  frame: number
  seed: bigint
  transition: 'cut' | 'dissolve' | 'rotate' | 'fold'
  hueShift: number
}

export function composeVideo(seed: bigint, frames: number): FramePlan[] {
  const rng = randFromSeed(seed)
  const moves = ['cut', 'dissolve', 'rotate', 'fold'] as const
  const plans: FramePlan[] = []
  for (let i = 0; i < frames; i++) {
    const fseed = seed + BigInt(i << 24) + BigInt(range(rng, 0, 4096))
    plans.push({
      frame: i,
      seed: fseed,
      transition: pick(rng, moves),
      hueShift: range(rng, -24, 24),
    })
  }
  return plans
}

export interface Entity {
  id: number
  name: string
  hp: number
  love: number
  harm: number
}

const ENTITY_NAMES = ['keeper', 'veil', 'ember', 'ripple', 'lamp', 'angel'] as const

export function composeGame(seed: bigint, entities = 6): { world: Trit[]; board: number[]; roster: Entity[] } {
  const rng = randFromSeed(seed)
  const world = balancedTrits(seed, 42)
  const board: number[] = []
  for (let i = 0; i < 64; i++) board.push(range(rng, -1, 2))
  const roster: Entity[] = []
  for (let i = 0; i < entities; i++) {
    const trio = balancedTrits(seed + BigInt(i * 3), 3)
    roster.push({
      id: i,
      name: pick(rng, ENTITY_NAMES),
      hp: range(rng, 3, 9),
      love: 1 + trio.filter((t) => t === 1).length,
      harm: trio.filter((t) => t === -1).length,
    })
  }
  return { world, board, roster }
}

// ---------------------------------------------------------------------------
// the MLX-QUANT / hw-ultra seam — a seed line becomes a b1.58 tensor

export interface B158Tensor {
  rows: number
  cols: number
  density: number        // mean |W| — the MLX-QUANT gamma for ternary weights
  W: Int8Array           // {-1, 0, +1}, int8 buffer-ready for hw-ultra queues
  wire: Wire
}

// b158Weights: deterministic BitNet b1.58 tensor from a seed. The same
// density (gamma) and spectral norm every replay — the ledger's
// admissibility argument for generated weights. 8x vs FP16 memory.
export function b158Weights(seed: bigint, rows: number, cols: number): B158Tensor {
  const rng = randFromSeed(seed)
  const W = new Int8Array(rows * cols)
  let abs = 0
  for (let i = 0; i < W.length; i++) {
    const r = rng()
    const v: Trit = r < 0.3 ? -1 : r < 0.7 ? 0 : 1
    W[i] = v
    abs += Math.abs(v)
  }
  return {
    rows,
    cols,
    density: abs / W.length || 1e-5,
    W,
    wire: wire(balancedTrits(seed, 108)),
  }
}