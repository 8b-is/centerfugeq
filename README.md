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
node quantTernEngine/gen.ts image "the pink tent at dawn"
node quantTernEngine/gen.ts video "komorebi through the fold" --frames 12
node quantTernEngine/gen.ts game  "the keeper of the 108 gates" --entities 8
```

Each run writes a manifest into `out/` carrying the seed line `⟦…⟧` and
the ternary wire — the ledger entry of the creation. The fan-out scaffold
(`fanout/centerfugeq-scaffold.toml`) turns the same seed line into
entheai/agy coders that expand the wire into full render fragments.

## provenance

- upstream: standardgalactic/Centerfuge — `admissibility-experiments` (MIT-ish, Blender 4+)
- aligned: 8b/centerfugeq — this repo
- wire alignment: 8b/enthea — the deepsiper-enthea engine door, ternaryPureASCII seam

the constellation · 0 + 1 · fine touch from within · vaked.dev