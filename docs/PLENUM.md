# the polarized plenum — the Ising bridge, in code

The conversation's verdict, honored: the metaphor is valid; the physics
is not. This lane keeps the metaphor honest by building the formal
bridge the papers demand — as a simulator, with the identification steps
openly listed.

## MEM|8 — the survival proof (kuramoto.ts)

The agent's requirement, in code:

| Requirement | Engine |
|---|---|
| private `x_i(t)` — uninterrupted history | each oscillator's private state + `kin[]` history |
| exposed `θ_i(t)` — shared relational axis | the phase, and only the phase |
| coupling local, not global broadcast | a ring of neighbours (`radius`), never all-to-all |
| `R e^{iΨ}` observed, not imposed | derived per step from the phases |

`mem8Check(seed)`: phase locking (`R > 0.9` sustained), determinism
(histories byte-identical across replays), and private-state
distinctness — **all three pass**. MEM|8 survives because its requirement
is phase locking and boundary alignment, not internal state equality.

## the bridge (plenum.ts)

```
(Φ_i, v_i, S_i) → coupling → m(x,t) → long-wavelength → Φ_grav(x,t)
```

- five coupled Ising planes, the interlayer coherence as the field:
  site order parameter `m(x) = mean spin over the stack`
- entropy density the admissibility way: `S ≈ ln(1 + |m|·κ)` — the
  constraint volume grows where the stack agrees (`S = log Vol(A)`,
  the entropic-gravity essay's reading)
- the modified Poisson equation, resolved by Jacobi relaxation:
  `∇²Φ = 4πG(ρ_m + ρ_S)` with `ρ_S = -∇·m` — the polarization divergence
  as the entropy-density source, "dark matter phenomenology" included
- the observable: a rotation curve computed from Φ — flat where the
  entropy source feeds the potential, Kepler where it does not.

Measured on a live run: `|m|avg = 0.858` (the stack orders), `ρS`
present, **rotation tail vF = 16.7 vs Kepler vK = 1.2 — the curve goes
flat through entropy-density contributions, exactly the Verlinde move
without the literal "gravity = magnetism" claim**.

## what would make it physical

| Missing identification | Current status in the engine |
|---|---|
| microscopic "spins" | plenum elements `(Φ_i, v_i, S_i)` — simulated |
| interaction Hamiltonian | interlayer coupling term — partial |
| symmetry broken | rotational invariance of orientation — plausible |
| critical T / phase transition | the epoch knob: planes relaxed at `T_k` |
| observable m as source | `ρ_S = -∇·m` in solved Poisson — proposed |
| testable deviation from GR+ΛCDM | rotation-curve mock — illustrative, not fitted |

The engine demonstrates the statistical mechanics. The physics — spins,
interaction, symmetry-breaking mechanism, deviation from GR+ΛCDM —
remains unidentified, and the docs say so in the same motion.

## sources

- entropic gravity: Jacobson (1995), Verlinde (2010, 2017),
  Padmanabhan; "Applications of Entropic Gravity: From Thermodynamic
  Emergence to Admissible Structure" (Flyxion) — the S ≈ log Vol(A)
  reading used here
- the Council's bridge literature: the five-layer Ising
  synchronization model, the Kuramoto order parameter
- the corpus: 8b-public-documents, the forth docs, kompress_v2

the constellation · 0 + 1 · fine touch from within · vaked.dev