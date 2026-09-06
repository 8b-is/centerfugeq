#!/usr/bin/env node
// kuramoto.ts — the synchronization floor: the MEM|8 survival proof.
//
// The agent's verdict, in code:
//   · private x_i(t)   — each oscillator keeps an uninterrupted history
//   · exposed θ_i(t)   — a shared relational axis, nothing more
//   · coupling local   — a ring of neighbors, never a global broadcast
//   · R e^{iΨ} observed, not imposed — the order parameter is derived
//
// MEM|8 survives if its requirement is phase locking or boundary
// alignment, not internal state equality. The history stays replayable
// because each H_i records only its own couplings and responses — the
// collective Ψ is derived, never duplicated. Deterministic end to end:
// same seed → same private histories → same R(t).

export interface Osc {
  x: number // private state — the uninterrupted history's seed
  th: number // exposed phase — the shared relational axis
  w: number // natural frequency
  kin: number[] // the private history H_i: own updates only
}

export interface KuramotoState {
  N: number
  K: number // local coupling strength
  radius: number // coupling is local: only oscillators within `radius`
  oscs: Osc[]
  R: number[] // the observed order parameter, R(t) — derived, not imposed
  psi: number[] // the collective phase Ψ(t)
  step: number
}

export function kuramotoInit(seed: bigint, N = 80, K = 12, radius = 4): KuramotoState {
  let s = Number(seed % 4294967296n) >>> 0
  const rnd = (): number => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  const oscs: Osc[] = []
  for (let i = 0; i < N; i++) {
    oscs.push({ x: rnd() * 6.2832, th: rnd() * 6.2832, w: 0.6 + rnd() * 0.8, kin: [] })
  }
  return { N, K, radius, oscs, R: [], psi: [], step: 0 }
}

// local coupling: the ring of neighbors within `radius` (never global)
function neighbors(st: KuramotoState, i: number): number[] {
  const out: number[] = []
  for (let r = 1; r <= st.radius && r < st.N / 2; r++) {
    out.push((i + r) % st.N)
    out.push((i + st.N - r) % st.N)
  }
  return out
}

export function kuramotoStep(st: KuramotoState, dt = 0.05): void {
  const N = st.N
  const newTh = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    const o = st.oscs[i]
    let sum = 0
    const nb = neighbors(st, i)
    for (const j of nb) {
      sum += Math.sin(st.oscs[j].th - o.th)
    }
    // local coupling: K / |neighbors| — no global broadcast
    newTh[i] = o.th + (o.w + (st.K / nb.length) * sum) * dt
  }
  for (let i = 0; i < N; i++) {
    const o = st.oscs[i]
    o.th = newTh[i]
    o.kin.push(o.th) // H_i: own phase, own response — nothing else
  }
  // R and Ψ: observed from the phases, never imposed on them
  let sx = 0, sy = 0
  for (const o of st.oscs) { sx += Math.cos(o.th); sy += Math.sin(o.th) }
  st.R.push(Math.hypot(sx, sy) / N)
  st.psi.push(Math.atan2(sy, sx))
  st.step++
}

// coherence now
export function coherence(st: KuramotoState): number {
  return st.R[st.R.length - 1] ?? 0
}

// the MEM|8 survival check: replay both runs, byte-identical histories,
// private states untouched by the collective
export function mem8Check(seed: bigint, steps = 800): { locked: boolean; deterministic: boolean; privateDistinct: boolean } {
  const a = kuramotoInit(seed)
  const b = kuramotoInit(seed)
  for (let i = 0; i < steps; i++) { kuramotoStep(a); kuramotoStep(b) }
  const locked = a.R.slice(-200).every((r) => r > 0.9)
  const deterministic = JSON.stringify(a.oscs.map((o) => o.kin)) === JSON.stringify(b.oscs.map((o) => o.kin))
  const xs = new Set(a.oscs.map((o) => o.x))
  const privateDistinct = xs.size > a.N * 0.9 // internal states were never equalized
  return { locked, deterministic, privateDistinct }
}