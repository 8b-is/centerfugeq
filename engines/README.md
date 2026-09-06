# the engines — where the artifacts land

Every artifact the engine produces is a plain file: JSON pixel grids,
PCM16 WAV, JSON tilemaps, PNG frames. That makes the lane engine-agnostic
by construction. Mapping to the open engines:

## indie / pixel-art lane

| Engine | Open? | Input | Path |
|---|---|---|---|
| [TIC-80](https://tic80.com/) | yes (MIT) | sprite grids, CSV maps, WAV chips | `sprites.ts` → paste RGBA grid; `tilemap.ts` pico8 export is directly ingestible; `chip.ts` WAV is sample-ready |
| [PICO-8](https://www.lexaloffle.com/pico-8.php) | no (paid, self-hosteable) | ASCII maps, sprites | same artifacts; the `pico8Export` CSV is one paste away |
| [WASM-4](https://wasm4.org/) | yes (MIT) | binary frames, palette | `sprites.ts` RGBA → `blit` buffer; deterministic palette = the wasm-4 palette contract |
| [Godot](https://godotengine.org/) | yes (MIT) | tilemaps, scenes | `tilemap.ts` JSON → TileMap layer; `blender3d` frames → textures |
| [olc::PixelGameEngine](https://github.com/OneLoneCoder/olcPixelGameEngine) | yes (OLC-3) | raw arrays | `sprites.ts` pixels → `olc::Sprite` |
| [Bevy](https://bevyengine.org/) | yes (Apache/MIT) | JSON levels, WAV | `tilemap.ts` + `chip.ts` are drop-in assets |

## 2.5D / 3D lane

| Tool | Open? | Input | Path |
|---|---|---|---|
| [Blender](https://www.blender.org/) | yes (GPL) | `.py` scenes | `blender3d/scene_builder.ts` → headless EEVEE renders; the Centerfuge suite pattern |
| [Godot 3D](https://godotengine.org/) | yes (MIT) | glTF/PNG | blender-rendered frames → sprites for 2.5D billboards; heightfields → terrain |
| [Raylib](https://www.raylib.com/) | yes (zlib) | textures/model | PNG frames + WAV + JSON levels; the whole pack is one `LoadX` each |

## the party pack

`party.ts` bundles everything from one brief into `out/party/<seed>/`:
the sprite sheet, the chip tune, the tilemap, the Blender frame, and the
8K intro link — with the size budget printed next to each file, so a
party entry knows its weight class before entering.

the constellation · 0 + 1 · fine touch from within · vaked.dev
## the plenum lane — RSVP, applied

`quantGame/rsvp.ts` — the plenum relaxation: homogeneous medium → internal
differentiation → voids opening + structures closing → loss of usable work,
as ONE redistribution rule (`dρ/dt = -∇·(ρv)`). The learning from the RSVP
lineage (january 2021 brick-to-sponge → july 2022 centerless premise),
with the epistemic statuses disaggregated in the module header:

- **[established]** the skeleton and the observer-relative premise — standard
  cosmology, not a proposal
- **[proposed]** the local fields: scalar permeability gating a vector flow,
  entropy production as usable-work cost
- **[checked]** `observerInvariance()` — the horizon-centered description from
  any site; `rsvpSelftest()` — voids open, usable work exhausts monotonically

Observables are centerless by construction: `observeFrom(st, ox, oy)` returns
the apparent radial flow from ANY observer. The playable form is
`quantGame/plenum-floor.html` — drag the crosshair: every observer is the
center; the profile's shape does not change (verified, not asserted).

`node --experimental-strip-types quantGame/rsvp.ts` runs the selftest —
replayable ⇒ admissible.

the constellation · 0 + 1 · fine touch from within · vaked.dev
