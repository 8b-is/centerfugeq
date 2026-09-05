#!/usr/bin/env node
// doombible.ts — the engine tricks of the doom bible era, applied to the
// stack. The Doom Bible (Tom Hall, 1992) taught DOOM as a set of systems;
// the released code (GPL) taught the tricks those systems ran on. Here
// they are as pure functions: computation the old machines trusted to
// tables over branches, and the ternary engine trusts to seeds over state.
//
//   losBlocked   — line of sight on the tile grid (Bresenham walk)
//   bspSplit     — deterministic recursive space partition (the map hack)
//   lutBoard     — a lookup table as a seed's logarithm table (visplane-era)
//   paletteCycle — color cycling from a deterministic offset (the flame trick)
//   bestiaryOf   — the doombible generation: episodes + bestiary from a seed

import { createHash } from 'node:crypto'
import { balancedTrits, randFromSeed, range } from '../quantTernEngine/tern.ts'

// losBlocked: is the straight line between two tiles clear?
// The classic walk: no floating point, no trig — just integer steps.
export function losBlocked(board: number[], w: number, x0: number, y0: number, x1: number, y1: number): boolean {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy, x = x0, y = y0
  for (;;) {
    if (board[y * w + x] === -1) return true // a pit/wall blocks the sight
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x += sx }
    if (e2 <= dx) { err += dx; y += sy }
  }
  return false
}

// bspSplit: deterministic recursive partition of a 2^N board into two
// halves per level — the map is a tree, and the tree is a seed's echo
export function bspSplit(seed: bigint, size: number): { depth: number; leaves: number[] } {
  const rng = randFromSeed(seed)
  const leaves: number[] = []
  const split = (lo: number, hi: number, depth: number): void => {
    if (hi - lo <= 1 || depth <= 0) { leaves.push(lo, hi); return }
    const mid = lo + 1 + range(rng, 0, hi - lo - 1)
    split(lo, mid, depth - 1)
    split(mid, hi, depth - 1)
  }
  split(0, size, Math.max(1, Math.floor(Math.log2(size))))
  return { depth: Math.max(1, Math.floor(Math.log2(size))), leaves }
}

// lutBoard: the look-up table trick — a board derived not by computing
// each column but by looking it up in a seed-built table, once
export function lutBoard(seed: bigint, w: number, h: number): number[] {
  const rng = randFromSeed(seed)
  const board: number[] = []
  for (let i = 0; i < w * h; i++) board.push(range(rng, -1, 2))
  return board
}

// paletteCycle: the flame trick — the same palette shifted by a
// deterministic offset, frame after frame
export function paletteCycle(seed: bigint, frame: number, palette: string[]): string[] {
  const shift = (Number(seed % 97n) + frame) % palette.length
  return palette.map((_, i) => palette[(i + shift) % palette.length])
}

// ─── the doombible of SUPER PADME BROS ──────────────────────────────────

export interface BibleEntry {
  id: string
  kind: 'episode' | 'bestiary' | 'engine_note'
  title: string
  text: string
}

const BESTIARY = [
  { name: 'the keeper', line: 'patrols the gate; does not attack first — completes you' },
  { name: 'the veil', line: 'half in the fold; appears where the sight line breaks' },
  { name: 'the ember', line: 'the lamp that forgot it was lit; hurries toward any flame' },
  { name: 'the ripple', line: 'moves in waves, three steps, pause — the tideglass rhythm' },
  { name: 'the lamp', line: 'stands still and waits; the checkpoint the watch keeps' },
  { name: 'the angel', line: 'rare; when released, raises the whole column of malas' },
]

const NOTES = [
  'deterministic collision — the old machines trusted tables over branches; the engine trusts the seed over state',
  'line of sight walked integer steps, never trig — losBlocked is the visplane of the grid',
  'the board is a lookup table built once from the seed — lutBoard, the LUT-era logarithm',
  'palettes cycle by a deterministic offset — paletteCycle, the flame that never flickers twice',
  'every level is a bsp tree of one split per log2 — the map is a seed echo',
  'the three poisons are not enemies but conditions; stomping is release, not kill',
]

export function doombible(seed: bigint, brief: string): BibleEntry[] {
  const rng = randFromSeed(seed)
  const trits = balancedTrits(seed, 36)
  const out: BibleEntry[] = []
  out.push({
    id: 'ep-00', kind: 'episode',
    title: `episode 0 — ${brief}`,
    text: `the gates hold ${4 + Math.abs(trits[0])} keys, each key a gate, each gate a fold of the tent. the little monk enters where the sight line is clear; the wheel turns ${3 + Math.abs(trits[1])} times before the lamp.`,
  })
  for (let i = 0; i < 4; i++) {
    const b = BESTIARY[range(rng, 0, BESTIARY.length)]
    out.push({ id: `bs-0${i}`, kind: 'bestiary', title: b.name, text: b.line })
  }
  for (let i = 0; i < 3; i++) {
    out.push({ id: `en-0${i}`, kind: 'engine_note', title: 'engine note', text: NOTES[range(rng, 0, NOTES.length)] })
  }
  return out
}

// ─── CLI ────────────────────────────────────────────────────────────────

import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedFromText, seedLine } from '../quantTernEngine/tern.ts'
import { resolve } from 'node:path'

function main(): void {
  const [brief] = process.argv.slice(2)
  const text = brief || 'the pink tent at dawn'
  const seed = seedFromText(text)
  const bible = doombible(seed, text)
  const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'out')
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, `doombible-0x${seed.toString(16).slice(0, 12)}.json`)
  writeFileSync(file, JSON.stringify({ seed_line: seedLine(text, 108), brief: text, bible }, null, 2))
  console.log(`⟦${seedLine(text, 108)}⟧`)
  for (const e of bible) console.log(`[${e.kind}] ${e.title} — ${e.text}`)
  console.log(`manifest: ${file}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}