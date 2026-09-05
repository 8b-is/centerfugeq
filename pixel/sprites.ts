#!/usr/bin/env node
// sprites.ts — procedural pixel-art sprites from the ternary wire.
// Demoscene discipline: symmetry costs nothing, palette is everything.
// A sprite is a pure function of (seed, size): mirrored along X (and
// optionally quad-symmetric for tiles), colored from a deterministic
// palette. Exports: RGBA grid, ASCII view, JSON — inputs for any engine.

export interface Sprite {
  id: string
  size: number
  symmetric: boolean
  palette: string[]
  pixels: Uint8ClampedArray // size*size*4 RGBA
  ascii: string[]
}

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

const PALETTES: string[][] = [
  ['#0d0512', '#3a2150', '#ff6ec7', '#ff9ad5', '#b48bff', '#ffd36e', '#62e6c9', '#e8d8f0'],
  ['#08060f', '#1a0f20', '#ffd36e', '#ffb27a', '#d4a017', '#8a5a3a', '#e8d8f0', '#ffffff'],
]

const CHARS = ['.', ':', '+', 'o', 'O', '#', '@']

export function sprite(seed: bigint, size = 16, paletteIdx = 0, quad = false): Sprite {
  const R = noise(seed)
  const palette = PALETTES[paletteIdx % PALETTES.length]
  const px = new Uint8ClampedArray(size * size * 4)
  const hex = (h: string): [number, number, number] => [
    parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
  ]
  const cols = palette.map(hex)
  const half = Math.ceil(size / 2)
  const grid: number[] = new Array(size * size).fill(0)
  const set = (x: number, y: number, v: number): void => {
    grid[y * size + x] = v
    grid[y * size + (size - 1 - x)] = v
    if (quad) {
      grid[(size - 1 - y) * size + x] = v
      grid[(size - 1 - y) * size + (size - 1 - x)] = v
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < half; x++) {
      const r = R()
      if (r < 0.42) continue // empty — the pixel stays void
      const v = 1 + Math.floor(((r - 0.42) / 0.58) * (palette.length - 1))
      set(x, y, Math.min(v, palette.length - 1))
    }
  }
  for (let i = 0; i < size * size; i++) {
    const c = cols[grid[i] || 0]
    px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2]
    px[i * 4 + 3] = grid[i] ? 255 : 0
  }
  const ascii = new Array<string>(size)
  for (let y = 0; y < size; y++) {
    let line = ''
    for (let x = 0; x < size; x++) {
      const v = grid[y * size + x]
      line += v ? CHARS[Math.min(v, CHARS.length - 1)] : ' '
    }
    ascii[y] = line
  }
  return {
    id: `spr-${seed.toString(16).slice(0, 8)}`,
    size,
    symmetric: true,
    palette,
    pixels: px,
    ascii,
  }
}

// spriteSheet: N sprites in a row — the sheet is itself a pure function
export function spriteSheet(seed: bigint, count: number, size = 16): Sprite[] {
  const out: Sprite[] = []
  for (let i = 0; i < count; i++) out.push(sprite(seed + BigInt(i * 7919), size, i % PALETTES.length))
  return out
}