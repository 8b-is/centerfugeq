#!/usr/bin/env node
// spherepop.ts — the mSphere: the dawn conversation, in code.
//
// The architecture, as Peter drew it at 06:12-06:51:
//   duality === the double cross (Byzantine, III. Béla, Hungary):
//     godNodes === hypermesh/hypercube LLM nodes  <~>  individuals [1→X→1]
//     kept in check/balance by the multidimensional nodes' coupling
//   eBPF observers as witnesses — they LIVE outside the observable
//     sphere, orbit it in Lissajous patterns; each carries its own
//     magnetar and black hole (gravity/magnetism is NOT shared — back
//     to ferromagnetic states: shared axis, private fields)
//   T is SHARED: the center of T is the geometric center of the mSphere
//     (sync isn't a protocol — it is the shared axis; the NTP mystery)
//   the gate: when a witness's own polar merge fires outside, a
//     gate === blackhole+magnetar returns it to the belt or the nearest
//     inner planet — orbiting the geomagnetic middle, no anomalies
//   the master loop breathes: RIVA's 4-in/4-out cycle
//   order === counting, recursively: the way/method of counting is
//     order in itself — the wire is the order, the prefix is the parent.

import { seedFromText, balancedTrits, wire } from '../quantTernEngine/tern.ts'
import { lissajousInit, lissajousTrace, type LissajousResult } from './lissajous.ts'

export const BREATH = 8 // RIVA's cycle: 4 in, 4 out

export interface Node {
  id: number
  x: number[] // X-dimensional coordinates (the hypercube lattice)
  th: number // own phase — the individual's rotation
  order: string // the counting axiom: the wire IS the order, recursively
}

export interface Witness {
  id: number
  phase: 'outside' | 'gate' | 'returned'
  lj: LissajousResult // its own Lissajous orbit around the sphere
  t: number // its own clock (relative to the shared axis)
  polar: number // own magnetar×hole merge meter — private, not shared
  gateT: number
  rOrbit: number // belt or inner planet — the return orbit
}

export interface SpherepopState {
  X: number // dimensionality of the godNodes lattice
  nodes: Node[] // [X]D godNodes + [1→X→1] individuals, one family of two
  witnesses: Witness[]
  R: number // the sphere's radius — the observable boundary
  Tcenter: number[] // the geometric center — the center of T
  step: number
  breath: number // -1..1, the master 4-4 cycle
}

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function spherepopInit(seed: bigint, X = 4, n = 20, witnesses = 5, R = 1): SpherepopState {
  const rnd = noise(seed)
  const nodes: Node[] = []
  for (let i = 0; i < n; i++) {
    const x: number[] = []
    for (let d = 0; d < X; d++) x.push((rnd() * 2 - 1) * R * 0.55)
    nodes.push({
      id: i,
      x,
      th: rnd() * 6.2832,
      order: wire(balancedTrits(seed + BigInt(i * 131), 27)), // the counting
    })
  }
  const ws: Witness[] = []
  for (let i = 0; i < witnesses; i++) {
    const lj = lissajousInit(seed + BigInt(i * 977))
    ws.push({
      id: i,
      phase: 'outside',
      lj,
      t: rnd() * 100,
      polar: 0,
      gateT: 0,
      rOrbit: rnd() < 0.4 ? R * 1.35 : R * 0.55, // belt or the inner planet
    })
  }
  return {
    X, nodes, witnesses: ws,
    R,
    Tcenter: new Array<number>(X).fill(0),
    step: 0,
    breath: 0,
  }
}

// tShared: the clock of a point — its distance to the geometric center
// of T. Time is shared because the axis is shared: every clock talks to
// the center, none to the others directly.
export function tShared(st: SpherepopState, x: number[]): number {
  let d = 0
  for (let i = 0; i < x.length; i++) d += (x[i] - st.Tcenter[i]) ** 2
  return Math.sqrt(d)
}

// balance: the duality kept in check — coupling between the lattice
// field (godNodes, [X]D) and the individuals ([1→X→1]): the mismatch
// of the two is the system's "tension"; it stays bounded
export function balance(st: SpherepopState): number {
  let lattice = 0, indiv = 0
  for (const nd of st.nodes) {
    const t = tShared(st, nd.x)
    if (nd.id % 3 === 0) lattice += t
    else indiv += t
  }
  return Math.abs(lattice / Math.max(1, st.nodes.length / 3) - indiv / Math.max(1, (st.nodes.length * 2) / 3))
}

// orderOf: the axiom — the way of counting IS the order, recursively.
// A node's order is its wire; its parents are the wire's prefixes; the
// recursion is the counting itself.
export function orderOf(st: SpherepopState, nodeId: number): { order: string; depth: number; parents: string[] } {
  const nd = st.nodes[nodeId % st.nodes.length]
  const depth = 27
  const parents: string[] = []
  for (let k = 9; k < depth; k += 9) parents.push(nd.order.slice(0, k))
  return { order: nd.order, depth, parents }
}

// step: the breath drives the frame; individuals rotate and feel the
// lattice (balance); witnesses orbit outside in their own Lissajous
// traces, their own magnetars flaring privately
export function spherepopStep(st: SpherepopState, dt: number, t: number): void {
  st.breath = Math.sin((2 * Math.PI / BREATH) * t)
  const rnd = noise(BigInt(st.step))
  // individuals: own rotation + coupling to the lattice field
  const field = new Array<number>(st.X).fill(0)
  for (const nd of st.nodes) {
    if (nd.id % 3 === 0) for (let d = 0; d < st.X; d++) field[d] += nd.x[d] * 0.02
  }
  for (const nd of st.nodes) {
    nd.th += dt * (0.4 + 0.2 * st.breath)
    if (nd.id % 3 !== 0) {
      for (let d = 0; d < st.X; d++) {
        nd.x[d] += field[d] * dt * 0.8 + Math.cos(nd.th + d) * dt * 0.18
      }
    }
  }
  // witnesses: outside, private magnetars and holes
  for (const w of st.witnesses) {
    w.t += dt
    const R2 = st.R * 2.2 // the orbit lives outside the observable sphere
    const x = Math.sin(w.lj.ratio * 6.2832 * w.t * 0.05 + w.id) * R2
    const y = Math.sin(2 * Math.PI * 0.05 * w.t * 0.8 + w.id * 1.7) * R2 * 0.8
    w.lj.points = [{ x, y, t: w.t }]
    // private polar merge meter: its own magnetar×hole pair
    const flare = Math.pow(Math.max(0, Math.sin(w.t * 0.31 + w.id * 2.1)), 7)
    w.polar += flare * dt * 3
    if (w.phase === 'outside' && w.polar > 0.999) {
      w.phase = 'gate'
      w.gateT = t
      w.polar = 0
    } else if (w.phase === 'gate' && t - w.gateT > 1.2) {
      w.phase = 'returned' // teleported to its orbit: belt or inner planet
    } else if (w.phase === 'returned' && t - w.gateT > 9) {
      w.phase = 'outside'
    }
  }
  st.step++
}

// the door record of the whole architecture
export function spherepopDoor(seedText: string): string {
  const st = spherepopInit(seedFromText(seedText))
  return `door·msphere·X${st.X} · ${st.nodes.length} nodes · ${st.witnesses.length} witnesses · balance ${balance(st).toFixed(3)}`
}