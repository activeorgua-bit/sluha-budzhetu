"""Author level 1-1 (Kyiv street + Shevchenko University park) on a coordinate canvas.

  python tools/author_level1.py && node tools/validate_levels.mjs l11

Rows 0-17 (48 px tiles), ground surface on row 14. Columns 0-87 street ('#' = steel slabs over brick),
88-179 park ('@' = pavers over soil). Decor letters are resolved by the "decor" table below; entries
with "solid" become colliders (full blocks or one-way tops) and are understood by the validator.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COLS, ROWS, GROUND = 180, 18, 14
PARK = 88

m = [["." for _ in range(COLS)] for _ in range(ROWS)]
d = [["." for _ in range(COLS)] for _ in range(ROWS)]


def put(grid, row, col, s):
    for i, ch in enumerate(s):
        grid[row][col + i] = ch


def fill(grid, r0, r1, c0, c1, ch):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            grid[r][c] = ch


# ground
fill(m, GROUND, ROWS - 1, 0, PARK - 1, "#")
fill(m, GROUND, ROWS - 1, PARK, COLS - 1, "@")

# ------------------------------------------------------------------ street
put(m, 13, 2, "P")
put(m, 13, 5, "1")                       # REFORM IS TEMPORARY billboard
put(d, 13, 8, "A"); put(d, 13, 10, "B")  # street lamp, hydrant
put(d, 13, 13, "D")                      # short green pipe (cols 13-14)
put(m, 9, 13, "cc")
put(m, 10, 18, "=?=?=")                  # brick / question blocks
put(m, 7, 19, "c.c")
put(d, 13, 25, "C")                      # green trash bin (solid)
put(m, 13, 29, "J")                      # journalist
put(d, 13, 32, "F")                      # bus stop, standable roof (cols 32-35)
put(m, 8, 33, "cc")
put(d, 13, 38, "G")                      # kiosk, standable roof (cols 38-40)
put(d, 13, 41, "R")                      # cone + barrier before the trench
fill(m, GROUND, GROUND, 42, 47, "^")     # road-works trench
put(m, 11, 44, "--")                     # steel slab ledge over it
put(d, 13, 50, "E")                      # tall pipe (cols 50-51)
put(m, 13, 55, "C")                      # patrol officer
put(d, 13, 57, "L")                      # campaign billboard, standable top (cols 57-60)
put(m, 8, 59, "t")                       # marked bill on the billboard
put(d, 13, 61, "A")
# flooded pit: the two balconies are the way across
fill(m, GROUND, GROUND, 63, 70, ".")                 # the iron balcony (68-70) ends right above the bank
fill(m, GROUND + 1, ROWS - 1, 63, 70, "~")
# no moving platform here: the two balconies are the way across the water
put(d, 12, 63, "H")                      # stone balcony (cols 63-66): walk along the top of the balustrade
put(d, 11, 68, "I")                      # iron balcony (cols 68-70)
put(m, 8, 65, "c"); put(m, 7, 69, "c")
put(m, 13, 75, "K")                      # checkpoint
put(m, 13, 78, "s")                      # manhole (sting point)
put(m, 13, 80, "j")                      # gated journalist
put(d, 13, 77, "A")
fill(m, 12, 13, 84, 85, "g")             # granite gate posts
put(d, 13, 82, "U")                      # campaign poster
# ------------------------------------------------------------------ Shevchenko park
put(d, 13, 89, "K")                      # tulip bed (cols 89-91)
put(d, 13, 92, "M")                      # globe lamp
put(d, 13, 94, "J")                      # bench (cols 94-96)
put(d, 13, 98, "N")                      # bush
fill(m, 12, 13, 101, 102, "e")           # hedge
put(m, 9, 100, "c..c")
put(d, 13, 104, "Q")                     # chess table step (cols 104-105)
put(d, 13, 107, "O")                     # Shevchenko monument (cols 107-111): steps + pedestal at col 109
put(m, 6, 109, "$")
put(d, 13, 113, "P")                     # fountain (cols 113-115)
put(d, 13, 117, "S"); put(d, 13, 119, "S")
put(m, 13, 122, "s")
put(m, 13, 124, "d")                     # gated detective
put(d, 13, 121, "M")
fill(m, GROUND, GROUND, 128, 131, ".")    # pond
fill(m, GROUND + 1, ROWS - 1, 128, 131, "~")
put(d, 13, 124, "K")                     # tulip bed (cols 124-126), clear of the pond at 128
put(d, 13, 133, "J")                     # bench (cols 133-135)
fill(m, 12, 13, 138, 139, "g")           # granite steps
fill(m, 10, 13, 141, 142, "g")
put(m, 7, 141, "cc")
put(m, 6, 142, "$")
put(d, 13, 144, "M")
put(m, 13, 150, "K")
put(d, 13, 153, "C")
put(d, 13, 155, "N")
put(d, 13, 158, "E")                     # tall pipe (cols 158-159)
put(m, 9, 162, "?=?")
put(m, 6, 163, "c")
put(d, 13, 166, "K")
put(m, 13, 170, "2")                     # FACTS HURT
put(d, 13, 172, "U")
put(d, 13, 174, "M")
put(m, 13, 176, "G")

# The developer's office (inner voice: the hotel in the nature reserve) with a money bag on its roof,
# right where the patrol officer walks. The kiosk sells "something for the mood" (whisky).
put(d, 13, 52, "V")                      # developer office (cols 52-55), roof is standable
put(m, 9, 54, "$")

# Chestnuts (the honest weapon): shake the street's chestnut trees (E); in the park they lie on the ground
put(m, 13, 20, "T")                      # chestnut tree between the pipe and the bin
put(m, 13, 85, "T")                      # chestnut tree at the end of the street
for col in (93, 100, 118, 132, 147, 161):
    put(m, 13, col, "o")

put(m, 9, 109, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
put(d, 13, 86, "D")                      # short pipe in the park (cols 86-87)
put(d, 13, 120, "D")                     # short pipe by the tulips (cols 120-121)

meta = {
    "id": "l11", "world": 1, "label": "1-1",
    "material": "street", "material2": "park", "tileset": "k1", "oneway": "slab_plat", "timeLimit": 220,
    # green pipes: two random ones (never the last) lead down into the metro (m11)
    "subway": "m11", "subwayOpen": 2,
    # living sky (src/entities/world/Sky.js): soft gradient like the bridge mockup + drifting clouds
    "sky": {"top": "#4c9ad6", "bottom": "#a8d4ec", "clouds": 9, "horizon": 0.6},
    "parallax": [
        {"key": "l11_sky", "scroll": 0.05, "y": 0},
        {"key": "l11_far", "scroll": 0.15, "bottomRow": 14, "lift": 60, "zone": [0, 90]},
        {"key": "l11_street", "scroll": 0.4, "bottomRow": 14, "lift": 0, "zone": [0, 90]},
        {"key": "l11_parkfar", "scroll": 0.15, "bottomRow": 14, "lift": 40, "zone": [90, 999]},
        {"key": "l11_park", "scroll": 0.4, "bottomRow": 14, "lift": 0, "zone": [90, 999]},
    ],
    "backfill": [
        {"tile": "street_c3", "from": 0, "to": 88, "row": 14, "tint": "#62627a"},
        {"tile": "park_c3", "from": 88, "to": 180, "row": 14, "tint": "#6e5a50"},
    ],
    "narration": [
        {"col": 17, "key": "l11_tree"}, {"col": 36, "key": "l11_kiosk"}, {"col": 42, "key": "l11_trench"},
        {"col": 47, "key": "l11_cop", "if": "bag_here"}, {"col": 54, "key": "l11_office_bag", "on": "bag"},
        {"col": 57, "key": "l11_billboard"}, {"col": 89, "key": "l11_park"}, {"col": 104, "key": "l11_monument"},
    ],
    "signs": [{"sprite": "plaque", "caption": "sign_reform"}, {"sprite": "lamp_leaflet", "caption": "sign_facts", "paper": [40, 123, 22, 27]}],
    "decor": {
        "A": "lamp_street", "B": "hydrant", "R": "cone_barrier", "U": "campaign_poster",
        "K": {"frame": "tulip_bed", "w": 3}, "M": "lamp_park", "N": "bush", "S": "pigeon",
        "P": {"frame": "fountain", "w": 3},
        "C": {"frame": "trash_bin", "solid": "full", "w": 1, "top": 1.5},
        "D": {"frame": "pipe_short", "solid": "full", "w": 2, "top": 2},
        "E": {"frame": "pipe_tall", "solid": "full", "w": 2, "top": 3},
        "F": {"frame": "bus_stop", "solid": "top", "w": 4, "top": 3},
        "G": {"frame": "kiosk", "solid": "top", "w": 3, "top": 3, "shop": "whiskey"},
        "V": {"frame": "dev_office", "solid": "top", "w": 4, "top": 3.9},
        "L": {"frame": "billboard_campaign", "solid": "top", "w": 4, "top": 3},
        "H": {"frame": "balcony_stone", "solid": "top", "w": 4, "top": 2.0},    # the balustrade top is the ledge
        "I": {"frame": "balcony_iron", "solid": "top", "w": 3, "top": 1.75},
        "J": {"frame": "bench", "solid": "top", "w": 3, "top": 0.75},
        "Q": {"frame": "chess_table", "solid": "top", "w": 2, "top": 1},
        "O": {"frame": "monument_shevchenko", "w": 5, "solids": [
            {"dx": 1, "w": 3, "top": 0.8, "solid": "top"}, {"dx": 2, "w": 1, "top": 3.75, "solid": "full"}]},
    },
}

rows_m = ["".join(r) for r in m]
rows_d = ["".join(r) for r in d]
text = json.dumps(meta, indent=2, ensure_ascii=False) + "\n===map\n" + "\n".join(rows_m) + "\n===decor\n" + "\n".join(rows_d) + "\n"
(ROOT / "src" / "levels" / "ascii" / "l11_street.txt").write_text(text, encoding="utf-8")
print(f"l11_street: {COLS}x{ROWS}")
