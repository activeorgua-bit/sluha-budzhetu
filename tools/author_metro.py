"""Author the Kyiv metro sub-level (m11) reached through the green pipes of 1-1.

  python tools/author_metro.py && node tools/validate_levels.mjs

  vestibule (upper floor): the arrival pipe, the ticket office, turnstiles to jump, the escalator attendant
  escalator down to the platform hall: Zoloti Vorota: full-height pillars with mosaics, ring chandeliers (take the coins or
  not), passengers, the duty officer, the one metro policeman, a train passing behind the platform
  exit: a green pipe back up to the street (1-1 continues at the next pipe)

Rows 0-17 (48 px tiles). The vestibule floor surface is row 11, the platform row 14.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from author_world2 import Canvas, ROWS, GROUND, solid  # noqa: E402

UPPER = 11          # vestibule floor surface row


def metro():
    c = Canvas(110)
    # vestibule: a raised granite floor (cols 0-29); platform hall below (cols 30-109, yellow edge line)
    c.fill(UPPER, ROWS - 1, 0, 29, "#")
    c.fill(GROUND, ROWS - 1, 30, 109, "@")
    c.put(UPPER - 1, 3, "P")
    c.dec(1, "Q", UPPER - 1)                     # the pipe he came down (decor)
    c.dec(5, "S", UPPER - 1)                     # the red M
    c.dec(7, "T", UPPER - 1)                     # ticket office (cols 7-8)
    c.put(UPPER - 1, 10, "p")
    c.dec(13, "U", UPPER - 1); c.dec(14, "U", UPPER - 1); c.dec(15, "U", UPPER - 1)   # turnstiles: jump them
    c.put(UPPER - 6, 14, "c")                    # a coin high above the turnstiles
    c.dec(18, "V", UPPER - 1)                    # metro map
    c.put(UPPER - 1, 21, "f")                    # escalator attendant
    c.put(UPPER - 1, 25, "p")
    # escalator down (decor) with a few grating steps for a softer way down
    c.dec(28, "E", GROUND - 1)                   # escalator (7 tiles wide)
    # platform hall
    # the Zoloti Vorota arcade: pillar-centred bays (6 cols) whose round arches meet; 8 different mosaics
    bays = "DFGIJLPR"                            # zv_bay_1 .. zv_bay_8
    order = [4, 0, 6, 2, 5, 1, 7, 3, 0, 5, 2, 6]  # mixed, never the same panel twice in a row
    c.dec(36, "W", GROUND - 1)                   # the first pier: the arcade starts at a wall, not a cut arch
    for k, col in enumerate(range(42, 110, 6)):  # the last bay runs past the level's right edge
        c.dec(col, bays[order[k % len(order)]], GROUND - 1)
    for col in range(47, 104, 12):
        c.dec(col, "H", 10)                      # a ring chandelier in every other arch
    c.put(GROUND - 1, 43, "p")
    c.dec(46, "B", GROUND - 1)                   # bench (cols 46-48), standable
    c.put(GROUND - 1, 50, "p")
    c.dec(55, "K", GROUND - 1)                   # flower kiosk (cols 55-57; not on a pillar cell)
    c.put(GROUND - 1, 58, "l")                   # ...and the flower seller (a choice: rob her or not)
    c.put(GROUND - 1, 60, "a")                   # duty officer with the signal disc
    c.put(GROUND - 1, 61, "K")                   # checkpoint
    c.dec(64, "A", GROUND - 1)                   # the busker's open accordion case
    c.put(GROUND - 1, 66, "z")                   # the busker (a choice: rob him or not)
    c.put(11, 72, "c.c.c")                       # coins within a jump from the platform
    c.put(GROUND - 1, 70, "p")
    c.dec(79, "B", GROUND - 1)                   # second bench
    c.put(GROUND - 1, 82, "p")
    c.put(GROUND - 1, 86, "q")                   # the one metro policeman
    c.dec(89, "O", GROUND - 1)                   # his booth
    c.put(10, 91, "?")
    c.dec(94, "M", GROUND - 1)                   # vending machine
    c.put(GROUND - 1, 96, "p")
    c.dec(98, "N", GROUND - 1)                   # newspaper stand
    c.put(GROUND - 1, 99, "p")
    # exit: the pipe back up to the street
    c.dec(104, "Q", GROUND - 1)
    c.put(GROUND - 1, 107, "G")
    meta = {
        "id": "m11", "world": 1, "label": "1-1M",
        "material": "metro", "material2": "platf", "tileset": "m1", "oneway": "grate_plat", "timeLimit": 120,
        "bgColor": "#1b1712",
        "subwayExit": True, "viewBottomRow": 15.875,   # the floor clears the narration page
        "train": {"frame": "metro_train", "everySec": 10, "speed": 300,
                  "far": {"layer": "m11_far", "bottomY": 606, "scale": 1}},   # along the far wall, full size
        "narration": [{"col": 11, "key": "m11_turnstile"}, {"col": 84, "key": "m11_cop"}, {"col": 32, "key": "m11_hall"}],
        "parallax": [{"key": "m11_far", "scroll": 0.3, "bottomRow": 14, "lift": 0},
                     {"key": "m11_farcols", "scroll": 0.3, "bottomRow": 14, "lift": 0, "depth": -19}],   # far pillars over the train
        "decor": {
            "Q": {"frame": "pipe_tall", "w": 2}, "S": "metro_sign", "T": {"frame": "ticket_booth", "w": 2},
            "V": {"frame": "metro_map", "w": 2}, "E": {"frame": "escalator", "w": 7}, "C": {"frame": "kyiv_pillar", "w": 6},
            **{ch: {"frame": f"zv_bay_{i + 1}", "w": 6} for i, ch in enumerate("DFGIJLPR")},
            "W": {"frame": "zv_bay_end", "w": 6},
            "H": {"frame": "zv_chandelier", "w": 2}, "K": {"frame": "flower_kiosk", "w": 3},
            "A": {"frame": "accordion_case", "w": 2}, "O": {"frame": "police_booth", "w": 2},
            "M": {"frame": "vending", "w": 2}, "N": "news_stand",
            "U": solid("turnstile", "full", 1),
            "B": solid("metro_bench", "top", 3),
        },
    }
    c.write("m11_metro", meta)


if __name__ == "__main__":
    metro()
