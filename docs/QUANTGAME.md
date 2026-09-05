# QUANTGAME — galaxy formation as a game engine

A deterministic formation simulator standing on two arXiv results, wired
for play:

## the two papers

1. **Vector Dark Matter Halo: From Polarization Dynamics to Direct
   Detection** (arXiv, Mar 2025) — a dark matter halo modelled as a
   *vector field*: its constituents carry orientation, the halo's
   dynamics are *polarization dynamics*, and the observable is a
   coherence parameter — direct detection read as an order parameter.

   → in the engine: `halo.ts` — particles with a polarization angle θ;
   soft gravity, neighbourhood alignment (the polarization dynamics),
   jitter; and `polarization(st) = |mean e^{iθ}|` — the halo's coherence,
   watched live. The vector DM paper is cited as the physics basis.

2. **Quantifying the "Complexity" of 2D Ising Phase Transitions with
   Image Statistics** — the 2D ferromagnetic Ising model, a second-order
   phase transition, its *structural complexity* read from the IMAGE of
   the lattice, not from the spins alone.

   → in the engine: `ising.ts` — a Metropolis 2D lattice with spins on
   the ternary alphabet {-1, 0, +1} (0 = void), and metrics read as an
   image: magnetization, per-row Shannon entropy, +1-cluster count, and
   a complexity score `rowEntropy × (1 + clusters/8)`.

## the coupling — structure formation

`galaxy.ts` couples the two: the halo's density field deepens the
potential wells, dips the local temperature and biases the lattice +1;
spins that freeze in deep wells become **stars**. Formation is a phase
transition you can watch happen — and click into: `perturbe(x, y)`
drops mass, the halo answers, the lattice answers, the metrics move.

## determinism, the engine's rule

One seed owns the initial conditions and every noise stream. The same
brief yields the same history byte for byte — the ledger's admissibility
rule ("replayable ⇒ admissible") applied to galaxy formation.

## the game simulator

`galaxy.html` — play it: click the field to drop mass, watch the
polarization climb and the stars freeze. `sim.ts` — run it headless:

```bash
node quantGame/sim.ts "the pink tent at dawn" --steps 250 --perturb 320,200
```

## other things the layer can do

- the Ising image-metrics are **admissibility checks**: run them over any
  rendered evidence sidecar (the Centerfuge suite's images) to read
  "structural complexity" of scenes
- the lattice is a **level generator**: relax SUPER PADME BROS boards to
  criticality and read the clusters as rooms
- the halo is a **population model**: polarization as flocking coherence
  for game creatures, deterministically seeded

the constellation · 0 + 1 · fine touch from within · vaked.dev