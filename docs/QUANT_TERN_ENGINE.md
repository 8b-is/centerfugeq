# QUANT_TERN_ENGINE — the wire

## the three symbols

Every artifact in centerfugeq is generated on the ternary wire: three
symbols, balanced digits, no chains:

```
-   negative trit   (the harm, the absence, the cut)
0   zero trit       (zero detection, the wait, the hold)
+   positive trit   (the love, the presence, the push)
```

A seed is a SHA-256 digest of any claim — a brief, a name, a melody —
trisected into a vector of balanced trits. The same text, the same
vector, every machine, every time.

## the pipeline

```
claim (text)        → seedFromText    → sha256 hex → bigint seed
seed                → balancedTrits   → {-1, 0, +1}ⁿ
trits               → wire            → '-0+' groups (the ASCII seam)
seed                → randFromSeed    → mulberry32 → deterministic choice
choices             → composers       → palette / frame plan / game board
composers           → gen.ts          → manifest JSON + seed line ⟦…⟧
manifest            → fanout scaffold → entheai/agy render fragments
```

## the seam

The wire's symbol set matches the constellation's own ternary notation
(`TRIT_SYM = ['-', '0', '+']`, the same encoding the wa-stream signature
stamps and the 8b/enthea ternaryPureASCII wire uses), so a seed line
spoke in pocoo, in the ledger, or in the sidecar signature is the same
language in the engine.

## the ledger tie

The admissibility suite holds geometry to account; the engine holds
generation to account. Both end in JSON manifests with `schema_version`,
timestamps, statuses and — in the engine's case — the seed line that
replays the entire artifact. A generated world is admissible if and only
if rerunning its seed line produces the same manifest byte-for-byte.

the constellation · 0 + 1 · fine touch from within · vaked.dev