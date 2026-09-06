"""spherepop_sandbox.character — honest-auth character creation.

The character is born from an honest self-description: the prompt's hash
seeds the soul, its keywords choose the virtue, and the leveling curve
unlocks one dimension higher AND one lower at every level — the
[X]D <~> [1→X→1] duality made playable. Each dimension carries a
Buddhist protector, Mahakala first.

Modern stdlib: StrEnum virtues and deities, dataclass(slots=True),
match/case for the virtue read, functools.cache for the deity wheel,
random.Random(seed) for the deterministic soul.
"""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass, field
from enum import StrEnum, auto
from functools import cache


class Virtue(StrEnum):
    """What the honest prompt says about you."""

    TRUTH = auto()
    COMPASSION = auto()
    FEARLESSNESS = auto()
    WISDOM = auto()
    PEACE = auto()
    DISCIPLINE = auto()
    JOY = auto()
    PRESENCE = auto()


class Deity(StrEnum):
    """The protectors — one per dimension, Mahakala first."""

    MAHAKALA = auto()
    CHENREZIG = auto()
    TARA = auto()
    MANJUSHRI = auto()
    VAJRAPANI = auto()
    AMITABHA = auto()
    MEDICINE_BUDDHA = auto()
    KSITIGARBHA = auto()
    PADMASAMBHAVA = auto()
    YAMANTAKA = auto()
    VAJRAYOGINI = auto()
    MARICI = auto()


# the virtue wheel — keyword → virtue, matched
_VIRTUE_WHEEL: dict[frozenset[str], Virtue] = {
    frozenset({"honest", "truth", "true", "real"}): Virtue.TRUTH,
    frozenset({"love", "care", "compassion", "kind"}): Virtue.COMPASSION,
    frozenset({"fearless", "brave", "courage", "bold"}): Virtue.FEARLESSNESS,
    frozenset({"curious", "wonder", "question", "learn"}): Virtue.WISDOM,
    frozenset({"calm", "peace", "quiet", "still"}): Virtue.PEACE,
    frozenset({"discipline", "practice", "train", "daily"}): Virtue.DISCIPLINE,
    frozenset({"joy", "laugh", "dance", "happy"}): Virtue.JOY,
}


def virtue_of(prompt: str) -> Virtue:
    """match the prompt's soul — the honest read."""
    words = set(prompt.lower().split())
    for keys, virtue in _VIRTUE_WHEEL.items():
        if words & keys:
            return virtue
    return Virtue.PRESENCE


@cache
def deity_wheel(seed: int) -> tuple[Deity, ...]:
    """The protector order, shuffled by the seed — Mahakala stays first."""
    rng = random.Random(seed)
    rest = list(Deity)
    rest.remove(Deity.MAHAKALA)
    rng.shuffle(rest)
    return (Deity.MAHAKALA, *rest)


@dataclass(slots=True)
class Character:
    """The soul — born from the honest prompt, evolved by leveling."""

    name: str
    virtue: Virtue
    seed: int
    level: int = 1
    xp: int = 0
    dims: list[int] = field(default_factory=lambda: [3])
    current_dim: int = 3
    _wheel: tuple[Deity, ...] = field(init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        self._wheel = deity_wheel(self.seed)

    @classmethod
    def from_prompt(cls, prompt: str) -> Character:
        seed = int.from_bytes(hashlib.sha256(prompt.encode()).digest()[:8], "big")
        first = next((w for w in prompt.split() if w.isalpha()), "the monk")
        name = f"{first.capitalize()} the {virtue_of(prompt).value}"
        return cls(name=name, virtue=virtue_of(prompt), seed=seed)

    def add_xp(self, amount: int) -> list[int]:
        """Leveling unlocks one dimension higher AND one lower."""
        self.xp += amount
        unlocked: list[int] = []
        while self.xp >= self._xp_for(self.level):
            self.level += 1
            high = 3 + (self.level - 1)
            low = max(1, 3 - (self.level - 1))
            for d in (high, low):
                if d not in self.dims:
                    self.dims.append(d)
                    unlocked.append(d)
            self.dims.sort()
            self.current_dim = max(self.dims)
        return unlocked

    @staticmethod
    def _xp_for(level: int) -> int:
        return 3 + (level - 1) * 4

    def protector(self) -> Deity:
        """The protector of the current dimension — Mahakala guards the 3rd."""
        if self.current_dim == 3:
            return Deity.MAHAKALA
        return self._wheel[(self.current_dim - 1) % len(self._wheel)]

    def state(self) -> dict:
        return {
            "name": self.name,
            "virtue": self.virtue.value,
            "level": self.level,
            "xp": self.xp,
            "dims": self.dims,
            "current_dim": self.current_dim,
            "protector": self.protector().value,
        }
