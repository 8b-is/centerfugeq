#!/usr/bin/env node
// gaugetropy.ts — the gauge lane of the WIP catalog:
//   #40 Gaugetropy Theory (Entropy/Gauge Theory)
//   #43 Relativistic Charge Distribution Materialization
//
// Gauge: the redundancy of a configuration under local transformations —
// the same physics, many descriptions. Gaugetropy: the entropy of that
// redundancy — how much description is pure re-description. Charge: the
// divergence of the gauge field, materialized — where the redundancy
// fails to cancel, a lump appears.
//
// Seeded, deterministic, replayable ⇒ admissible.

export interface GaugeState {
  L: number
  conn: Int8Array // the connection field: -1 / 0 / +1 (the wire)
  field: Int8Array // the E field: differences of the connection
  rho: Float32Array // materialized charge: -div(E), scaled
  orbit: number // the gauge orbit size of the configuration (log2)
  entropy: number // gaugetropy: entropy of the redundancy distribution
  seed: bigint
}

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function gaugeInit(seed: bigint, L = 24): GaugeState {
  const rnd = noise(seed)
  const conn = new Int8Array(L * L)
  for (let i = 0; i < L * L; i++) conn[i] = (rnd() < 0.4 ? -1 : rnd() < 0.8 ? 1 : 0) as -1 | 0 | 1
  return {
    L, conn,
    field: new Int8Array(L * L),
    rho: new Float32Array(L * L),
    orbit: 0,
    entropy: 0,
    seed,
  }
}

// materialize: E = local difference of the connection; ρ = -∇·E. the
// redundancy that does not cancel becomes a charge lump.
export function materialize(st: GaugeState): void {
  const { L, conn } = st
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const i = y * L + x
      const dx = conn[y * L + ((x + 1) % L)] - conn[y * L + ((x + L - 1) % L)]
      const dy = conn[((y + 1) % L) * L + x] - conn[((y + L - 1) % L) * L + x]
      st.field[i] = Math.max(-1, Math.min(1, (dx + dy) / 2)) as -1 | 0 | 1
    }
  }
  // ρ = -∇·E with a soft clamp — charge appears where the field diverges
  let total = 0
  for (let y = 0; y < L; y++) {
    for (let x = 0; x < L; x++) {
      const i = y * L + x
      const dEx = st.field[y * L + ((x + 1) % L)] - st.field[y * L + ((x + L - 1) % L)]
      const dEy = st.field[((y + 1) % L) * L + x] - st.field[((y + L - 1) % L) * L + x]
      st.rho[i] = -(dEx + dEy) * 0.5
      total += Math.abs(st.rho[i])
    }
  }
  st.rho[0] += 1e-9 // keep the lattice globally neutral-ish in the statistic
  void total
}

// gaugetropy: the entropy of the redundancy distribution. the gauge orbit
// of a configuration — the distinct re-descriptions reachable by local
// flips — is measured by the multiplicity of the connection's signs;
// gaugetropy = Shannon entropy of the sign histogram. when the histogram
// is flat, every description is equally redundant: maximal gauge entropy.
export function gaugetropy(st: GaugeState): number {
  const { L, conn } = st
  const counts = new Map<number, number>()
  for (let i = 0; i < L * L; i++) counts.set(conn[i], (counts.get(conn[i]) ?? 0) + 1)
  const N = L * L
  let H = 0
  for (const [k, c] of counts) {
    if (k === 0) continue // the zero connection carries no redundancy
    const p = c / N
    H -= p * Math.log2(p)
  }
  // orbit: the number of distinct re-descriptions = product over the
  // non-zero sites of the flip multiplicity (2 per signed site), log2
  const signed = N - (counts.get(0) ?? 0)
  st.entropy = H
  st.orbit = signed // log2 of 2^signed
  return H
}

export function gaugeSelftest(): boolean {
  const a = gaugeInit(42n), b = gaugeInit(42n), c = gaugeInit(7n)
  materialize(a); materialize(b); materialize(c)
  const g1 = gaugetropy(a), g2 = gaugetropy(b), g3 = gaugetropy(c)
  let charge = 0
  for (let i = 0; i < a.L * a.L; i++) charge += Math.abs(a.rho[i])
  const deterministic = g1 === g2 && JSON.stringify(Array.from(a.rho)) === JSON.stringify(Array.from(b.rho))
  const seedSensitive = g1 !== g3
  const charges = charge > 0.5
  const redundant = g1 > 0
  console.log(`gaugetropy ${g1.toFixed(3)} (seed 42) vs ${g3.toFixed(3)} (seed 7) · orbit log2 ${a.orbit} · |ρ| total ${charge.toFixed(2)}`)
  return deterministic && seedSensitive && charges && redundant
}

if (process.argv[1] && import.meta.url.endsWith('gaugetropy.ts')) {
  const ok = gaugeSelftest()
  console.log(ok ? '⟦ gaugetropy selftest: PASS — redundancy entropied, charge materialized ⟧' : '⟦ gaugetropy selftest: FAIL ⟧')
  process.exit(ok ? 0 : 1)
}