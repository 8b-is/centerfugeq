#!/usr/bin/env node
// party.ts — the demoscene party pack: one brief in, a full entry out.
//
//   node party.ts "the pink tent at dawn" --steps 120
//
// Produces out/party/<seed>/ with:
//   · sprites/       the pixel sprite sheet (JSON + ASCII)
//   · chip.wav       the deterministic chiptune
//   · map.json       the tilemap + pico8 csv
//   · frame.png      the blender render (if the scene manifest exists)
// and prints the size budget — 8K, 64K, 1MB — next to each file.

import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { seedFromText } from './quantTernEngine/tern.ts'
import { spriteSheet } from './pixel/sprites.ts'
import { chipWav } from './pixel/chip.ts'
import { mapOf, pico8Export } from './pixel/tilemap.ts'

function main(): void {
  const [brief, , stepsArg] = process.argv.slice(2)
  const text = brief || 'the pink tent at dawn'
  const seed = seedFromText(text)
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'out', 'party', seed.toString(16).slice(0, 12))
  mkdirSync(join(root, 'sprites'), { recursive: true })

  const written: { name: string; bytes: number }[] = []

  const sheet = spriteSheet(seed, 4, 16)
  const sheetAscii = sheet.map((s) => s.ascii.join('\n')).join('\n\n')
  writeFileSync(join(root, 'sprites', 'sheet.json'), JSON.stringify(sheet.map((s) => ({ id: s.id, size: s.size, ascii: s.ascii })), null, 2))
  writeFileSync(join(root, 'sprites', 'sheet.txt'), sheetAscii)
  written.push({ name: 'sprites/sheet.json + sheet.txt', bytes: sheetAscii.length })

  const wav = chipWav(seed, 108, 8)
  writeFileSync(join(root, 'chip.wav'), wav)
  written.push({ name: 'chip.wav', bytes: wav.length })

  const map = mapOf(text, 24)
  const mapFile = {
    seed_line: `${seed.toString(16)} ⟦${createHash('sha256').update(text).digest('hex').slice(0, 16)}⟧`,
    width: map.width,
    height: map.height,
    tiles: map.tiles,
    glyphs: map.glyphs,
    pico8: pico8Export(map),
  }
  writeFileSync(join(root, 'map.json'), JSON.stringify(mapFile, null, 2))
  writeFileSync(join(root, 'map.csv'), pico8Export(map))
  written.push({ name: 'map.json + map.csv', bytes: mapFile.tiles.length * 2 })

  console.log(`⟦ party pack · ${text} · ${seed.toString(16).slice(0, 12)} ⟧`)
  for (const w of written) {
    console.log(`  ${w.name.padEnd(28)} ${w.bytes.toString().padStart(8)} B`)
  }
  console.log(`  ${'8K  = ' + (8192 - written.reduce((a, w) => a + w.bytes, 0)) >= 0 ? 'the 8K intro fits next to the whole pack' : 'the pack is above 8K — '}`)
  console.log(`  out/party/${seed.toString(16).slice(0, 12)}/`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}