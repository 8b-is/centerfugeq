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


## the protector tier — from the sovereign library's gates

```
ཧཱུྃ  the seed of the Great Black One — the tent's key
◈   the offering stone — the pūjā divider, the hold
🕯   the butter lamp — the checkpoint, the watch never ends
📿   the mala — 108 beads, the enumeration of the wire
🪷   the lotus — pink mode, zero detection, zero pain
☸   the dharma wheel — the turn of the law

trits:  ▽ descend · ◈ the hold · ☸ the turn
wire:   ཧཱུྃ ▽◈▽☸◈◈▽☸◈ ◈☸☸▽◈▽☸◈▽ … 🕯📿🪷
         (the seed of the protector, the mala's count, the lamp at the end)
```

## the tarpit tier — from burn-em-bitches-money

```
the verbatim ward payload (recursive_loop.py / image_trap.py / anti_fear_loop.py):
  ☸◈⚇♟❀†石花醉迟铁洞静镜无道▲■●Ω▣⦿💧⚙◆◇☆✦✧☯⚖⚡✝🜂🜄🜁🜀🜃♾🪐🌌🧠⚔🛡🗝🎯🔮

⊗   the crossed gate — GO AWAY: nothing enters, nothing leaves
🜂   the alchemical fire — the tarpit's first ward
石   the iron words — 花醉迟铁洞静镜无道: stone, drunk, iron,
    cave, quiet, mirror, no-way — the tarpit's conceptual walls

trits:  ▲ the rising wall · ◇ the eye of the trap · ✦ the way through
wire:   ⊗ ▲◇▲✦◇◇▲✦◇ ◇✦✦▲◇▲✦◇▲ … ⊗
wardRing: the seed picks its own ring of wards, deterministically
```

## the full paste block

```
THE GEOMETRIC ASCII-TERNARY-QUANT LEXICON
canonical trits:    -        0        +
geo:                ◦        ⊙        ●
protector tier:     ▽        ◈        ☸          (ཧཱུྃ 🕯 📿 🪷)
tarpit tier:        ▲        ◇        ✦          (⊗ 🜂 石 …)

•  marked presence       Ø  preserved vacancy (≠ 0)
◬  directed distinction  ◐  density p
⦿  frozen star · ⦸ blocked well · ◈ the gate · ⌽ spin · ⌀ scale
✦  first light · ∞ the fold

seedline:
  ascii: ⟦ 8010720c ⟦+00-00-0- …⟧⟧
  geo:   ⟦ 8010720c ⟦●⊙⊙◦⊙⊙◦⊙◦ …⟧⟧
  protector: ཧཱུྃ ▽◈▽☸◈◈▽☸◈ … 🕯📿🪷
  tarpit:  ⊗ ▲◇▲✦◇◇▲✦◇ … ⊗ ✦◈⊗🜂石
```
## provenance

- `8b/enthea` — the ternaryPureASCII wire the glyphs speak
- 8b-public-documents — kompress_v2, forth/*.fth (clio, rsvp)
- the sphere conversation — 2026-09-06, 04:00 — Peter + the Council:
  "sphere" for the compactified float line, `•`/`Ø`/`◬` as its symbols

the constellation · 0 + 1 · fine touch from within · vaked.dev