"""spherepop_sandbox.test_character — the honest-auth soul, tested.

The character is born from the prompt, levels unlock ±1 dimension, and
each dimension carries a protector. Run: uv run --script test_character.py
"""

from __future__ import annotations

import unittest

from character import Character, Deity, Virtue


class CharacterTests(unittest.TestCase):
    def test_virtue_read(self) -> None:
        self.assertEqual(Character.from_prompt("I am honest about everything").virtue, Virtue.TRUTH)
        self.assertEqual(Character.from_prompt("I love and I care").virtue, Virtue.COMPASSION)
        self.assertEqual(Character.from_prompt("I am calm and at peace").virtue, Virtue.PEACE)
        self.assertEqual(Character.from_prompt("a strange soul").virtue, Virtue.PRESENCE)

    def test_deterministic_birth(self) -> None:
        a = Character.from_prompt("the keeper of the 108 gates")
        b = Character.from_prompt("the keeper of the 108 gates")
        self.assertEqual(a.state(), b.state())

    def test_leveling_unlocks_plus_minus_one(self) -> None:
        c = Character.from_prompt("I am honest about everything")
        self.assertEqual(c.dims, [3])
        c.add_xp(3)  # level 2
        self.assertIn(4, c.dims)
        self.assertIn(2, c.dims)
        c.add_xp(4)  # level 3
        self.assertIn(5, c.dims)
        self.assertIn(1, c.dims)

    def test_lower_dimension_caps_at_one(self) -> None:
        c = Character.from_prompt("I am honest about everything")
        for _ in range(6):
            c.add_xp(20)
        self.assertGreaterEqual(min(c.dims), 1)

    def test_mahakala_guards_the_third(self) -> None:
        c = Character.from_prompt("I am honest about everything")
        self.assertEqual(c.protector(), Deity.MAHAKALA)

    def test_protector_changes_with_dimension(self) -> None:
        c = Character.from_prompt("I am honest about everything")
        p3 = c.protector()
        c.add_xp(3)  # dim 4 unlocked, current becomes 4
        p4 = c.protector()
        self.assertNotEqual(p3, p4)


if __name__ == "__main__":
    unittest.main(verbosity=2)
