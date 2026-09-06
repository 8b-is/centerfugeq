"""spherepop_sandbox.world — the emulation core, Python 3.14 stdlib.

The gameforge's physics, as a testable Python twin: the same world the
baked game runs, emulated headlessly. Modern stdlib throughout:

    @dataclass(slots=True)   — compact, typed world records
    class Phase(StrEnum)     — the player state machine, matched
    match / case             — event dispatch and state transitions
    __slots__                — the hot particle class
    functools.cache          — deterministic tile memoization
    typing.Self / TypeAlias  — precise signatures
    random.Random(seed)      — one seed, one world
    tomllib                  — physics from sandbox.toml
    itertools.pairwise       — trace deltas
    statistics.mean          — world stats

Where it connects: the gameforge bakes a JS game; this sandbox is the
same world in Python — the physics twin where levels are validated
before baking, and the mSphere's world emulated as one physics, two
runtimes.
"""

from __future__ import annotations

import itertools
import math
import statistics
import tomllib
from collections import Counter, deque
from dataclasses import dataclass, field
from enum import StrEnum, auto
from functools import cache
from pathlib import Path
from random import Random
from typing import Literal, Self, TypeAlias

Vec: TypeAlias = tuple[float, float]


class Phase(StrEnum):
    """The player's state machine — matched, never if-else'd."""

    IDLE = auto()
    RUN = auto()
    DASH = auto()
    DEAD = auto()
    WON = auto()


class Kind(StrEnum):
    """The bestiary — the doombible roster."""

    KEEPER = auto()
    VEIL = auto()
    EMBER = auto()
    RIPPLE = auto()
    LAMP = auto()
    ANGEL = auto()


@dataclass(slots=True)
class Particle:
    """The hot class — dataclass(slots=True): no dict per particle."""

    x: float
    y: float
    vx: float
    vy: float
    kind: Kind


@dataclass(slots=True, frozen=True)
class Config:
    """The physics — frozen, read from sandbox.toml."""

    gravity: float
    max_fall: float
    jump_vel: float
    jump_cut: float
    coyote_time: float
    jump_buffer: float
    run_accel: float
    run_max: float
    dash_speed: float
    dash_time: float
    dash_cooldown: float
    wall_slide_max: float
    wall_jump_vel: float
    wall_jump_away: float
    tile: int
    height: int
    width: int
    lives: int
    malas_total: int
    lamps: list[int]

    @classmethod
    def load(cls, path: Path) -> Self:
        with path.open("rb") as f:
            raw = tomllib.load(f)
        return cls(**raw["physics"], **raw["world"])


@dataclass(slots=True)
class Event:
    """One bus event — the world's messages."""

    kind: str
    data: dict = field(default_factory=dict)


class Bus:
    """The internal eventbus — subscribers, matched on kind."""

    def __init__(self) -> None:
        self._subs: dict[str, list] = {}
        self.log: deque[Event] = deque(maxlen=64)

    def on(self, kind: str, fn) -> None:
        self._subs.setdefault(kind, []).append(fn)

    def emit(self, kind: str, **data) -> None:
        ev = Event(kind, data)
        self.log.append(ev)
        for fn in self._subs.get(kind, ()):
            fn(ev)


@dataclass(slots=True)
class Player:
    """The monk — coyote, buffer, variable jump, dash, wall slide."""

    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    phase: Phase = Phase.IDLE
    on_ground: bool = False
    coyote: float = 0.0
    jbuf: float = 0.0
    dashes: int = 1
    dash_t: float = 0.0
    dash_x: float = 0.0
    dash_y: float = 0.0
    cdash: float = 0.0
    wall_dir: int = 0
    lives: int = 3
    malas: int = 0
    karma: int = 0


class World:
    """The emulation — one seed, one world, deterministic."""

    def __init__(self, cfg: Config, seed: int) -> None:
        self.cfg = cfg
        self.rng = Random(seed)
        self.bus = Bus()
        self.heights = self._heights(seed)
        self.enemies: list[Particle] = [
            Particle(x=14.0 + i * 15, y=0.0, vx=55.0, vy=0.0, kind=Kind.KEEPER)
            for i in range(6)
        ]
        self.lamp_lit = [False] * len(cfg.lamps)
        self.game_over = False
        self.steps = 0
        spawn = self._first_solid()
        self.player = Player(x=spawn * cfg.tile + 40, y=(cfg.height - self.heights[spawn]) * cfg.tile - 46)

    def _heights(self, seed: int) -> list[int]:
        rng = Random(seed)
        tiles = [rng.randrange(4) for _ in range(12 * 12)]
        heights: list[int] = []
        for c in range(self.cfg.width):
            v = tiles[c % 144]
            h = self.cfg.height - 4 - (c % 3) if v == 1 else self.cfg.height - 3
            if v == 2 and c % 6 == 0 and 4 < c < self.cfg.width - 8:
                h = -1
            heights.append(h)
        return heights

    def _first_solid(self) -> int:
        return next(c for c, h in enumerate(self.heights) if h > 0)

    @cache
    def tile_at(self, a: float, b: float) -> int:
        c, r = int(a // self.cfg.tile), int(b // self.cfg.tile)
        if c < 0 or c >= self.cfg.width or r < 0 or r >= self.cfg.height:
            return -1
        h = self.heights[c]
        return -2 if h < 0 else (1 if r >= self.cfg.height - h else 0)

    def grounded_at(self, a: float, b: float) -> bool:
        return self.tile_at(a, b + 44) == 1 and self.tile_at(a + 34, b + 44) == 1

    def start_dash(self, dx: float, dy: float) -> None:
        p = self.player
        if p.cdash > 0 or p.dashes <= 0 or p.dash_t > 0:
            return
        if dx == 0 and dy == 0:
            dx = 1 if p.vx >= 0 else -1
        length = math.hypot(dx, dy) or 1
        p.dash_x, p.dash_y = dx / length, dy / length
        p.dash_t, p.cdash = self.cfg.dash_time, self.cfg.dash_cooldown
        p.dashes -= 1
        p.phase = Phase.DASH

    def step(self, dt: float, keys: dict[str, bool]) -> None:
        p = self.player
        if p.phase in (Phase.DEAD, Phase.WON) or self.game_over:
            return
        match p.phase:
            case Phase.DASH:
                self._dash(dt)
            case _:
                self._move(dt, keys)
        self._world(dt)

    def _dash(self, dt: float) -> None:
        p = self.player
        p.dash_t -= dt
        p.x += p.dash_x * self.cfg.dash_speed * dt
        p.y += p.dash_y * self.cfg.dash_speed * dt
        if self.tile_at(p.x + 6, p.y + 44) == 1 or self.tile_at(p.x + 34, p.y + 44) == 1:
            p.y = (int((p.y + 44) / self.cfg.tile)) * self.cfg.tile - 44
            p.dash_t = 0
        if self.tile_at(p.x, p.y + 6) == 1 or self.tile_at(p.x + 38, p.y + 6) == 1:
            p.y = (int(p.y / self.cfg.tile)) * self.cfg.tile + self.cfg.tile
        if self.grounded_at(p.x, p.y):
            p.dashes = 1
        if p.dash_t <= 0:
            p.phase = Phase.RUN

    def _move(self, dt: float, keys: dict[str, bool]) -> None:
        p = self.player
        want = (keys.get("d", False) - keys.get("a", False)) * self.cfg.run_max
        acc = self.cfg.run_accel
        if abs(want - p.vx) < acc * dt:
            p.vx = want
        else:
            p.vx += math.copysign(acc * dt, want - p.vx)
        match (p.wall_dir, p.on_ground, p.jbuf > 0):
            case (wd, False, _) if wd and keys.get("w", False) and p.jbuf > 0:
                p.vy = -self.cfg.wall_jump_vel
                p.vx = -wd * self.cfg.wall_jump_away
                p.dashes = 1
                p.coyote = self.cfg.coyote_time
                p.jbuf = 0
            case (_, _, True) if p.on_ground or p.coyote > 0:
                p.vy = -self.cfg.jump_vel
                p.on_ground = False
                p.coyote = 0
                p.jbuf = 0
            case _:
                pass
        p.vy = min(p.vy + self.cfg.gravity * dt, self.cfg.max_fall)
        if p.vy < 0 and not keys.get("w", False):
            p.vy *= self.cfg.jump_cut
        p.x += p.vx * dt
        p.y += p.vy * dt
        if keys.get("w", False) and p.on_ground and p.jbuf <= 0:
            p.jbuf = self.cfg.jump_buffer
        p.jbuf -= dt
        if p.on_ground:
            p.coyote = self.cfg.coyote_time
            p.dashes = 1
        else:
            p.coyote -= dt
        if p.cdash > 0:
            p.cdash -= dt
        if p.wall_dir and not p.on_ground:
            p.vy = min(p.vy, self.cfg.wall_slide_max)
        if self.tile_at(p.x + 6, p.y + 44) == 1 or self.tile_at(p.x + 34, p.y + 44) == 1:
            if p.vy > 0:
                p.y = (int((p.y + 44) / self.cfg.tile)) * self.cfg.tile - 44
                p.vy = 0
                p.on_ground = True
        if self.tile_at(p.x, p.y + 6) == 1 or self.tile_at(p.x + 38, p.y + 6) == 1:
            p.y = (int(p.y / self.cfg.tile)) * self.cfg.tile + self.cfg.tile
        p.on_ground = self.grounded_at(p.x, p.y)
        p.wall_dir = 0
        if self.tile_at(p.x, p.y + 20) == 1:
            p.x = (int(p.x / self.cfg.tile)) * self.cfg.tile + self.cfg.tile
            p.wall_dir = -1
        if self.tile_at(p.x + 38, p.y + 20) == 1:
            p.x = (int((p.x + 38) / self.cfg.tile)) * self.cfg.tile - self.cfg.tile - 1
            p.wall_dir = 1
        if p.y > self.cfg.height * self.cfg.tile:
            self._die()

    def _world(self, dt: float) -> None:
        p = self.player
        for i, c in enumerate(self.cfg.lamps):
            lx = c * self.cfg.tile + 24
            gy = (self.cfg.height - self.heights[c]) * self.cfg.tile
            if not self.lamp_lit[i] and lx - 30 < p.x < lx + 40 and gy - 80 < p.y < gy + 10:
                self.lamp_lit[i] = True
                self.bus.emit("checkpoint", i=i)
        for e in self.enemies:
            hcol = self.heights[max(0, min(self.cfg.width - 1, int(e.x)))]
            by = (self.cfg.height - (hcol if hcol > 0 else 1)) * self.cfg.tile
            if e.vx != 0:
                e.x += math.copysign(e.vx * dt, e.vx)
                if e.x < 10 or e.x > self.cfg.width - 6:
                    e.vx = -e.vx
            if p.x + 38 > e.x * self.cfg.tile + 8 and p.x < e.x * self.cfg.tile + 40 and by - 32 < p.y + 44 < by:
                if p.vy > 260 and p.y + 40 < by - 8:
                    e.vx = 0
                    p.karma += 1
                    p.vy = -430
                    self.bus.emit("liberation", name=e.kind.value)
                elif e.vx != 0:
                    self._die()

    def _die(self) -> None:
        p = self.player
        p.phase = Phase.DEAD
        p.lives -= 1
        self.bus.emit("death", lives=p.lives)
        if p.lives <= 0:
            self.game_over = True
        else:
            self._respawn()

    def _respawn(self) -> None:
        p = self.player
        c = 0
        for i, lit in enumerate(self.lamp_lit):
            if lit:
                c = self.cfg.lamps[i]
        if self.heights[c] <= 0:
            c = next(k for k in range(c, self.cfg.width) if self.heights[k] > 0)
        p.x = c * self.cfg.tile + 40
        p.y = (self.cfg.height - self.heights[c]) * self.cfg.tile - 46
        p.vx = p.vy = 0
        p.dashes = 1
        p.cdash = p.dash_t = 0
        p.phase = Phase.IDLE

    def trace(self) -> dict:
        p = self.player
        return {
            "steps": self.steps,
            "player": {"x": round(p.x, 3), "y": round(p.y, 3), "phase": p.phase.value,
                       "lives": p.lives, "malas": p.malas, "karma": p.karma},
            "lamps": self.lamp_lit,
            "game_over": self.game_over,
            "events": [{"kind": e.kind, **e.data} for e in self.bus.log],
            "stats": {
                "mean_x": round(statistics.mean(e.x for e in self.enemies), 2),
                "kinds": dict(Counter(e.kind.value for e in self.enemies)),
            },
        }
