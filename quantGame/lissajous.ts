#!/usr/bin/env node
// lissajous.ts — relativistic phase portraits: gravity as the changing
// relations among clocks.
//
// A Lissajous figure here is NOT the spatial trajectory of a magnetar
// around a black hole. It is a phase portrait: one oscillatory clock
// plotted against another, time removed as an axis, the coordination
// left visible. The construction follows the essay:
//   x(t) = A sin(ωx t + δx)   y(t) = B sin(ωy t + δy)
// with the Kerr frequencies Ωr Ωθ Ωφ plus the magnetar's own clocks
// (rotation, axis precession, emission, magnetospheric oscillation).
//
// gravity → changing relations among clocks. What the portrait shows:
// progressive phase displacement, precession, nonclosure, resonance.
// The Ising field m(x,t) may modulate the coupling (the essay's
// equation) — as a hypothesized ordering medium, never as gravity
// itself until a physical action, micro degrees of freedom, a weak-field
// limit and distinguishable predictions exist.

import { seedFromText } from '../quantTernEngine/tern.ts'

export interface ClockSuit {
  kr: number // Kerr radial Ωr
  kt: number // Kerr polar Ωθ
  kp: number // Kerr azimuthal Ωφ
  spin: number // magnetar rotation
  pre: number // magnetic-axis precession
  em: number // periodic emission
  ms: number // magnetospheric oscillation
}

export interface TracePoint {
  x: number
  y: number
  t: number // Mino-like unfolded time
}

export interface LissajousResult {
  suit: ClockSuit
  ratio: number // Ωφ / spin — the portrait's frequency ratio
  closed: boolean
  closureOrbits: number // q of p:q — how many orbits until the trace closes
  quasiperiodic: boolean
  precessionPerOrbit: number // geodetic-style per-orbit phase shift
  points: TracePoint[]
}

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

// lissajousInit: a magnetar bound to a rotating hole — one seeded clock suit
export function lissajousInit(seed: bigint): LissajousResult {
  const rnd = noise(seed)
  const suit: ClockSuit = {
    kr: 1.1 + rnd() * 0.6, // radial: the eccentric clock
    kt: 2.3 + rnd() * 0.9, // polar: the nodding clock
    kp: 1.0, // azimuthal: the revolution (reference, 1 orbit)
    spin: 3.7 + rnd() * 0.8, // the magnetar turns
    pre: 0.11 + rnd() * 0.2, // the axis wanders
    em: 7.9 + rnd() * 1.1, // the lighthouse pulses
    ms: 4.1 + rnd() * 0.6, // the magnetosphere breathes
  }
  const ratio = suit.kp / suit.spin
  // continued-fraction rational approximation: does the trace close?
  const approx = continuedFraction(ratio, 12)
  const closed = Math.abs(ratio - approx.p / approx.q) < 1e-3
  return {
    suit,
    ratio,
    closed,
    closureOrbits: approx.q,
    quasiperiodic: !closed,
    precessionPerOrbit: suit.pre * 2 * Math.PI, // per revolution
    points: [],
  }
}

// continuedFraction: a deterministic rational handle on the ratio
function continuedFraction(x: number, maxIter: number): { p: number; q: number } {
  let p0 = 1, q0 = 0, p1 = 0, q1 = 1, v = x, r: number
  for (let i = 0; i < maxIter; i++) {
    const a = Math.floor(v)
    const p2 = a * p1 + p0, q2 = a * q1 + q0
    p0 = p1; q0 = q1; p1 = p2; q1 = q2
    r = v - a
    if (Math.abs(p1 / q1 - x) < 1e-3 || q1 > 500) break
    v = r !== 0 ? 1 / r : 1
  }
  return { p: p1, q: q1 }
}

// trace: the portrait over `steps` — x against y, phase displacement and
// geodetic-style precession folded in; the ω compositions (ωmnk) appear
// as the closing or wandering of the figure
export function lissajousTrace(res: LissajousResult, steps = 720, dt = 0.02): LissajousResult {
  const { suit, precessionPerOrbit } = res
  const omegaX = suit.kr + suit.kp // radial vs revolution combo
  const omegaY = suit.spin // magnetar rotation
  const points: TracePoint[] = []
  const dx = 0.9, dy = 1.1
  let t = 0
  for (let i = 0; i < steps; i++) {
    t += dt
    const preT = precessionPerOrbit * t // the unclosed advance
    const x = Math.sin(omegaX * t * 2 * Math.PI + dx) * Math.cos(preT * 0.5)
    const y = Math.sin(omegaY * t * 2 * Math.PI + dy)
    points.push({ x, y, t })
  }
  res.points = points
  return res
}

// phaseSlips: unwrap a signal and count the slips — locking vs drift,
// the "chimera" hint when coupling varies (m-modulated by the caller)
export function phaseSlips(signal: number[]): number {
  let slips = 0, prev = signal[0]
  for (let i = 1; i < signal.length; i++) {
    const d = signal[i] - prev
    if (d > Math.PI) slips++
    if (d < -Math.PI) slips++
    prev = signal[i]
  }
  return slips
}

// mModulatedCoupling: the essay's equation, plain —
// dθi/dt = ωi + K·m(xi,t)·Σ Aij sin(θj−θi) + ηi(t), with m a moving
// Ising strip. Returns the phase series for slip counting.
export function mModulatedPhaseSeries(seed: bigint, N = 30, steps = 400): number[] {
  const rnd = noise(seed)
  const th = new Float64Array(N)
  const w = new Float64Array(N)
  for (let i = 0; i < N; i++) { th[i] = rnd() * 6.2832; w[i] = 0.9 + rnd() * 0.7 }
  const m = (x: number, t: number): number => Math.sin(t * 0.7 + x * 0.9) // moving strip
  const out: number[] = []
  for (let s = 0; s < steps; s++) {
    let sx = 0, sy = 0
    for (let i = 0; i < N; i++) {
      const nb = [(i + 1) % N, (i + N - 1) % N]
      let sum = 0
      for (const j of nb) sum += Math.sin(th[j] - th[i])
      th[i] += (w[i] + 3.2 * m(i / N, s * 0.05) * sum) * 0.05 + (rnd() - 0.5) * 0.02
      sx += Math.cos(th[i]); sy += Math.sin(th[i])
    }
    out.push(Math.atan2(sy, sx))
  }
  return out
}

// the door record — the enthea engine-door handshake of a portrait
export function lissajousDoor(seedText: string): string {
  const { wire } = { wire: wireOf(seedText) }
  const res = lissajousTrace(lissajousInit(seedFromText(seedText)))
  return `door·lissajous·${wire} · ratio ${res.ratio.toFixed(4)} · ${res.closed ? `closes in ${res.closureOrbits} orbits` : 'quasiperiodic — never closes'}`
}

import { balancedTrits } from '../quantTernEngine/tern.ts'
function wireOf(text: string): string {
  return balancedTrits(seedFromText(text), 27).map((t) => ['-', '0', '+'][t + 1]).join('')
}