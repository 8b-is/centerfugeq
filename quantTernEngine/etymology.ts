#!/usr/bin/env node
// etymology.ts — Etymological Conception Systems (#69 of the WIP catalog):
// a word is not a label, it is a seed. This engine grows the conception
// field of a word deterministically: each generation applies seeded sound
// shifts and a semantic drift step, so a single input word unfolds into a
// tree of descendants with eras, forms, and drifted meanings.
//
// Epistemic statuses:
//   [established]  language changes regularly — sound shifts, borrowings,
//                  semantic drift (the garden: nádasdy, language as dimension)
//   [proposed]     the shift rules below as a symbolic micro-model: first
//                  sound, medial, final, and meaning-vector drift per era
//   [checked]      replayable ⇒ admissible: same seed, same tree — the
//                  selftest asserts determinism, spread, and drift sign

export interface EtyNode {
  word: string
  era: number // generations from the root (0 = the seed word)
  meaning: string // drifted meaning
  drift: number // signed semantic drift from the root, -1..1
  path: string // the rule chain that produced this form
  children: EtyNode[]
}

function lcg(seed: number): () => number {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

function hashText(t: string): number {
  let h = 7
  for (let i = 0; i < t.length; i++) h = (Math.imul(31, h) + t.charCodeAt(i)) | 0
  return h >>> 0
}

// the shift rules — three sound-shift families, each with variants. a rule
// is applied to a word form and returns the shifted form (or null when the
// rule does not apply, e.g. no initial consonant).
type Shift = (w: string, r: () => number) => string | null

const INITIAL_SHIFTS: Shift[] = [
  (w, r) => { const m = w.match(/^([bcdfgjklmnprstvz])/); return m ? (m[1] === 'p' ? 'f' : m[1] === 't' ? 'd' : r() < 0.5 ? m[1] : m[1] === 'b' ? 'v' : m[1]) + w.slice(1) : null },
  (w) => /^([aeiou])/.test(w) ? 'h' + w : /^([bcdfg])/.test(w) ? 'b' + w.slice(1) : null,
  (w) => w.length > 2 && /^[bcdfgjklmnprstvz]/.test(w) ? w[0] + w.slice(2) : null, // cluster simplification
]

const MEDIAL_SHIFTS: Shift[] = [
  (w) => (w.includes('th') ? w.replace('th', 't') : w.includes('ch') ? w.replace('ch', 'k') : null),
  (w) => (w.includes('ae') ? w.replace('ae', 'e') : w.includes('ou') ? w.replace('ou', 'u') : null),
  (w) => (w.length > 3 ? w.slice(0, -2) + w.slice(-1) : null), // final cluster drop
]

const FINAL_SHIFTS: Shift[] = [
  (w) => (w.endsWith('e') ? w.slice(0, -1) : w.endsWith('a') ? w : w + 'e'),
  (w) => (w.endsWith('n') ? w.slice(0, -1) : w.endsWith('r') ? w + 'a' : w.endsWith('s') ? null : w + 'n'),
  (w) => (w.length > 2 ? w.slice(0, -1) : null),
]

function applyShift(word: string, family: Shift[], r: () => number): string | null {
  const start = Math.floor(r() * family.length)
  for (let k = 0; k < family.length; k++) {
    const out = family[(start + k) % family.length](word, r)
    if (out && out !== word) return out
  }
  return null
}

// semantic drift words — the meaning-vector moves through a fixed lexicon
const MEANINGS = ['light', 'water', 'earth', 'breath', 'seed', 'house', 'song', 'hand', 'cloud', 'stone', 'door', 'fire', 'word', 'tree', 'star']
const DRIFT = [-0.2, 0.1, 0.25, -0.1, 0.4, -0.3, 0.15]

export function etymologyInit(word: string, seed?: number): EtyNode {
  const rnd = lcg(seed ?? hashText('etymo·' + word))
  const root: EtyNode = { word: word.toLowerCase(), era: 0, meaning: MEANINGS[hashText(word) % MEANINGS.length], drift: 0, path: 'root', children: [] }
  // two descendant branches per generation — the field spreads
  for (let era = 1; era <= 4; era++) {
    const parents = era === 1 ? [root] : collect(root).filter((n) => n.era === era - 1)
    for (const p of parents) {
      if (p.children.length > 0) continue
      for (let b = 0; b < 2; b++) {
        let form = p.word
        const rules: string[] = []
        // one initial, one medial, one final shift — a journey of the word
        const ri = applyShift(form, INITIAL_SHIFTS, rnd)
        if (ri) { form = ri; rules.push('init') }
        const rm = applyShift(form, MEDIAL_SHIFTS, rnd)
        if (rm) { form = rm; rules.push('med') }
        const rf = applyShift(form, FINAL_SHIFTS, rnd)
        if (rf) { form = rf; rules.push('fin') }
        if (form === p.word) form = p.word + (b === 0 ? 'a' : 'o')
        const d = DRIFT[Math.floor(rnd() * DRIFT.length)]
        const mi = (MEANINGS.indexOf(p.meaning) + (b === 0 ? 1 : -1) + MEANINGS.length) % MEANINGS.length
        p.children.push({
          word: form,
          era,
          meaning: MEANINGS[mi],
          drift: Math.max(-1, Math.min(1, p.drift + d)),
          path: p.path + '/' + rules.join('-'),
          children: [],
        })
      }
    }
  }
  return root
}

function collect(n: EtyNode, out: EtyNode[] = []): EtyNode[] {
  out.push(n)
  for (const c of n.children) collect(c, out)
  return out
}

export function etymologyTree(word: string, seed?: number): EtyNode[] {
  return collect(etymologyInit(word, seed))
}

export function etymologySelftest(): boolean {
  const a = etymologyTree('constellation')
  const b = etymologyTree('constellation') // same seed → identical tree
  const c = etymologyTree('constellation', 12345) // different seed → different field
  const same = JSON.stringify(a) === JSON.stringify(b)
  const diff = JSON.stringify(a) !== JSON.stringify(c)
  const spread = a.length >= 1 + 2 + 4
  const drifted = a.some((n) => Math.abs(n.drift) > 0.01)
  const words = a.filter((n) => n.word !== 'constellation').length
  console.log(`constellation → ${words} descendant forms · drift present: ${drifted} · deterministic: ${same} · seed-sensitive: ${diff} · spread: ${spread}`)
  const sample = a.slice(0, 6).map((n) => `${n.word}(${n.drift >= 0 ? '+' : ''}${n.drift.toFixed(1)})`).join(' ')
  console.log('  field sample: ' + sample)
  return same && diff && spread && drifted
}

if (process.argv[1] && import.meta.url.endsWith('etymology.ts')) {
  const ok = etymologySelftest()
  console.log(ok ? '⟦ etymology selftest: PASS — a word is a seed, the field is replayable ⟧' : '⟦ etymology selftest: FAIL ⟧')
  process.exit(ok ? 0 : 1)
}