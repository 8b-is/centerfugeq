# the geometric ascii-ternary-quant lexicon

A co-pasteable symbol set for the ternary wire — the display face of the
`8b/enthea` ternaryPureASCII seam, and the symbolic operators from the
sphere conversation (`•`, `Ø`, `◬`). Three tiers: canonical ASCII
(replay-safe), geometric display, symbolic operators.

## the trit alphabet (canonical, ASCII)

```
'-'  negative trit — the harm, the cut, the receding arm
'0'  zero trit    — zero detection, the hold, the wait
'+'  positive trit — the love, the push, the frozen star
```

## the geometric tier (display, same trits)

```
◦  open    — the receding arm, the cut          (trit -1)
⊙  zero with presence — addressable, still zero detection (trit 0)
●  filled  — presence, the push, the star       (trit +1)
```

## the symbolic operators (the conversation's own definitions)

```
•   marked presence    — a value awaiting placement. Symbol(•): a point
                         whose coordinate has not been collapsed. Not yet
                         a float — the preserved possibility of a point.
Ø   preserved vacancy  — an explicitly uninstantiated place. Ø ≠ 0:
                         zero is an admitted value; Ø is the refusal, the
                         aperture into which a point may or may not enter.
◬   directed distinction — exterior bound, interior state: the envelope.
                         The genesis object: ⟪canonical envelope, history
                         digest, latent disposition⟫ — one mark outside,
                         a replayable construction inside.
◐   half-filled        — density p: mean|W|, the MLX-QUANT gamma, alive
⦿   frozen star        — +1 locked in a deep well (the ising freeze)
⦸   blocked well       — -1 wall (the lattice's aversion)
◈   the gate           — a 108-fold event, the wheel's fourth turn
⌽   rotation           — differential arms, ω ~ 1/r
⌀   the scale          — the exponent, 2^e, the float's moving floor
✦   first light        — genesis, the radiant tier
∞   the fold           — infinite+1, the union gate
```

## the wire (co-pasteable)

```
ascii:  ⟦ 8010720c ⟦+00-00-0- -0-+++-0+ ++-0-+00+⟧⟧
geo:    ⟦ 8010720c ⟦⊙⊙◦⊙◦◦⊙◦ ◦⊙◦●●●◦●⊙ ●●◦⊙◦⊙⊙●⟧⟧
envelope: ◬ ⟦ 8010720c ⟦●●◦●●⟧⟧   ✦ 001   ⌀ 16   ∞
star field: ⦿●◦⊙⦸⊙●⦿◦⊙⦿●⊙◦⦿   (a frozen well grid)
event: ◈ the gate · ⌽ the arms wind · ✦ genesis · ∞ the fold
```

Everything is a pure function of the seed — the glyphs never drift.
`glyphWire(text)` and `envelope(text)` reproduce the same string every
replay; `asciiWire(text)` stays byte-identical with the canonical seam.

## the correspondences

| The conversation | The engine |
|---|---|
| SymPy `Symbol(•)` — lazy, inspectable | the seed line: an addressable distinction before numerical commitment |
| Rust `Expr` enum — calculation as data | the engine's modules: tern/spark/doombible — pure functions of a seed |
| Fixed-point Q16.16 — canonical replay | the replay path is integer arithmetic: sha256 → trits → LCG, no floats |
| floats for display only | `FIXED` in glyphs.ts: `mul = round(AB/S)`, `div = round(AS/B)` |

## provenance

- `8b/enthea` — the ternaryPureASCII wire the glyphs speak
- 8b-public-documents — kompress_v2, forth/*.fth (clio, rsvp)
- the sphere conversation — 2026-09-06, 04:00 — Peter + the Council:
  "sphere" for the compactified float line, `•`/`Ø`/`◬` as its symbols

the constellation · 0 + 1 · fine touch from within · vaked.dev