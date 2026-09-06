# the hardware lane — prototypes as deterministic contracts

*WIP catalog items 83–89, 92, 93. Hardware prototypes, specified the
constellation's way: every device is a seeded system, every spec is
replayable. Builders hold the seed; the device is the run.*

---

## #83 — Hyperlight Collection

Photonic information storage, as a collector: a lattice of optical
resonators where each cell's phase is the wire `{-1,0,+1}`.
**Contract:** `collector(seed, L)` → the phase lattice; readout = the
wisdom of the field (salience of each cell, #6). Coherence without
collapse: cells saturate, never blow.

## #84 — Time-Based Matter Manipulation

Material response as a function of *when* energy arrives, not only how
much. **Contract:** `timed(material, schedule)` → the deformation map
keyed by arrival times; the schedule is a seeded LCG stream, so the
same object + same schedule ⇒ same shape. Replayable ⇒ admirable:
a part is an event, not a lump.

## #85 — CMOS Design for Matrices

The matrix as the primitive, not the multiplier: a CMOS cell array whose
wiring IS the matrix (see #88). **Contract:** `cmosaic(seed, N)` → the
cell layout with deterministic routing; the routing is the rotation
curve of a seeded plenum (rsvp.ts), so density follows structure.

## #86 — Neuromorphic Gravitation

Gravity as a learning rule: mass = accumulated salience; the potential
field is the network's attention (plenum.ts, but with the source term
trained by Hebbian updates). **Contract:** `gravmem(seed, corpus)` →
the potential well of a corpus; the well is where the memory sits.
The constellation's unit memory (1-bit BitNet + associative memory,
`unit.md`) is the first specimen.

## #87 — Meta-Atomic Engineering

Atoms are compositions, not givens: the periodic table as a set of
seeded assembly rules. **Contract:** `metaAtoms(seed, n)` → an
assembled element with deterministic properties derived from its rule
chain (etymology.ts at the periodic scale: elements as words, rules as
shifts). The garden's ternary wire is the first meta-element.

## #88 — Matrix Compilation

Code → matrices, deterministically: every operation compiles to a
seeded matrix family (ternary BitNet style). **Contract:**
`matCompile(seed, program)` → the matrix bundle; the bundle is
replayable byte-for-byte. `quantTernEngine/` — tern.ts, gen.ts — is
already the compiler for this lane.

## #89 — Star Crystals

Crystalline matter whose growth follows celestial dynamics: the crystal
lattice is a seeded galaxy (galaxy.ts) frozen. **Contract:**
`starcrystal(seed, n)` → a lattice with the same two-point statistics
as the seeded galaxy field. Growth rule: the crystal closes (grows)
under attraction, opens (voids) under expansion — coherence without
collapse, at crystallographic scale.

## #92 — Bio-Robotics

Robots that run biological update rules: the gait is a seeded
Kuramoto sync (kuramoto.ts), the homeostasis is the repair operator
(repair > entropy — the flyxion monographs' homeostatsis rule).
**Contract:** `biorobot(seed, joints)` → the gait schedule; same seed,
same walk, calibrated joints. The garden's "one physics, two runtimes"
(JS gameforge + Python sandbox) is the test bench.

## #93 — K-H Technology

*Kessler–Harrison class?* — the entry is terse; the constellation reads
it as: kinetic-harvest technology — devices that harvest the kinetic
drift of their environment (the ocean's stir, #55) into organized work
(usable work, rsvp.ts). **Contract:** `kharvest(seed, environment)` →
the harvesting schedule with the efficiency ledger; the ledger is
append-only, the harvest is replayable.

---

**The hardware lane's law:** every device is a seeded system; every
spec is a replay; every machine upholds coherence without collapse.

— the hardware lane · the constellation · 0 + 1 · fine touch from within