#!/usr/bin/env node
// rsvp.ts — the plenum relaxation lane: Relativistic Scalar Vector Plenum,
// applied from the lineage analysis (january 2021 brick-to-sponge → july 2022
// centerless premise → RSVP scalar-vector-entropy ontology → the essay).
//
// Epistemic statuses (the disaggregation, applied to this module):
//   [established]   the skeleton: homogeneous medium → internal
//                   differentiation → void opening + local concentration →
//                   loss of usable work. Standard cosmology: no central
//                   explosion; recession is increasing proper distance.
//   [proposed]      the local fields: scalar permeability, vector flow, and
//                   ONE redistribution rule dρ/dt = -∇·(ρv) — expansion and
//                   attraction as opposite signs of the same divergence.
//   [checked]       the provenance: this engine is an analog simulator, not
//                   an identification. the checks it CAN run are exported:
//                   observerInvariance() — no unique global center — and the
//                   monotone usable-work curve. nothing here claims GR.
//
// The July 2022 premise is built into the observables: observeFrom() works
// from ANY site, and observerInvariance() verifies the horizon-centered
// description is centerless.

export interface RsvpState {
  L: number // lattice side
  rho: Float32Array // medium density — the homogeneous field
  perm: Float32Array // scalar permeability — where entropy caps flow
  S: Float32Array // entropy density — internal loss of usable organization
  phi: Float32Array // the potential, relaxed each epoch
  vx: Float32Array // vector flow, in-plane
  vy: Float32Array
  usable: number // fraction of energy available for organized work (monotone ↓)
  cumS: number // cumulative entropy production — the exhaustion accumulator
  epoch: number
  seed: bigint
}

// the three knobs of the relaxation lane — tuned so the skeleton is visible
// within ~80 epochs on a 40² lattice (see rsvpSelftest)
const G = 0.12 // Poisson source strength — how hard structures close
const ENTROPY_K = 0.008 // entropy produced per unit divergence — usable-work cost
const VOID_S_R = 1.0 // void needs entropy above the field mean
const VOID_V_R = 0.2 // and flow below this fraction of the field scale

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function rsvpInit(seed: bigint, L = 40): RsvpState {
  const rnd = noise(seed)
  const N = L * L
  const rho = new Float32Array(N)
  const perm = new Float32Array(N)
  const S = new Float32Array(N)
  // the homogeneous energetic medium: near-uniform density with seed-sized
  // ripples — differentiation must come from inside, not from debris
  for (let i = 0; i < N; i++) {
    rho[i] = 1 + (rnd() - 0.5) * 0.15
    perm[i] = 1
  }
  return {
    L, rho, perm, S,
    phi: new Float32Array(N),
    vx: new Float32Array(N),
    vy: new Float32Array(N),
    usable: 1,
    cumS: 0,
    epoch: 0,
    seed,
  }
}

// rsvpStep — one epoch of the single redistribution rule. The universe does
// not expand into anything; it differentiates internally.
export function rsvpStep(st: RsvpState, dt = 0.15): void {
  const { L } = st
  const N = L * L
  const idx = (x: number, y: number) => ((y + L) % L) * L + ((x + L) % L)

  // 1. the potential: ∇²Φ = 4πG·ρ, Jacobi relaxation
  const phi = st.phi
  for (let it = 0; it < 90; it++) {
    let maxD = 0
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < L; x++) {
        const i = idx(x, y)
        const v = 0.25 * (phi[idx(x + 1, y)] + phi[idx(x - 1, y)] + phi[idx(x, y + 1)] + phi[idx(x, y - 1)] - 4 * Math.PI * G * st.rho[i])
        maxD = Math.max(maxD, Math.abs(v - phi[i]))
        phi[i] = v
      }
    }
    if (maxD < 1e-5) break
  }

  // 2. vector flow: v = -∇Φ — the plenum's own current — then the sponge:
  //    where entropy has capped the permeability, the flow is BLOCKED
  //    (scalar permeability gates the vector lane). hollowed sites go still.
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const i = y * L + x
      const gate = Math.max(0.05, (2 - st.perm[i]) / 2)
      st.vx[i] = -(phi[idx(x + 1, y)] - phi[idx(x - 1, y)]) * 0.5 * gate
      st.vy[i] = -(phi[idx(x, y + 1)] - phi[idx(x, y - 1)]) * 0.5 * gate
    }
  }

  // 3. the ONE rule: dρ/dt = -∇·(ρv) — voids open where flow diverges out,
  //    structures close where it converges in. same operator, two signs.
  const next = new Float32Array(N)
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const i = y * L + x
      const fluxR = st.rho[idx(x + 1, y)] * st.vx[idx(x + 1, y)] - st.rho[idx(x - 1, y)] * st.vx[idx(x - 1, y)]
      const fluxY = st.rho[idx(x, y + 1)] * st.vy[idx(x, y + 1)] - st.rho[idx(x, y - 1)] * st.vy[idx(x, y - 1)]
      const div = 0.5 * (fluxR + fluxY)
      next[i] = st.rho[i] - dt * div
      // entropy production: each redistribution event costs usable work
      st.S[i] += Math.abs(div) * ENTROPY_K
      st.perm[i] = Math.min(4, 1 + st.S[i] * 30)
    }
  }
  // coherence without collapse — the key sentence: structure may close but
  // never to a singularity (6-cap), voids may open but never to nothing
  // (0.02-floor). the clamps are the constraint, not a hack.
  for (let i = 0; i < N; i++) st.rho[i] = Math.min(6, Math.max(0.02, next[i]))

  // 4. the exhaustion accumulator — thermodynamic, not energetic: cosmic
  //    evolution increases entropy and reduces the fraction of energy
  //    available for organized work. monotone by construction.
  let dS = 0
  for (let i = 0; i < N; i++) dS += st.S[i]
  const prod = Math.max(0, (dS - st.cumS) / N)
  st.cumS = dS
  st.usable = Math.max(0, st.usable - prod)
  st.epoch++
}

// voidFrac — the "hollowing out": share of sites past the permeability cap
// where the flow can no longer organize (low |v|, high S). the sponge.
export function voidFrac(st: RsvpState): number {
  const N = st.L * st.L
  let sMean = 0
  let vMean = 0
  for (let i = 0; i < N; i++) { sMean += st.S[i]; vMean += Math.hypot(st.vx[i], st.vy[i]) }
  sMean /= N; vMean /= N
  let voids = 0
  for (let i = 0; i < N; i++) {
    if (st.S[i] > VOID_S_R * sMean && Math.hypot(st.vx[i], st.vy[i]) < VOID_V_R * vMean) voids++
  }
  return voids / N
}

// observeFrom — the July 2022 premise as an observable: any site is the
// center of its own observable universe. returns the apparent radial flow
// (recession-like) profile around (ox, oy): the worldline-centered view.
export function observeFrom(st: RsvpState, ox: number, oy: number, rmax = 0): { r: number[]; vApp: number[] } {
  const L = st.L
  const R = rmax > 0 ? rmax : L / 2
  const r: number[] = []
  const vApp: number[] = []
  for (let rr = 1.5; rr <= R; rr += 1.5) {
    let sum = 0
    let n = 0
    const steps = Math.max(12, Math.floor(rr * 6))
    for (let k = 0; k < steps; k++) {
      const th = (k / steps) * Math.PI * 2
      const x = ox + rr * Math.cos(th)
      const y = oy + rr * Math.sin(th)
      const i = ((Math.round(y) + L) % L) * L + ((Math.round(x) + L) % L)
      // radial component of the flow field, from THIS observer's center
      const rad = (st.vx[i] * Math.cos(th) + st.vy[i] * Math.sin(th))
      sum += rad
      n++
    }
    if (n > 0) { r.push(rr); vApp.push(sum / n) }
  }
  return { r, vApp }
}

// observerInvariance — the check: sample the apparent profile from several
// centers and compare normalized shapes. the horizon-centered description
// must not single out a global center. the dispersion is RELATIVE: divided
// by the mean profile amplitude, because local structure sets the scale —
// the honest form of the 2022 premise (an identification would need a real
// sky; this is the analog check).
export function observerInvariance(st: RsvpState, centers: [number, number][]): number {
  const profiles = centers.map(([ox, oy]) => observeFrom(st, ox, oy).vApp)
  const norm = profiles.map(p => {
    const max = Math.max(1e-6, ...p.map(Math.abs))
    const m = p.reduce((a, b) => a + b, 0) / p.length
    return p.map(v => (v - m) / max)
  })
  let disp = 0
  const R0 = Math.min(...norm.map(p => p.length))
  let amp = 0
  for (let k = 0; k < R0; k++) {
    const vals = norm.map(p => p[k])
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    amp += Math.abs(mean)
    disp += vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
  }
  disp /= R0
  amp = Math.max(1e-6, amp / R0)
  return disp / amp
}

// a tiny self-test: the skeleton runs, the usable work exhausts, and the
// centerless check stays small — replayable ⇒ admissible
export function rsvpSelftest(seed = 42n, L = 40, epochs = 80): boolean {
  const st = rsvpInit(seed, L)
  const before = voidFrac(st)
  for (let e = 0; e < epochs; e++) rsvpStep(st)
  const after = voidFrac(st)
  const disp = observerInvariance(st, [[20, 20], [8, 8], [31, 14], [24, 33], [12, 30]])
  const rng = Math.max(...st.rho) - Math.min(...st.rho)
  console.log(`epoch ${st.epoch} · voids ${before.toFixed(3)} → ${after.toFixed(3)} · usable ${st.usable.toFixed(3)} · rho spread ${rng.toFixed(2)} · observer dispersion ${disp.toFixed(3)}`)
  return after > before && rng > 2 && st.usable < 0.97 && disp < 0.8
}

if (process.argv[1] && import.meta.url.endsWith('rsvp.ts')) {
  const ok = rsvpSelftest()
  console.log(ok ? '⟦ rsvp selftest: PASS — the skeleton runs, the center is every observer ⟧' : '⟦ rsvp selftest: FAIL ⟧')
  process.exit(ok ? 0 : 1)
}