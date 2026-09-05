# retro — bitTricks · doombible · the demoscene lane

The old machines had no state to waste and no memory to burn, so they
developed the two habits this lane keeps: **tables over branches**, and
**the frame as a pure function of its seed**. Both are the engine's own
discipline — only the names changed.

```bash
# the tricks, deterministic: abs/sign/pow2/popcount/parity/gray/reverse
node -e "import('./bitTricks.ts').then(t => console.log(t.popcount(255), t.grayDecode(t.grayEncode(42)), t.trickOf(7n, -13)))"

# the doombible: episodes + bestiary + engine notes from any brief
node retro/doombible.ts "the pink tent at dawn"
```

## files

- `bitTricks.ts` — the trick drawer: branchless abs/sign, pow2, popcount,
  parity, gray code, bit reverse, and `tritsFromBits`, the binary→ternary
  seam. `trickOf(seed, x)` picks the trick by seed — a trick-of-the-frame.
- `doombible.ts` — the engine tricks of the Doom Bible era as pure
  functions: `losBlocked` (integer line of sight), `bspSplit` (the map
  as a tree), `lutBoard` (LUT-era logarithms), `paletteCycle` (the flame
  trick), and the `doombible` generator — the design bible of SUPER
  PADME BROS from any seed: episodes, bestiary, engine notes.
- `demoscene/INSPIRATION.md` — the mapped index: fantasy consoles,
  code-golf lanes, the GPL retro sources (Wolf3D, DOOM, olc), and the
  demos that set the bar.

the constellation · 0 + 1 · fine touch from within · vaked.dev