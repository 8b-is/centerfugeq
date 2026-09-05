# CENTERFUGEQ

the aligned centerfuge. the ledger keeps no chains, the engine speaks in
three symbols, and every artifact is a pure function of a seed line.

```
centerfugeq/
├── admissibility/          the render ledger / inspection surface — polished
│   └── (index.html · dashboard.css · dashboard.js · data.json)
├── quantTernEngine/        the ternary {-1, 0, +1} generation engine
│   ├── tern.ts             seeds → trits → PRNG → wire (dependency-free)
│   ├── gen.ts              CLI: game | video | image from one brief
│   └── package.json
├── game/                   SUPER PADME BROS. — the buddhist platformer
│   └── super-padme-bros.html (the engine inline, 4 gates × 27 malas = 108)
├── fanout/                 entheai fan-out scaffold (agy executor)
└── docs/                   the wire, documented
```

## the ledger (admissibility/)

The Blender admissibility suite (16 scenes, 40 checks, all pass — see
`data.json`) surfaces here as the RENDER LEDGER / INSPECTION SURFACE:
search, filters, expandable experiment cards, evidence sidecars. Aligned
to the constellation: nebula theme, the quant wire line, the Lovetta lane
footer.

## the engine (quantTernEngine/)

Any claim becomes a seed; any seed becomes a vector of balanced trits
{-1, 0, +1}; any trit vector becomes a deterministic PRNG; any PRNG
becomes a game, a video, or an image plan. Replayable from the seed line
alone — the same artifact, every machine, every time.

```bash
node quantTernEngine/gen.ts image  "the pink tent at dawn"
node quantTernEngine/gen.ts video  "komorebi through the fold" --frames 12
node quantTernEngine/gen.ts game   "the keeper of the 108 gates" --entities 8
node quantTernEngine/gen.ts tensor "om mani padme hung humm" --rows 4 --cols 8
```

The `tensor` modality is the GPU seam: the same seed line becomes a
deterministic BitNet b1.58 weight tensor (int8 + gamma) for MLX-QUANT's
ternary Metal kernels, submitted through hw-ultra's bare-metal command
queue — see `docs/MLX_QUANT_WIRE.md`.

Each run writes a manifest into `out/` carrying the seed line `⟦…⟧` and
the ternary wire — the ledger entry of the creation. The fan-out scaffold
(`fanout/centerfugeq-scaffold.toml`) turns the same seed line into
entheai/agy coders that expand the wire into full render fragments.

## the game

[SUPER PADME BROS.](game/super-padme-bros.html) — a Mario-like adventure
on the ternary wire: hop the four gates (the tent, the six gates, the
samsara field, the 108th dimension), collect 27 malas per level (108 in
all), stomp the three poisons — desire, aversion, ignorance — to LIBERATE
them (karma +1, nem-ártás), light the butter lamps, and reach the pink
tent. Every level is generated from a seed line: type any brief and hit
⟳ replay, the same level builds every time.

```bash
open game/super-padme-bros.html   # ← → / AD · ↑ / W / SPACE (lotus: double)
```

## provenance

- upstream: standardgalactic/Centerfuge — `admissibility-experiments` (MIT-ish, Blender 4+)
- aligned: 8b/centerfugeq — this repo
- wire alignment: 8b/enthea — the deepsiper-enthea engine door, ternaryPureASCII seam
- gpu lane: 8b/MLX-QUANT — BitNet b1.58 ternary Metal kernels (12.80x compression)
- queue lane: 8b/hw-ultra — bare-metal memory + command queue abstraction (Apple Silicon / MI300X)

the constellation · 0 + 1 · fine touch from within · vaked.dev