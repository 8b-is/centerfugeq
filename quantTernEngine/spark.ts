#!/usr/bin/env node
// spark.ts — the First Spark core, wired onto the ternary engine.
//
// Deterministic numerology, ledger-compatible: two inputs (full birth
// name, birth date) → Life Path (the Road) + Expression (the Vessel) →
// Radiant Number → Color Codex tier → karmic debts + knot sectors.
// The framework's own rule — "the same inputs always produce the same
// map" — is the seed-line rule: the manifest is replayable byte-for-byte.

import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { balancedTrits, wire } from './tern.ts'

const __dir = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dir, '..', 'out')

// ─── Pythagorean letter values ───────────────────────────────────────────
const LETTER_VAL: Record<string, number> = {}
for (let i = 0; i < 26; i++) {
  const ch = String.fromCharCode(65 + i)
  LETTER_VAL[ch] = ((i % 9) + 1)
}

const TIERS = [
  'I Ember', 'II Dawn', 'III Gold Vein', 'IV Verdant Gate', 'V Tide Glass',
  'VI Still Water', 'VII Violet Hour', 'VIII Rose Ash', 'IX Pearl Gate',
  'X Moonsilver', 'XI First Light',
]

const DOMAINS = ['physics', 'metaphysical', 'relational', 'temporal'] as const
const DEBTS = [13, 14, 16, 19] as const

// reduce: digital root, keeping 11 and 22 (the visitations) unmixed
export function digitSum(n: number): number {
  let s = 0
  while (n > 0) { s += n % 10; n = Math.floor(n / 10) }
  return s
}

export function reduce(n: number): { final: number; chain: number[] } {
  const chain: number[] = []
  let v = n
  while (v > 9 && v !== 11 && v !== 22) {
    chain.push(v)
    v = digitSum(v)
  }
  return { final: v, chain }
}

export function lifePath(date: string): { value: number; chain: number[] } {
  // date: YYYY-MM-DD — the road a person arrives into
  const digits = date.replace(/[^0-9]/g, '').split('').map(Number)
  const total = digits.reduce((a, b) => a + b, 0)
  return { value: reduce(total).final, chain: [total, ...reduce(total).chain] }
}

export function expressionOf(name: string): { value: number; chain: number[] } {
  const total = name.toUpperCase().split('').reduce((a, ch) => {
    const v = LETTER_VAL[ch]
    return a + (v ?? 0)
  }, 0)
  return { value: reduce(total).final, chain: [total, ...reduce(total).chain] }
}

export function radiantOf(lp: number, ex: number): number {
  return reduce(lp + ex).final
}

export function tierOf(radiant: number): string {
  // 1..9 → I..IX; the visitations 11/22 → X Moonsilver / XI First Light
  const idx = radiant === 11 ? 9 : radiant === 22 ? 10 : radiant - 1
  return TIERS[Math.max(0, Math.min(10, idx))] ?? TIERS[9]
}

export function debtsOf(chain: number[]): { debt: number; sector: number; domain: string }[] {
  const seen = new Set<number>()
  const out: { debt: number; sector: number; domain: string }[] = []
  for (const v of chain) {
    if ((DEBTS as readonly number[]).includes(v) && !seen.has(v)) {
      seen.add(v)
      const sector = Math.floor(v / 3) % 4
      out.push({ debt: v, sector, domain: DOMAINS[sector] })
    }
  }
  return out
}

export interface SparkMap {
  name: string
  birth_date: string
  life_path: { road: number; chain: number[] }
  expression: { vessel: number; chain: number[] }
  radiant_number: number
  color_tier: string
  season_note: 'the year is weather, never identity'
  karmic_conditions: { debt: number; carrier: 'road' | 'vessel'; sector: number; domain: string }[]
  seed_line: string
}

export function sparkMap(fullName: string, birthDate: string): SparkMap {
  const lp = lifePath(birthDate)
  const ex = expressionOf(fullName)
  const radiant = radiantOf(lp.value, ex.value)
  const conditions = [
    ...debtsOf(lp.chain).map((d) => ({ ...d, carrier: 'road' as const })),
    ...debtsOf(ex.chain).map((d) => ({ ...d, carrier: 'vessel' as const })),
  ]
  const seedText = `first-spark · ${fullName} · ${birthDate}`
  const seed = BigInt('0x' + createHash('sha256').update(seedText).digest('hex'))
  const trits = balancedTrits(seed, 108)
  return {
    name: fullName,
    birth_date: birthDate,
    life_path: { road: lp.value, chain: lp.chain },
    expression: { vessel: ex.value, chain: ex.chain },
    radiant_number: radiant,
    color_tier: tierOf(radiant),
    season_note: 'the year is weather, never identity',
    karmic_conditions: conditions,
    seed_line: `${seed.toString(16).slice(0, 16)} ⟦${wire(trits)}⟧`,
  }
}

function main(): void {
  const [name, date] = process.argv.slice(2)
  if (!name || !date) {
    console.error('usage: node spark.ts "<Full Birth Name>" YYYY-MM-DD')
    process.exit(1)
  }
  const map = sparkMap(name, date)
  mkdirSync(OUT, { recursive: true })
  const file = join(OUT, `spark-0x${createHash('sha256').update(`${name}·${date}`).digest('hex').slice(0, 12)}.json`)
  writeFileSync(file, JSON.stringify(map, null, 2))
  console.log(`⟦${map.seed_line}⟧`)
  console.log(`road ${map.life_path.road} · vessel ${map.expression.vessel} · radiant ${map.radiant_number} → ${map.color_tier}`)
  for (const c of map.karmic_conditions) console.log(`debt ${c.debt} on the ${c.carrier} — ${c.domain} (sector ${c.sector})`)
  console.log(`manifest: ${file}`)
}

import { resolve } from 'node:path'

// ESM entry guard: main() only when run as the CLI, never on import
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}