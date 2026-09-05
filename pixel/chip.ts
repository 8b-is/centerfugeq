#!/usr/bin/env node
// chip.ts — deterministic chiptune synthesis to a real WAV file.
// No dependencies: a note table, square/triangle phases, a seed-owned
// pattern engine, and a RIFF/PCM16 writer. The same seed, the same
// track, byte for byte — the demoscene's oldest promise.
//
//   node chip.ts "<brief>" [--bpm 108] [--out out/<brief>.wav]

import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const RATE = 22050

// A4 = 440; 12-TET note table, 3 octaves of the pink scale
const SCALE = [233.08, 261.63, 293.66, 329.63, 349.23, 392, 440, 466.16, 523.25, 587.33, 659.25, 740]
const SEMI = [0, 2, 3, 5, 7, 10, 12, 14, 15, 17, 19, 22] // A minor-ish walk

function noise(seed: bigint): () => number {
  let s = Number(seed % 4294967296n) >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export function chipWav(seed: bigint, bpm = 108, bars = 8): Uint8Array {
  const R = noise(seed)
  const beat = 60 / bpm
  const step = beat / 2 // 8th notes
  const total = bars * 4 * step
  const n = Math.ceil(total * RATE)
  const pcm = new Int16Array(n)
  const sq = (t: number, f: number, duty = 0.5): number => (t * f % 1 < duty ? 1 : -1)
  const tri = (t: number, f: number): number => (Math.abs(((t * f) % 1) * 2 - 1) * 2 - 1)
  const bass: number[] = []
  const lead: number[] = []
  for (let s2 = 0; s2 < bars * 4; s2++) {
    bass.push(SCALE[SEMI[(s2 % 16) % SEMI.length]] / 2)
    lead.push(SCALE[SEMI[(R() * SEMI.length) | 0]] * (R() < 0.35 ? 2 : 1))
  }
  let i = 0
  for (let s2 = 0; s2 < bars * 4; s2++) {
    const t0 = s2 * step
    const t1 = (s2 + 1) * step
    const bf = bass[s2]
    const lf = lead[s2]
    for (let t = t0; t < t1 && i < n; t += 1 / RATE) {
      const env = Math.min(1, (t - t0) * 40) * Math.min(1, (t1 - t) * 20)
      const hatOn = Math.floor((t - t0) / (step / 4)) % 2 === 0
      const hat = hatOn ? (R() - 0.5) * 0.12 * env : 0
      const b = sq(t, bf, 0.5) * 0.28 * env
      const l = s2 % 2 === 0 ? tri(t, lf) * 0.14 * env : 0
      pcm[i] = (Math.max(-1, Math.min(1, b + l + hat)) * 32000) | 0
      i++
    }
  }
  // RIFF/PCM16 writer
  const data = new Uint8Array(44 + n * 2)
  const dv = new DataView(data.buffer)
  const w = (off: number, s: string): void => { for (let k = 0; k < s.length; k++) data[off + k] = s.charCodeAt(k) }
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE')
  w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
  dv.setUint32(24, RATE, true); dv.setUint32(28, RATE * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true)
  w(36, 'data'); dv.setUint32(40, n * 2, true)
  for (let k = 0; k < n; k++) dv.setInt16(44 + k * 2, pcm[k], true)
  return data
}

function main(): void {
  const [brief, , , outFlag, outVal] = process.argv.slice(2)
  const text = brief || 'the pink tent at dawn'
  const file = outFlag === '--out' && outVal ? outVal : join(dirname(fileURLToPath(import.meta.url)), '..', 'out', 'chip.wav')
  const seed = BigInt('0x' + [...text].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 7).toString(16) + '')
  const wav = chipWav(BigInt(([...text].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 7)) >>> 0), 108)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, wav)
  console.log(`chip: ${file} · ${wav.length} bytes · 8-bit chiptune · determinisztikus, ugyanaz a dal minden replaynál`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}