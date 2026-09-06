"""spherepop_sandbox.test_physics — the sandbox's own suite (unittest, 3.14).

Verifies the world emulation: gravity, coyote time, jump buffering,
variable jump cut, dash, wall slide, checkpoints, lives and game over —
the same physics the gameforge bakes, validated headlessly before the
bake. Run: uv run --script test_physics.py
"""

from __future__ import annotations

import unittest
from pathlib import Path

from world import Config, Phase, World


def make_world(seed: int = 42) -> World:
    return World(Config.load(Path(__file__).parent / "sandbox.toml"), seed)


class PhysicsTests(unittest.TestCase):
    def test_gravity_pulls(self) -> None:
        w = make_world()
        y0 = w.player.y
        w.step(0.016, {})
        self.assertGreater(w.player.y, y0, "gravity should pull the player down")

    def test_coyote_time(self) -> None:
        w = make_world()
        w.player.on_ground = False
        w.player.coyote = 0.05  # a step before the window closes
        w.player.jbuf = 0.05
        w.step(0.016, {"w": True})
        self.assertLess(w.player.vy, 0, "coyote window should allow the jump")

    def test_jump_cut_on_release(self) -> None:
        w = make_world()
        p = w.player
        p.vy = -500
        # release: jump cut applies
        w.step(0.016, {})
        self.assertGreater(p.vy, -500 * 0.9, "releasing jump should cut the rise")

    def test_dash_consumes_and_recovers(self) -> None:
        w = make_world()
        p = w.player
        p.dashes = 1
        w.start_dash(1, 0)
        self.assertEqual(p.phase, Phase.DASH)
        self.assertEqual(p.dashes, 0)
        # land exactly on the ground, then the dash restores
        spawn = w._first_solid()
        p.x = spawn * w.cfg.tile + 40
        p.y = (w.cfg.height - w.heights[spawn]) * w.cfg.tile - 44
        w.step(0.016, {})
        self.assertEqual(p.dashes, 1)

    def test_wall_slide_limits_fall(self) -> None:
        w = make_world()
        p = w.player
        p.wall_dir = 1
        p.on_ground = False
        p.vy = 500
        w.step(0.016, {})
        self.assertLessEqual(p.vy, 70 + 0.01, "wall slide should cap the fall")

    def test_checkpoint_lights(self) -> None:
        w = make_world()
        c = w.cfg.lamps[0]
        w.player.x = c * w.cfg.tile + 24
        w.player.y = 100
        w.step(0.016, {})
        self.assertTrue(w.lamp_lit[0], "the butter lamp should light")
        self.assertTrue(any(e.kind == "checkpoint" for e in w.bus.log))

    def test_death_loses_life_and_respawns(self) -> None:
        w = make_world()
        lives0 = w.player.lives
        w.player.y = w.cfg.height * w.cfg.tile + 10  # into the pit
        w.step(0.016, {})
        self.assertEqual(w.player.lives, lives0 - 1)
        self.assertLess(w.player.y, w.cfg.height * w.cfg.tile, "respawned above the pit")

    def test_game_over_at_zero_lives(self) -> None:
        w = make_world()
        w.player.lives = 1
        w.player.y = w.cfg.height * w.cfg.tile + 10
        w.step(0.016, {})
        self.assertTrue(w.game_over, "zero lives should end the run")

    def test_deterministic(self) -> None:
        a = make_world(7)
        b = make_world(7)
        for _ in range(200):
            a.step(0.016, {"d": True})
            b.step(0.016, {"d": True})
        self.assertEqual(a.trace()["player"], b.trace()["player"])
        self.assertEqual(a.trace()["lamps"], b.trace()["lamps"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
