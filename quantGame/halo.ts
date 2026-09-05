#!/usr/bin/env node
// halo.ts — the vector dark matter halo layer. The paper's lesson:
// "Vector Dark Matter Halo: From Polarization Dynamics to Direct
// Detection" (arXiv, Mar 2025). A halo is not just a mass lump — it is a
// VECTOR field whose dynamics are polarization dynamics: constituents
// align with the local density flow, and the halo's state is read in its
// polarization order parameter. Direct detection = the metric, here:
// P = |mean e^{iθ}| — the halo's coherence, watched live.
//
// Game-shaped: the halo is particles in a softened gravity well, plus an
// alignment force (polarization), plus jitter. Deterministic: the seed
// owns init and the noise stream.

export interface HaloParticle {
  x: number
  y: number
  vx: number
  vy: number
  theta: number // polarization angle
  m: number
}

export interface HaloState {
  particles: HaloParticle[]
  w: number
  h: number
  g: number      // softened gravity strength
  align: number  // polarization alignment strength
  jitter: number // thermal jitter
  step: number
}

export function haloInit(seed: bigint, n: number, w: number, h: number): HaloState {
  let s = Number(seed % 4294967296n) >>> 0
  const rnd = (): number => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  const particles: HaloParticle[] = []
  for (let i = 0; i < n; i++) {
    particles.push({
      x: w * (0.2 + 0.6 * rnd()),
      y: h * (0.2 + 0.6 * rnd()),
      vx: (rnd() - 0.5) * 8,
      vy: (rnd() - 0.5) * 8,
      theta: rnd() * 6.2832,
      m: 0.5 + rnd(),
    })
  }
  return { particles, w, h, g: 14, align: 0.6, jitter: 1.2, step: 0 }
}

// haloStep: soft gravity toward the mass centre, polarization alignment
// with the neighbourhood mean direction, jitter. The halo breathes.
export function haloStep(st: HaloState, rnd: () => number): void {
  const { particles, w, h, g, align, jitter } = st
  // mass centre
  let cx = 0, cy = 0, cm = 0
  for (const p of particles) { cx += p.x * p.m; cy += p.y * p.m; cm += p.m }
  cx /= cm; cy /= cm
  // neighbourhood mean theta per particle (coarse ring)
  const ringMean: number[] = []
  for (const p of particles) {
    let sx = 0, sy = 0, cnt = 0
    for (const q of particles) {
      const d = Math.hypot(q.x - p.x, q.y - p.y)
      if (d < 90 && d > 0.001) { sx += Math.cos(q.theta); sy += Math.sin(q.theta); cnt++ }
    }
    ringMean.push(cnt ? Math.atan2(sy, sx) : p.theta)
  }
  let i = 0
  for (const p of particles) {
    const dx = cx - p.x, dy = cy - p.y
    const r = Math.hypot(dx, dy) + 14
    p.vx += (dx / r) * g * 0.004 * p.m + align * 0.02 * Math.cos(ringMean[i]) + (rnd() - 0.5) * jitter
    p.vy += (dy / r) * g * 0.004 * p.m + align * 0.02 * Math.sin(ringMean[i]) + (rnd() - 0.5) * jitter
    p.vx *= 0.997; p.vy *= 0.997
    const sp = Math.hypot(p.vx, p.vy)
    if (sp > 6) { p.vx = (p.vx / sp) * 6; p.vy = (p.vy / sp) * 6 }
    // the velocity hints the polarization: align theta to motion, blended
    p.theta = Math.atan2(p.vy, p.vx) * 0.2 + p.theta * 0.8
    p.x += p.vx; p.y += p.vy
    if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) }
    if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) }
    if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) }
    if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) }
    i++
  }
  st.step++
}

// polarization — the direct-detection observable of the vector halo
export function polarization(st: HaloState): number {
  let sx = 0, sy = 0
  for (const p of st.particles) { sx += Math.cos(p.theta); sy += Math.sin(p.theta) }
  return Math.hypot(sx, sy) / st.particles.length
}

// densityGrid — the halo as a field, for coupling into the Ising layer
export function densityGrid(st: HaloState, cell = 16): Float32Array {
  const gw = Math.ceil(st.w / cell), gh = Math.ceil(st.h / cell)
  const grid = new Float32Array(gw * gh)
  for (const p of st.particles) {
    const gx = Math.min(gw - 1, Math.floor(p.x / cell)), gy = Math.min(gh - 1, Math.floor(p.y / cell))
    grid[gy * gw + gx] += p.m
  }
  return grid
}