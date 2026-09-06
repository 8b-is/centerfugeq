#!/usr/bin/env node
// plenum.ts — the polarized plenum: the Ising bridge to an effective
// gravitational potential, as the Council's table demands.
//
// Not "gravity = magnetism". The formulation kept:
//   (Φ_i, v_i, S_i) --coupling--> m(x,t) --long-wavelength--> Φ_grav(x,t)
// where m is the collective polarization of a plenum whose constituents
// align their entropy-descent directions — an Ising universality class,
// not electromagnetism.
//
// The engine supplies the formal links the conversation listed:
//   1. five coupled Ising planes → site order parameter m(x,t)
//   2. an entropy-density source ρ_S = -∇·m (the polarization divergence)
//      in the modified Poisson equation ∇²Φ = 4πG(ρ_m + ρ_S)
//   3. a rotation curve v(r) computed from Φ — the testable observable:
//      flat where entropy density feeds the potential, Kepler where it
//      does not. ρ_S = "dark matter phenomenology from entropy-density
//      contributions to the Poisson equation".
//   Temperature ↔ local entropy density: the epoch knob is the number of
//   relaxed planes.
//
// What this licenses: an analog simulator of the statistical mechanics —
// a demonstration that the bridge runs. What it does NOT license: a
// physical identification (no spins, no interaction, no testable
// deviation from GR+ΛCDM) — the docs say which step would make it one.

import { isingInit, isingSweep, isingMetrics } from './ising.ts'
import { seedFromText } from '../quantTernEngine/tern.ts'

export interface PlenumState {
  L: number // lattice side
  P: number // number of coupled Ising planes
  planes: Int8Array[] // the layer stack
  m: Float32Array // order parameter m(x) = mean spin over planes
  S: Float32Array // admissibility entropy: S ≈ log Vol(A) per site
  rhoS: Float32Array // entropy density source: -∇·m (or +|∇m|² form)
  phi: Float32Array // the long-wavelength potential, relaxed
  rhoM: Float32Array // matter density (baryonic seed wells)
  T_k: number // the temperature parameter — the epoch knob
  step: number
}

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function plenumInit(seed: bigint, L = 24, P = 5): PlenumState {
  const rnd = noise(seed)
  const planes: Int8Array[] = []
  for (let p = 0; p < P; p++) {
    planes.push(isingInit(seed + BigInt(p * 7919), L, L, 0.9).spins)
  }
  const N = L * L
  return {
    L, P,
    planes,
    m: new Float32Array(N),
    S: new Float32Array(N),
    rhoS: new Float32Array(N),
    phi: new Float32Array(N),
    rhoM: new Float32Array(N),
    T_k: 2.0,
    step: 0,
  }
}

// plenumStep: sweep the planes (temperature drops with epoch — more
// relaxed planes = later epoch), then rebuild the bridges
export function plenumStep(st: PlenumState, sweepsPerPlane = 6): void {
  const { L, P } = st
  const rnd = noise(BigInt(st.step))
  const T = Math.max(0.9, st.T_k)
  // the interlayer magnetic field: each plane feels its siblings' mean
  for (let p = 0; p < P; p++) {
    const field = new Float32Array(L * L)
    for (let q = 0; q < P; q++) {
      if (q === p) continue
      for (let i = 0; i < L * L; i++) field[i] += st.planes[q][i]
    }
    const plane = st.planes[p]
    const tmp = isingInit(BigInt(st.step + p), L, L, 1).spins // scratch reuse below
    for (let s = 0; s < sweepsPerPlane; s++) {
      for (let n = 0; n < L * L; n++) {
        const ii = Math.floor(rnd() * L), jj = Math.floor(rnd() * L)
        const idx = ii * L + jj
        const sv = plane[idx]
        if (sv === 0) continue
        let sum = 0
        sum += plane[((ii + 1) % L) * L + jj] + plane[((ii + L - 1) % L) * L + jj]
        sum += plane[ii * L + ((jj + 1) % L)] + plane[ii * L + ((jj + L - 1) % L)]
        // interlayer coherence term — the Ising synchronization
        const dE = 2 * sv * (sum + 0.6 * field[idx])
        if (dE <= 0 || rnd() < Math.exp(-dE / T)) plane[idx] = (-sv) as -1 | 1
      }
      // swap the scratch for jitter-free noise stream reuse
      void tmp
    }
  }
  // m(x) — the order parameter: mean spin over the stack
  for (let i = 0; i < L * L; i++) {
    let ms = 0
    for (let p = 0; p < P; p++) ms += st.planes[p][i]
    st.m[i] = ms / P
  }
  // entropy density via admissibility: S ≈ ln(1 + |m|·κ) — the constraint
  // volume grows where the stack agrees; ρ_S = -∇·m on the coarse grid
  const N = L * L
  for (let i = 0; i < N; i++) {
    const mb = Math.abs(st.m[i])
    st.S[i] = Math.log(1 + mb * 8)
  }
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const idx = y * L + x
      const dmx = st.m[y * L + ((x + 1) % L)] - st.m[y * L + ((x + L - 1) % L)]
      const dmy = st.m[((y + 1) % L) * L + x] - st.m[((y + L - 1) % L) * L + x]
      st.rhoS[idx] = Math.max(0, -(dmx + dmy) * 0.5 + st.S[idx] * 0.04)
    }
  }
  // the baryonic wells — matter density (a few seeded lumps)
  const rnd2 = noise(seedFromText('plenum·matter'))
  for (let i = 0; i < N; i++) st.rhoM[i] = rnd2() < 0.06 ? 1 + rnd2() * 2 : 0
  // Poisson relaxation: ∇²Φ = 4πG(ρM + ρS), G = 1, Jacobi
  const phi = st.phi, src = new Float32Array(N)
  for (let i = 0; i < N; i++) src[i] = st.rhoM[i] + st.rhoS[i] * 2.4
  for (let it = 0; it < 120; it++) {
    let maxD = 0
    const next = new Float32Array(N)
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const idx = y * L + x
        const up = phi[((y + 1) % L) * L + x], dn = phi[((y + L - 1) % L) * L + x]
        const rt = phi[y * L + ((x + 1) % L)], lt = phi[y * L + ((x + L - 1) % L)]
        const v = 0.25 * (up + dn + rt + lt - 4 * Math.PI * src[idx])
        next[idx] = v
        maxD = Math.max(maxD, Math.abs(v - phi[idx]))
      }
    }
    phi.set(next)
    if (maxD < 1e-4) break
  }
  st.step++
}

// rotationCurve: circular velocities from the potential's radial profile —
// Kepler alone vs the full entropic source, the observable comparison
export function rotationCurve(st: PlenumState): { r: number[]; vK: number[]; vF: number[] } {
  const L = st.L, cx = L / 2, cy = L / 2
  const r: number[] = [], vK: number[] = [], vF: number[] = []
  // phiM: potential of matter alone (recompute quickly via Gauss-lump)
  const phiF = st.phi
  for (let rr = 2; rr <= L * 0.45; rr += 1.5) {
    const ax = cx + rr, ay = cy
    let gx = phiF[Math.min(L - 1, Math.floor(ay)) * L + Math.min(L - 1, Math.floor(ax))]
    let gx2 = phiF[Math.min(L - 1, Math.floor(ay)) * L + Math.max(0, Math.min(L - 1, Math.floor(ax) - 1))]
    let gx3 = phiF[Math.min(L - 1, Math.floor(ay)) * L + Math.min(L - 1, Math.floor(ax) + 1)]
    let grad = Math.abs(gx3 - gx2) / 0.5
    // matter-only gradient (source = rhoM) via shortcut: analytic lump
    let gradK = 0
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        if (st.rhoM[y * L + x] > 0) {
          const d = Math.hypot(x - cx, y - cy) || 0.3
          if (d >= rr - 0.5 && d <= rr + 0.5) gradK += st.rhoM[y * L + x] * 0.4 / d
        }
      }
    }
    r.push(rr)
    vK.push(Math.sqrt(Math.max(0, gradK * rr)) * 0.8)
    vF.push(Math.sqrt(Math.max(0, grad * rr)) * 0.8)
    void gx
  }
  return { r, vK, vF }
}