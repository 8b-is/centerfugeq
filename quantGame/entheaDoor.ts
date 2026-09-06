#!/usr/bin/env node
// entheaDoor.ts — the bootstrap → engine handshake: any artifact of the
// engine becomes a door record on the ternaryPureASCII wire (the 8b/enthea
// engine door: arena + bytecode VM + ternaryPureASCII). One record per
// artifact; the record is the artifact's address in the engine's bus.
//
//   node quantGame/entheaDoor.ts "lissajous" "./out/lissajous.json" "a magnetar bound to the hole"
//
// Writes out/door/<name>.wire — a plain, replayable, wire-only record:
// the seed, the 108-trit wire, the digest, the artifact's summary line.

import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { seedFromText, balancedTrits, wire } from '../quantTernEngine/tern.ts'

export function doorRecord(name: string, label: string, summary: string): string {
  const seed = seedFromText(label)
  const trits = balancedTrits(seed, 108)
  const w = wire(trits)
  const digest = createHash('sha256').update(label + '\n' + w + '\n' + summary).digest('hex')
  const lines = [
    `door::${name}`,
    `engine::enthea`,
    `seam::ternaryPureASCII`,
    `label::${label}`,
    `seed::0x${seed.toString(16)}`,
    `wire::${w}`,
    `digest::${digest.slice(0, 32)}`,
    `summary::${summary.slice(0, 120)}`,
  ]
  return lines.join('\n') + '\n'
}

function main(): void {
  const [name, artifactPath, label] = process.argv.slice(2)
  if (!name || !label) {
    console.error('usage: node quantGame/entheaDoor.ts <name> [artifact.json] "<label>"')
    process.exit(1)
  }
  const summary = artifactPath
    ? (() => {
        try {
          const j = JSON.parse(readFileSync(artifactPath, 'utf8'))
          return (j.seed_line ?? j.brief ?? j.name ?? j.summary ?? 'artifact') as string
        } catch {
          return 'artifact'
        }
      })()
    : 'the engine door record'
  const rec = doorRecord(name, label, summary)
  const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'out', 'door')
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, `${name}.wire`)
  writeFileSync(file, rec)
  console.log(`⟦ door ${name} · ${seedFromText(label).toString(16).slice(0, 12)} ⟧`)
  console.log(rec.split('\n').slice(0, 3).join('\n'))
  console.log(`record: ${file}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}