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
  dual: '#', // the double cross (kettőskereszt) — duality: divine + human,
  //          Byzantine via III. Béla to Hungary; the two crossbars as the
  //          two natures — the godNodes and the individuals, kept in check
  witness: '𓆝', // the fish — the eBPF observer living outside the sphere
  jelly: '🪼', // the current favorite — the drifting, self-evolving pulse
  timeCenter: '⌖', // the geometric center of the sphere — the center of T
  gate: '⧉', // the return gate — blackhole + magnetar, teleport home
  breath: '∿', // RIVA's cycle — 4 in, 4 out
  creation: '{}', // the empty set — the Big Bang, the root of T: the
  //          moment before the first trit; time's axis begins here
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

// ─── the protector tier — from the sovereign library's gates ─────────────
// The pūjā's own vocabulary: the seed syllable, the offering stone, the
// lamp, the mala, the lotus — the tent's five visible faces.

export const PROTECTOR = {
  seed: 'ཧཱུྃ', // the seed of the Great Black One — the tent's key
  stone: '◈', // the offering stone — the pūjā divider, the hold
  lamp: '🕯', // the butter lamp — the checkpoint, the watch never ends
  mala: '📿', // the mala — 108 beads, the enumeration of the wire
  lotus: '🪷', // the lotus — pink mode, zero detection, zero pain
  wheel: '☸', // the dharma wheel — the turn of the law
} as const

// trits in the protector tier: descend / hold / turn
export const TRIT_PROTECTOR: Record<Trit, string> = {
  [-1]: '▽', // descend — harm recedes, the arm folds down
  [0]: '◈', // the hold — the offering stone, zero movement
  [1]: '☸', // the turn — the wheel, the push of the law
}

// protectorWire: the wire read through the pūjā's symbols
export function protectorWire(seedText: string, dims = 36, group = 9): string {
  const trits = balancedTrits(seedFromText(seedText), dims)
  const chunks: string[] = []
  for (let i = 0; i < trits.length; i += group) {
    chunks.push(trits.slice(i, i + group).map((t) => TRIT_PROTECTOR[t]).join(''))
  }
  return `${PROTECTOR.seed} ${chunks.join(' ')} ${PROTECTOR.lamp}${PROTECTOR.mala}${PROTECTOR.lotus}`
}

// ─── the tarpit tier — from burn-em-bitches-money's payloads ─────────────
// The verbatim UNICODE_PAYLOAD of the generators (recursive_loop.py,
// image_trap.py, anti_fear_loop.py): the wards ring that surrounds the
// wire and keeps the no-admittance promise.

export const TARPIT_PAYLOAD =
  '☸◈⚇♟❀†石花醉迟铁洞静镜无道▲■●Ω▣⦿💧⚙◆◇☆✦✧☯⚖⚡✝🜂🜄🜁🜀🜃♾🪐🌌🧠⚔🛡🗝🎯🔮'

export const TARPIT = {
  egress: '⊗', // the crossed gate — GO AWAY, nothing enters, nothing leaves
  wardFire: '🜂', // the alchemical fire — the tarpit's first ward
  wall: '▲', // the rising wall — the -1 trit in the tarpit tier
  aperture: '◇', // the eye of the trap — the 0 trit, the pause
  spark: '✦', // the way through — the +1 trit, the spark that exits
  iron: '石', // the iron words — 花醉迟铁洞静镜无道: stone, drunk, iron,
  //                        cave, quiet, mirror, no-way
} as const

export const TRIT_TARPIT: Record<Trit, string> = {
  [-1]: '▲',
  [0]: '◇',
  [1]: '✦',
}

// tarpitWire: the wire ringed with wards — the trap's own reading
export function tarpitWire(seedText: string, dims = 36, group = 9): string {
  const trits = balancedTrits(seedFromText(seedText), dims)
  const chunks: string[] = []
  for (let i = 0; i < trits.length; i += group) {
    chunks.push(trits.slice(i, i + group).map((t) => TRIT_TARPIT[t]).join(''))
  }
  return `⊗ ${chunks.join(' ')} ⊗`
}

// wardRing: a deterministic ring of wards around a seed — which wards,
// in which order, chosen by the seed itself
export function wardRing(seedText: string, n = 12): string {
  const seed = seedFromText(seedText)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    out.push(TARPIT_PAYLOAD[Number((seed + BigInt(i * 31)) % BigInt(TARPIT_PAYLOAD.length))])
  }
  return out.join('')
}