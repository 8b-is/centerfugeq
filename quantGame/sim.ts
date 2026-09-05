#!/usr/bin/env node
// sim.ts — quantGame CLI: any brief seeds a galaxy, the galaxy runs,
// the ledger records the frame metrics. Deterministic end to end:
// the same brief yields the same history, byte for byte.
//
//   node sim.ts "the pink tent at dawn" --steps 200 --seed-perturb 60,40

import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { seedFromText, seedLine } from '../quantTernEngine/tern.ts'
import { runGalaxy, perturbe } from './galaxy.ts'

function main(): void {
  const args = process.argv.slice(2)
  const brief = args[0] || 'the pink tent at dawn'
  let steps = 200
  let perturb: [number, number] | null = null
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--steps') steps = Number(args[++i])
    if (args[i] === '--perturb') {
      const [px, py] = args[++i].split(',').map(Number)
      perturb = [px, py]
    }
  }
  const seed = seedFromText(brief)
  const st = runGalaxy(seed, steps)
  if (perturb) perturbe(st, perturb[0], perturb[1], 10)
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'out', `galaxy-0x${seed.toString(16).slice(0, 12)}.json`)
  mkdirSync(dirname(file), { recursive: true })
  const manifest = {
    seed_line: seedLine(brief, 108),
    brief,
    steps: st.steps,
    particles: st.halo.particles.length,
    lattice: [st.ising.rows, st.ising.cols],
    final: st.history[st.history.length - 1],
    history: st.history,
  }
  writeFileSync(file, JSON.stringify(manifest, null, 2))
  const f = manifest.final
  console.log(`⟦${manifest.seed_line}⟧`)
  console.log(`galaxy after ${st.steps} steps — polarization ${f.polarization.toFixed(3)} · magnetization ${f.magnetization.toFixed(3)} · clusters ${f.clusters} · stars ${f.stars} · complexity ${f.complexity.toFixed(3)}`)
  console.log(`manifest: ${file}`)
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}