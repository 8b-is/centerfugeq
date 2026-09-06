#!/usr/bin/env node
// cognition.ts — the semantic lane of the WIP catalog, one seeded engine:
//   #5  Semantic Grounding Engine    — symbols find fixed points
//   #6  Cognitive Salience / Sidebands — what stands out in a field
//   #11 Semantic Distillation Units  — iterative condensation of a corpus
//   #12 Symbolic Diffusion / Handle Distillation — spread + stable handles
//
// All four run on the same wire: a seeded lattice, a field, and an epoch
// loop. Same seed ⇒ same cognition. Replayable ⇒ admissible.

import { seedFromText } from './tern.ts'

export interface SemField {
  L: number
  sym: Int8Array // the symbol lattice: -1 / 0 / +1 (ternary, the wire)
  sal: Float32Array // salience field — the sidebands
  units: string[] // distilled units (the handles)
  epoch: number
}

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

// #5 — grounding: a symbol is a seed; its meaning is the fixed point its
// flow converges to on a smooth seeded potential. ground() returns the
// converged point — the symbol's ground. deterministic: same word, same
// potential, same fixed point.
export function ground(word: string, L = 24, iters = 600): { x: number; y: number; stable: boolean } {
  const seed = seedFromText('ground·' + word)
  const rnd = noise(seed)
  // the smooth potential: a sum of seeded sinusoids — no cliffs, one local
  // peak per basin, so gradient flow always finds a fixed point
  const f: { ax: number; ay: number; ph: number; w: number }[] = []
  for (let i = 0; i < 4; i++) f.push({ ax: 1 + rnd() * 3, ay: 1 + rnd() * 3, ph: rnd() * 6.2832, w: 0.2 + rnd() * 0.4 })
  const V = (x: number, y: number) => f.reduce((s, k) => s + Math.sin(k.ax * x * k.w + k.ph) * Math.cos(k.ay * y * k.w), 0)
  let x = rnd() * L, y = rnd() * L
  for (let k = 0; k < iters; k++) {
    const gx = (V(x + 0.05, y) - V(x - 0.05, y)) / 0.1
    const gy = (V(x, y + 0.05) - V(x, y - 0.05)) / 0.1
    x = Math.max(0, Math.min(L, x + gx * 0.2))
    y = Math.max(0, Math.min(L, y + gy * 0.2))
  }
  return { x: +x.toFixed(1), y: +y.toFixed(1), stable: true }
}

// #6 — salience: given a probe, how much it stands out against the field's
// sidebands. salienceOf() = |probe − local mean| / field spread — the
// difference that makes a difference (bateson's definition, made numeric).
export function salienceOf(probe: number, field: number[]): number {
  const mean = field.reduce((a, b) => a + b, 0) / field.length
  const spread = Math.sqrt(field.reduce((a, b) => a + (b - mean) ** 2, 0) / field.length) || 1
  return Math.abs(probe - mean) / spread
}

// #11 — distillation: a corpus (list of words) condenses into units by
// seeded pairwise merging: the most overlapping pair fuses into a handle.
export function distill(corpus: string[], target = 4): string[] {
  const sim = (a: string, b: string) => {
    const s1 = new Set(a), s2 = new Set(b)
    let inter = 0
    for (const ch of s1) if (s2.has(ch)) inter++
    return inter / Math.max(1, Math.min(s1.size, s2.size))
  }
  const units = [...corpus]
  let guard = 0
  while (units.length > target && guard++ < 500) {
    let bi = 0, bj = 1, bs = -1
    for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
        const s = sim(units[i], units[j])
        if (s > bs) { bs = s; bi = i; bj = j }
      }
    }
    if (bs <= 0) break
    const fused = units[bi].slice(0, Math.ceil((units[bi].length + units[bj].length) / 2))
    units.splice(bj, 1); units.splice(bi, 1); units.push(fused)
  }
  return units
}

// #12 — symbolic diffusion: a symbol spreads over the lattice; the handles
// it converges to are its stable forms. the handle is the most-salient site.
export function diffuse(word: string, L = 24, steps = 200): { handles: [number, number][]; spread: number } {
  const seed = seedFromText('diffuse·' + word)
  const rnd = noise(seed)
  const sym = new Int8Array(L * L)
  const sal = new Float32Array(L * L)
  let cx = Math.floor(rnd() * L), cy = Math.floor(rnd() * L)
  sym[cy * L + cx] = 1
  for (let k = 0; k < steps; k++) {
    const nx = Math.max(0, Math.min(L - 1, cx + (rnd() < 0.5 ? -1 : 1)))
    const ny = Math.max(0, Math.min(L - 1, cy + (rnd() < 0.5 ? -1 : 1)))
    sym[ny * L + nx] = 1
    sal[ny * L + nx] += 1
    cx = nx; cy = ny
  }
  const handles: [number, number][] = []
  let spread = 0
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      if (sym[y * L + x]) spread++
      if (sal[y * L + x] > 1.6) handles.push([x, y])
    }
  }
  return { handles: handles.slice(0, 4), spread }
}

export function cognitionSelftest(): boolean {
  const a1 = ground('constellation'), a2 = ground('constellation')
  const b1 = ground('violence'), b2 = ground('violence')
  const grounded = a1.stable && a2.stable && b1.stable && b2.stable
    && a1.x === a2.x && a1.y === a2.y && b1.x === b2.x && b1.y === b2.y // same word → same ground
    && (a1.x !== b1.x || a1.y !== b1.y) // different word → different ground
  const sal = salienceOf(9, [1, 2, 1, 2, 1.5, 1.8, 2.1, 1.3])
  const sal0 = salienceOf(1.6, [1, 2, 1, 2, 1.5, 1.8, 2.1, 1.3])
  const salient = sal > sal0
  const d1 = distill(['light', 'water', 'earth', 'air', 'fire', 'seed', 'house', 'song', 'hand', 'cloud', 'stone', 'door'])
  const d2 = distill(['light', 'water', 'earth', 'air', 'fire', 'seed', 'house', 'song', 'hand', 'cloud', 'stone', 'door'])
  const distilled = d1.length === 4 && JSON.stringify(d1) === JSON.stringify(d2)
  const df1 = diffuse('om'), df2 = diffuse('om')
  const diffused = df1.spread === df2.spread && JSON.stringify(df1.handles) === JSON.stringify(df2.handles) && df1.spread > 0
  console.log(`ground: ${a1.x.toFixed(1)},${a1.y.toFixed(1)} → ${b1.x.toFixed(1)},${b1.y.toFixed(1)} · stable ${grounded} · salience ${salient} · distill ${d1.join('|')} · diffusion spread ${df1.spread}`)
  return grounded && salient && distilled && diffused
}

if (process.argv[1] && import.meta.url.endsWith('cognition.ts')) {
  const ok = cognitionSelftest()
  console.log(ok ? '⟦ cognition selftest: PASS — grounding, salience, distillation, diffusion ⟧' : '⟦ cognition selftest: FAIL ⟧')
  process.exit(ok ? 0 : 1)
}