#!/usr/bin/env node
// glyphs.ts — the geometric ascii-ternary-quant lexicon.
// One symbol set for the ternary wire, in three tiers: ASCII canonical,
// geometric display, and the symbolic operators (•, Ø, ◬) from the
// sphere conversation. Everything is a pure function of the seed — the
// glyphs never drift.

import { balancedTrits, seedFromText, wire, type Trit } from './tern.ts'

// the trit alphabet (canonical, ASCII — the replay-safe form)
export const TRIT_SYM = ['-', '0', '+'] as const

// geometric tier — the display form of the same trits
export const TRIT_GLYPH: Record<Trit, string> = {
  [-1]: '◦', // open — the receding arm, the cut
  [0]: '⊙', // the zero with presence — zero detection, addressable
  [1]: '●', // filled — the love, the push, the frozen star
}

// the symbolic operators — the conversation's own definitions
export const OPERATORS = {
  point: '•', // marked presence — a value awaiting placement (Symbol(•))
  vacancy: 'Ø', // preserved absence — refusal, uninstantiated position, ≠ 0
  envelope: '◬', // directed distinction — exterior bound, interior state
  half: '◐', // density p — mean|W|, the MLX-QUANT gamma at a glance
  star: '⦿', // frozen star — +1 locked in a deep well
  wall: '⦸', // blocked well — the lattice's aversion
  gate: '◈', // the 108-fold event — the wheel's fourth turn
  spin: '⌽', // rotation — differential arms, ω ~ 1/r
  scale: '⌀', // the exponent — 2^e, the float's moving floor
  genesis: '✦', // first light — the radiant tier
  fold: '∞', // the union — infinite+1
} as const

// glyphWire: the 108-trit wire, displayed in the geometric tier
export function glyphWire(seedText: string, dims = 108, group = 9): string {
  const trits = balancedTrits(seedFromText(seedText), dims)
  const chunks: string[] = []
  for (let i = 0; i < trits.length; i += group) {
    chunks.push(trits.slice(i, i + group).map((t) => TRIT_GLYPH[t]).join(''))
  }
  return chunks.join(' ')
}

// envelope: the seed line in the ◬ form — ⟦ hex ⟦ wire ⟧⟧
export function envelope(seedText: string, dims = 27): string {
  const hex = seedFromText(seedText).toString(16).slice(0, 16)
  return `⟦ ${hex} ⟦${glyphWire(seedText, dims, 9)}⟧ ⟧`
}

// asciiWire: the canonical replay-safe form (identical to tern.wire)
export function asciiWire(seedText: string, dims = 27): string {
  return wire(balancedTrits(seedFromText(seedText), dims))
}

// the fixed-point doctrine, in three lines — Q16.16, canonical replay
export const FIXED = {
  fracBits: 16,
  scale: 1 << 16,
  mul: (a: number, b: number): number => Math.round((a * b) / (1 << 16)),
  div: (a: number, b: number): number => Math.round((a * (1 << 16)) / b),
} as const