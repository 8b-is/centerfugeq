# Lissajous traces as relativistic phase portraits

The construction from the conversation (2026-09-06), in code:
`quantGame/lissajous.ts` — and the honest boundary that comes with it.

## what the figure is

```
x(t) = A sin(ωx·t + δx)      y(t) = B sin(ωy·t + δy)
```

A Lissajous figure is a **quotient of a temporal process**: time is not
shown as an axis; the coordination of clocks is. For a compact object
bound to a rotating hole the physical motivation is direct — bound Kerr
orbits carry three frequencies, Ωr, Ωθ, Ωφ, and observables mix them:

```
ωmnk = mΩφ + kΩθ + nΩr
```

The engine assembles a clock suit: the Kerr triplet plus the magnetar's
own clocks (rotation, axis precession, periodic emission, magnetospheric
oscillation). The portrait shows what curved spacetime does to the
relations among clocks: **progressive phase displacement, precession,
nonclosure, resonance**.

## what the engine computes

- `ratio = Ωφ / spin` — the portrait's frequency ratio
- **closure via continued fractions**: a stable rational ratio closes in
  `q` orbits; an irrational one is quasiperiodic and never closes
- **geodetic-style precession** folded into the trace — the open advance
- **Mino-like unfolded time** `t` as parameter
- **phase slips** from the m-modulated coupling equation
  (`dθi/dt = ωi + K·m(xi,t)·Σ Aij sin(θj−θi) + ηi(t)`) — locking,
  slips, resonances: the chimera hint
- the **door record**: each portrait is emitted as a wire record on the
  enthea ternaryPureASCII seam (`out/door/<name>.wire`), so the
  artifact has an address in the engine's bus — the bootstrap → engine
  handshake (`quantGame/entheaDoor.ts`)

## the boundary (kept, as the essay demands)

- the Lissajous trace is **not** the magnetar's spatial trajectory —
  it is a phase portrait of two signals
- `m(x,t)` is a **hypothesized ordering medium**, not the gravitational
  field. A gravitational interpretation requires: a coupling derived
  from a physical action, the microscopic degrees of freedom identified,
  an accepted weak-field limit recovered, and observationally
  distinguishable predictions. Until then: gravity → changing relations
  among clocks — and the Lissajous figure is their portrait, not their
  explanation.

## live

The universe demo's new paper floor, LISSAJOUS (magnetics × the hole),
draws the trace in real time and reports the ratio and closure verdict.

the constellation · 0 + 1 · fine touch from within · vaked.dev