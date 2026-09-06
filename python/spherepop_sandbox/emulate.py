#!/usr/bin/env python3
# /// script
# requires-python = ">=3.14"
# ///
"""spherepop_sandbox.emulate — the world emulation CLI.

Run the spherepop world headlessly: a brief becomes a level, the world
steps deterministically, and a JSON trace lands in out/sandbox/.

    uv run --script python/spherepop_sandbox/emulate.py "the keeper of the 108 gates" --steps 600

Modern stdlib here: argparse, pathlib.Path.walk (3.13+) to find the
config, hashlib for the seed, json for the trace, match for the key
parser. One seed, one world, one trace — byte-identical every replay.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from world import Bus, Config, World


def seed_of(brief: str) -> int:
    return int.from_bytes(hashlib.sha256(brief.encode()).digest()[:8], "big")


def find_config(start: Path) -> Path:
    """Path.walk (3.13+) — the config can live anywhere under the sandbox."""
    for root, _dirs, files in start.walk():
        if "sandbox.toml" in files:
            return root / "sandbox.toml"
    raise FileNotFoundError("sandbox.toml not found")


def parse_keys(tokens: list[str]) -> dict[str, bool]:
    """match-based key parser — 'd', 'w', 'a', 's', 'x'."""
    keys: dict[str, bool] = {}
    for tok in tokens:
        match tok:
            case "d" | "right":
                keys["d"] = True
            case "a" | "left":
                keys["a"] = True
            case "w" | "up":
                keys["w"] = True
            case "s" | "down":
                keys["s"] = True
            case "x" | "dash":
                keys["x"] = True
            case _:
                pass
    return keys


def main() -> int:
    ap = argparse.ArgumentParser(description="spherepop world emulation")
    ap.add_argument("brief", nargs="?", default="the keeper of the 108 gates")
    ap.add_argument("--steps", type=int, default=600)
    ap.add_argument("--keys", nargs="*", default=[], help="held keys, e.g. d w x")
    ap.add_argument("--out", default=None, help="trace output path")
    args = ap.parse_args()

    cfg = Config.load(find_config(Path(__file__).parent))
    world = World(cfg, seed_of(args.brief))
    keys = parse_keys(args.keys)
    for _ in range(args.steps):
        world.step(0.016, keys)
        world.steps += 1
        if world.game_over:
            break

    trace = world.trace()
    out = Path(args.out) if args.out else Path(__file__).parent.parent.parent / "out" / "sandbox" / f"{seed_of(args.brief):016x}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(trace, indent=2))
    print(f"⟦ spherepop sandbox · {args.brief} · {world.steps} steps ⟧")
    print(f"player: {trace['player']}")
    print(f"lamps: {trace['lamps']} · events: {len(trace['events'])}")
    print(f"trace: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
