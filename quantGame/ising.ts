#!/usr/bin/env node
// ising.ts — the 2D Ising layer. The paper's lesson:
// "Quantifying the 'Complexity' of 2D Ising Phase Transitions with Image
// Statistics" (arXiv). A second-order transition is read in the IMAGE of
// the lattice — so this engine keeps the lattice as an image and measures
// it as one: magnetization, row entropy, cluster count. Ties to the
// ternary wire: spins are {-1, 0, +1}, the 0 being void — the Ising layer
// and the ternary engine share a sign alphabet.
//
// Physics: Metropolis sweeps, J = 1, critical T_c = 2.269 (exact, 2D square).

export interface IsingState {
  rows: number
  cols: number
  spins: Int8Array        // {-1, 0, +1}; 0 = void
  T: number
  step: number
}

export interface IsingMetrics {
  magnetization: number      // |sum spins| / non-void
  rowEntropy: number         // mean Shannon entropy of the spin rows — the image statistic
  clusters: number           // connected +1 regions — the structure count
  voids: number
}

export function isingInit(seed: bigint, rows: number, cols: number, density = 0.9): IsingState {
  const out = new Int8Array(rows * cols)
  let s = Number(seed % 4294967296n) >>> 0
  const rnd = (): number => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  for (let i = 0; i < out.length; i++) {
    out[i] = rnd() < density ? (rnd() < 0.5 ? -1 : 1) : 0
  }
  return { rows, cols, spins: out, T: 2.2, step: 0 }
}

export function isingSweep(st: IsingState, rnd: () => number): void {
  const { rows, cols, spins } = st
  const T = st.T
  for (let n = 0; n < rows * cols; n++) {
    const i = Math.floor(rnd() * rows)
    const j = Math.floor(rnd() * cols)
    const idx = i * cols + j
    const s = spins[idx]
    if (s === 0) continue
    let sum = 0
    sum += spins[((i + 1) % rows) * cols + j]
    sum += spins[((i + rows - 1) % rows) * cols + j]
    sum += spins[i * cols + ((j + 1) % cols)]
    sum += spins[i * cols + ((j + cols - 1) % cols)]
    const dE = 2 * s * sum
    if (dE <= 0 || rnd() < Math.exp(-dE / T)) spins[idx] = (-s) as -1 | 1
  }
  st.step++
}

export function isingMetrics(st: IsingState): IsingMetrics {
  const { rows, cols, spins } = st
  let sum = 0, nonVoid = 0, voids = 0
  const rowsEnt: number[] = []
  for (let i = 0; i < rows; i++) {
    const counts = [0, 0, 0] as const // -1, 0, +1
    for (let j = 0; j < cols; j++) {
      const v = spins[i * cols + j]
      counts[v + 1]++
      if (v !== 0) { sum += v; nonVoid++ } else voids++
    }
    const totalRow = cols
    let ent = 0
    for (const c of [0, 2]) {
      if (counts[c] > 0) { const p = counts[c] / totalRow; ent -= p * Math.log2(p) }
    }
    rowsEnt.push(ent)
  }
  // clusters: BFS over +1 cells
  const seen = new Uint8Array(rows * cols)
  let clusters = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const idx = i * cols + j
      if (spins[idx] === 1 && !seen[idx]) {
        clusters++
        const q: number[] = [idx]
        seen[idx] = 1
        while (q.length) {
          const cur = q.pop()!
          const ci = Math.floor(cur / cols), cj = cur % cols
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const ni = (ci + di + rows) % rows, nj = (cj + dj + cols) % cols
            const nidx = ni * cols + nj
            if (spins[nidx] === 1 && !seen[nidx]) { seen[nidx] = 1; q.push(nidx) }
          }
        }
      }
    }
  }
  return {
    magnetization: nonVoid ? Math.abs(sum) / nonVoid : 0,
    rowEntropy: rowsEnt.reduce((a, b) => a + b, 0) / rows,
    clusters,
    voids,
  }
}

// complexityScore — the paper's image-statistic read: entropy × clusters,
// normalized — the "structural complexity" of the phase transition read
// from the lattice-as-image
export function complexityScore(m: IsingMetrics): number {
  return m.rowEntropy * (1 + m.clusters / 8)
}