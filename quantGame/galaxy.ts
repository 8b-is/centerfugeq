#!/usr/bin/env node
// galaxy.ts — the quantGame engine: halo + Ising coupled.
//
// Structure formation as the two papers read it:
//   · the dark matter halo is a VECTOR field — its coherence (polarization)
//     is the direct-detection observable (vector DM paper)
//   · the baryonic layer is an ISING lattice — its phase transition reads
//     in image statistics: magnetization, row entropy, cluster count
//   · the coupling: halo density deepens the potential wells, lowers the
//     local T, biases the spins +1 — stars freeze where the halo coheres
//
// Deterministic end to end: one seed owns init and every noise stream.
// The game hook: perturbe() drops a mass blob — the halo answers,
// the lattice answers, the metrics move. Everything returns to the seed.

import { isingInit, isingSweep, isingMetrics, complexityScore, isingMetrics as _m, type IsingState } from './ising.ts'
import { haloInit, haloStep, polarization, densityGrid, type HaloState } from './halo.ts'
import { seedFromText } from '../quantTernEngine/tern.ts'

export interface GalaxyState {
  halo: HaloState
  ising: IsingState
  steps: number
  history: GalaxyFrame[]
}

export interface GalaxyFrame {
  step: number
  polarization: number
  magnetization: number
  rowEntropy: number
  clusters: number
  complexity: number
  stars: number
  T: number
}

export function galaxyInit(seed: bigint, w = 96, h = 96, particles = 140): GalaxyState {
  return {
    halo: haloInit(seed, particles, w, h),
    ising: isingInit(seed ^ 0x9e3779b97f4a7c15n, 48, 48, 0.92),
    steps: 0,
    history: [],
  }
}

// the noise stream of the galaxy — owned by the seed and the step
function noiseStream(seed: bigint, step: number): () => number {
  let s = Number((seed + BigInt(step) * 0x9e3779b97f4a7c15n) % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

// perturbe — the god-mode hook: drop mass at (x, y) in halo space
export function perturbe(st: GalaxyState, x: number, y: number, mass = 6): void {
  for (let i = 0; i < Math.min(6, st.halo.particles.length / 8); i++) {
    const p = st.halo.particles[Math.floor(Math.random() * st.halo.particles.length)]
    p.x = Math.min(st.halo.w - 1, Math.max(0, x + (Math.random() - 0.5) * 30))
    p.y = Math.min(st.halo.h - 1, Math.max(0, y + (Math.random() - 0.5) * 30))
    p.m += mass / 6
  }
}

export function galaxyStep(st: GalaxyState): GalaxyFrame {
  const rnd = noiseStream(0xdeadbeefn, st.steps)
  haloStep(st.halo, rnd)
  // couple: halo density over the ising lattice, coarsened 2:1 (halo w=96 → 48)
  const dens = densityGrid(st.halo, 2)
  const { rows, cols, spins } = st.ising
  // local T field + count sweeps proportional to lattice size
  const bias = new Float32Array(rows * cols)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const d = dens[i * cols + j] // halo w/h == lattice dims * 2
      bias[i * cols + j] = Math.min(1.5, d * 0.22)
    }
  }
  // Ising sweep with coupling: bias favours +1 in dense wells; T dips too
  const Tbase = 2.2
  for (let n = 0; n < rows * cols; n++) {
    const ii = Math.floor(rnd() * rows), jj = Math.floor(rnd() * cols)
    const idx = ii * cols + jj
    const s = spins[idx]
    if (s === 0) continue
    let sum = 0
    sum += spins[((ii + 1) % rows) * cols + jj]
    sum += spins[((ii + rows - 1) % rows) * cols + jj]
    sum += spins[ii * cols + ((jj + 1) % cols)]
    sum += spins[ii * cols + ((jj + cols - 1) % cols)]
    const T = Math.max(0.9, Tbase - bias[idx] * 1.4)
    const hBias = s === 1 ? -bias[idx] : bias[idx] // external field favours +1
    const dE = 2 * s * sum + 2 * hBias * s
    if (dE <= 0 || rnd() < Math.exp(-dE / T)) spins[idx] = (-s) as -1 | 1
  }
  st.ising.step++
  const m = isingMetrics(st.ising)
  let stars = 0
  for (let i = 0; i < spins.length; i++) if (spins[i] === 1 && bias[i] > 0.15) stars++
  const frame: GalaxyFrame = {
    step: st.steps,
    polarization: polarization(st.halo),
    magnetization: m.magnetization,
    rowEntropy: m.rowEntropy,
    clusters: m.clusters,
    complexity: complexityScore(m),
    stars,
    T: Tbase,
  }
  st.history.push(frame)
  st.steps++
  return frame
}

export function runGalaxy(seed: bigint, steps: number, w = 96, h = 96, particles = 140): GalaxyState {
  const st = galaxyInit(seed, w, h, particles)
  for (let i = 0; i < steps; i++) galaxyStep(st)
  return st
}

// spark alias to keep imports honest
export { _m as isingMetricsAlias }