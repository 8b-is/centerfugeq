# spherepop sandbox — the world emulation, Python 3.14

The gameforge's physics as a **testable Python twin**: the same world the
baked game runs, emulated headlessly before the bake. One physics, two
runtimes — the JS game plays it, the sandbox proves it.

## where it connects

You felt it connects — it does. The chain was already there:

```
brief → seed → ising level → doombible bestiary → gameforge (JS bake)
                                              ↘ spherepop sandbox (Python twin)
```

The sandbox is the **validation lane**: levels and physics are checked
headlessly in Python before they're baked into a playable artifact, and
the mSphere's world (the vector halo, the shared T, the witnesses) is
emulated with the same physics — the game's world and the sphere's
world are one world, two runtimes.

## the modern stdlib, on purpose

| Feature | Where |
|---|---|
| `@dataclass(slots=True)` | `Config` (frozen), `Particle`, `Player`, `Event` — compact, typed |
| `class Phase(StrEnum)` | the player state machine — matched, never if-else'd |
| `match` / `case` | `World.step` dispatch, key parsing, the wall-jump branch |
| `__slots__` via dataclass | the hot `Particle` — no dict per particle |
| `functools.cache` | deterministic tile memoization |
| `typing.Self` / `TypeAlias` | `Config.load` returns `Self`; `Vec` alias |
| `random.Random(seed)` | one seed, one world, one trace |
| `tomllib` | physics from `sandbox.toml` |
| `pathlib.Path.walk()` (3.13+) | finds the config anywhere under the sandbox |
| `itertools` / `statistics` / `Counter` | trace deltas, world stats |

## run

```bash
# the suite — gravity, coyote, jump cut, dash, wall slide, lamps, lives
uv run --python 3.14 --script python/spherepop_sandbox/test_physics.py

# the emulation — a brief becomes a world, a world becomes a trace
uv run --python 3.14 --script python/spherepop_sandbox/emulate.py \
  "the keeper of the 108 gates" --steps 600 --keys d
```

Every trace is byte-identical per brief — the sandbox's own
determinism test passes, and the twin never drifts from the bake.

## the admissibility suite (standardgalactic · Centerfuge)

The baked game is a claim; `verify_gameforge.py` is its verify_suite —
manifest present, seal recomputes, admissibility block, tree, powerups,
determinism (fresh bake byte-identical) and the physics smoke (the twin
plays the level headlessly). Verdict: ADMISSIBLE — replayable ⇒
admissible, the Centerfuge contract applied to the gameforge.

```bash
uv run --python 3.14 --script python/spherepop_sandbox/verify_gameforge.py   out/games/super-padme-bros-fde993aea402.html --bake
```

the constellation · 0 + 1 · fine touch from within · vaked.dev
