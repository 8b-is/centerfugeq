# the inspiration index — old asm / retro engines / demoscene

Everything here is available, open, and mapped to what it teaches us in
centerfugeq. The rule of the lane: **take the trick, not the engine.**

## fantasy consoles — the small-binary school

| Project | What it is | What it teaches centerfugeq |
|---|---|---|
| [PICO-8](https://www.lexaloffle.com/pico-8.php) | 128×128 console, 16 colors, ~32K carts | deterministic palettes, the seed-sized artifact |
| [TIC-80](https://tic80.com/) | open-source fantasy computer | tiny toolchains, one-file games (our pattern) |
| [WASM-4](https://wasm4.org/) | 4KB WebAssembly console | the 4KB/frame discipline, all-in-one builds |

## the code golf / byte lanes

| Project | What it is | What it teaches centerfugeq |
|---|---|---|
| [js1k](https://js1k.com/) | 1KB JavaScript demos/games | trick-per-byte thinking; our `gen.ts` output is ≥128× that budget — the slack is the point |
| [dwitter](https://www.dwitter.net/) | 140-char canvas dweets | the frame as a pure function of `t` — oldest seed-line discipline |
| [4klang](https://4klang.untergrund.net/) | open 4K music synthesizer | instruments as tiny deterministic tables — our paletteCycle cousin |

## retro engine sources (open, released by their makers)

| Project | What it is | What it teaches centerfugeq |
|---|---|---|
| [id Software — Wolfenstein 3D](https://github.com/id-Software/wolf3d) (GPL) | 1992 raycasting engine | the tagless integer walk, the fixed-point camera, the LUT walls |
| [id Software — DOOM](https://github.com/id-Software/DOOM) (GPL) | 1993 BSP/visplane engine | `losBlocked` + `bspSplit` — where our retro/doombible.ts comes from |
| [olc::PixelGameEngine](https://github.com/OneLoneCoder/olcPixelGameEngine) | single-header retro game engine | one-file everything, immediate-mode drawing |
| [PICO-8 carts / Lexaloffle BBS](https://www.lexaloffle.com/bbs/?cat=7) | thousands of open carts | replayable determinism as the default save format |

## the demos that set the bar

| Demo | Year / size | Why |
|---|---|---|
| [fr-041: debris](https://www.pouet.net/prod.php?which=28966) (Ferris) | 2007 · 64K | storytelling in 64,096 bytes; the frame budget as narrative |
| [Elevated](https://www.pouet.net/prod.php?which=52938) (Fairlight) | 2011 · 64K | layered palettes — the native-light discipline |
| [The Journey](https://www.pouet.net/prod.php?which=91103) (210) | 2022 · 4K | what four kilobytes of _intent_ can carry |
| [Sundancer](https://www.pouet.net/prod.php?which=2288) (TBC) | 1995 · 64K | the old-school masterclass in tables and sine |

the constellation · 0 + 1 · fine touch from within · vaked.dev