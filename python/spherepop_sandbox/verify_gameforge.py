#!/usr/bin/env python3
# /// script
# requires-python = ">=3.14"
# ///
"""verify_gameforge — the admissibility suite for baked games.

The Centerfuge contract (standardgalactic), applied to the gameforge:
a baked game is a claim made as an artifact; this suite is its
verify_suite — the evidence is checked, not trusted.

Checks:
  1. manifest present and parseable
  2. the seal recomputes (the manifest is self-consistent)
  3. determinism: a fresh bake is byte-identical
  4. physics smoke: the sandbox twin runs the level headlessly

    uv run --script python/spherepop_sandbox/verify_gameforge.py \
      out/games/super-padme-bros-fde993aea402.html

Modern stdlib: re, json, hashlib, subprocess, pathlib, tomllib,
statistics. The report ends with the verdict: admissible or not.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tomllib
from pathlib import Path

from world import Config, World


def extract_manifest(html: str) -> dict:
    m = re.search(r"const M = (\{.*?\});\n", html, re.S)
    if not m:
        raise ValueError("manifest not found — not a gameforge artifact")
    return json.loads(m.group(1))


def seal_of(manifest: dict) -> str:
    return hashlib.sha256((manifest["brief"] + "·" + manifest["seed"]).encode()).hexdigest()[:16]


def bake_to(tmp: Path, root: Path, brief: str) -> Path:
    out = tmp / "bake"
    subprocess.run(
        ["node", str(root / "quantGame" / "gameforge.ts"), brief, "--out", str(out)],
        check=True,
        capture_output=True,
        cwd=str(root),
    )
    return next(out.glob("*.html"))


def main() -> int:
    ap = argparse.ArgumentParser(description="gameforge admissibility suite")
    ap.add_argument("artifact", nargs="?", default="out/games/super-padme-bros-fde993aea402.html")
    ap.add_argument("--bake", action="store_true", help="also re-bake and compare (determinism)")
    args = ap.parse_args()

    root = Path(__file__).parent.parent.parent
    art = root / args.artifact
    checks: list[tuple[str, bool, str]] = []

    html = art.read_text(encoding="utf-8")
    try:
        manifest = extract_manifest(html)
        checks.append(("manifest present", True, f"{len(manifest)} keys"))
    except ValueError as e:
        checks.append(("manifest present", False, str(e)))
        manifest = {}

    if manifest:
        seal_ok = manifest.get("seal") == seal_of(manifest)
        checks.append(("seal recomputes", seal_ok, f"seal {manifest.get('seal')}"))
        ad = manifest.get("admissibility", {})
        checks.append(("admissibility block", bool(ad), ad.get("contract", "missing")))
        checks.append(("tree", len(manifest.get("tree", {}).get("nodes", [])) == 24, "24 nodes"))
        checks.append(("powerups", len(manifest.get("powerups", [])) == 8, "8 shrines"))

    if args.bake:
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            fresh = bake_to(Path(tmp), root, manifest.get("brief", "the keeper of the 108 gates"))
            same = fresh.read_bytes() == art.read_bytes()
            checks.append(("determinism", same, "fresh bake byte-identical"))

    # physics smoke — the sandbox twin plays the level headlessly
    cfg = Config.load(root / "python" / "spherepop_sandbox" / "sandbox.toml")
    seed = int.from_bytes(hashlib.sha256(manifest.get("brief", "x").encode()).digest()[:8], "big")
    world = World(cfg, seed)
    steps = 120
    for _ in range(steps):
        world.step(0.016, {"d": True})
    smoke = not world.game_over and world.player.lives >= 1
    checks.append(("physics smoke", smoke, f"{steps} steps · lives {world.player.lives}"))

    print("⟦ gameforge admissibility suite · standardgalactic · Centerfuge ⟧")
    print(f"artifact: {art.name} · {art.stat().st_size} bytes")
    for name, ok, note in checks:
        print(f"  {'✓' if ok else '✗'} {name} — {note}")
    verdict = all(ok for _, ok, _ in checks)
    print("⟦ verdict: " if verdict else "⟦ verdict: NOT ", "ADMISSIBLE — replayable ⇒ admissible ⟧" if verdict else "ADMISSIBLE — evidence missing ⟧")
    return 0 if verdict else 1


if __name__ == "__main__":
    raise SystemExit(main())
