#!/usr/bin/env node
// tilemap.ts — games are maps: the Ising lattice relaxed to criticality
// becomes a tilemap. Board → tiles {0 void, 1 ground, 2 wall, 3 star},
// exported as ASCII and JSON for the fantasy consoles and the 2.5D lane.

import { isingInit, isingSweep, isingMetrics } from '../quantGame/ising.ts'
import { seedFromText } from '../quantTernEngine/tern.ts'

export interface Tilemap {
  id: string
  width: number
  height: number
  tiles: number[]      // 0 void · 1 ground · 2 wall · 3 star
  glyphs: string[]
}

// relax: run the lattice to criticality (T_c region), then classify
export function tilemap(seed: bigint, size = 24, sweeps = 200): Tilemap {
  const st = isingInit(seed, size, size, 0.95)
  st.T = 2.2
  let s = Number((seed ^ 0x9e3779b97f4a7c15n) % 4294967296n) >>> 0
  const R = (): number => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  for (let k = 0; k < sweeps; k++) isingSweep(st, R)
  const tiles: number[] = new Array(size * size).fill(0)
  for (let i = 0; i < tiles.length; i++) {
    const v = st.spins[i]
    tiles[i] = v === 1 ? 1 : v === -1 ? 2 : 0
  }
  // stars: the most clustered +1 region — game-criticality: mark them 3
  // (cheap proxy: +1 in the densest 3x3 window)
  const dens = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (tiles[((y + dy + size) % size) * size + ((x + dx + size) % size)] === 1) d++
      }
      dens[y * size + x] = d
    }
  }
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === 1 && dens[i] >= 5 && i % 6 === Number(seed % 6n)) tiles[i] = 3
  const glyphs = new Array<string>(size)
  for (let y = 0; y < size; y++) {
    let line = ''
    for (let x = 0; x < size; x++) line += ' .X#S'[tiles[y * size + x] + 1]
    glyphs[y] = line
  }
  return { id: `map-${seed.toString(16).slice(0, 8)}`, width: size, height: size, tiles, glyphs }
}

// pico8: the classic fantasy-console export — comma-separated rows, 0..3
export function pico8Export(m: Tilemap): string {
  return m.glyphs.map((g) => [...g].map((c) => ' .X#S'.indexOf(c)).join(',')).join('\n')
}

export function mapOf(text: string, size = 24): Tilemap {
  return tilemap(seedFromText(text), size)
}