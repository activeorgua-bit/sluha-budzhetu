"""Author level 1-2 (Dnipro bridge construction site) on a coordinate canvas, following the user's
bridge mockup (assets_src/reference/mockup_level_1-3_bridge.png): dark stone piers with riveted steel
tops, orange sandstone piers, truss bridges on rusty X-braced towers standing in the water, a crane
hook with a hazard block, a scaffold platform hanging on cables, crates, pipes, a TV camera.

  python tools/author_level12.py && node tools/validate_levels.mjs l12

Rows 0-17 (48 px tiles), ground surface on row 14. '#' = dark pier, '@' = sandstone pier.
Solid decor heights are measured from the packed prop frames, so colliders match the art.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "assets_src" / "frames" / "props"
COLS, ROWS, GROUND = 150, 18, 14

m = [["." for _ in range(COLS)] for _ in range(ROWS)]
d = [["." for _ in range(COLS)] for _ in range(ROWS)]


def put(grid, row, col, s):
    for i, ch in enumerate(s):
        grid[row][col + i] = ch


def fill(grid, r0, r1, c0, c1, ch):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1):
            grid[r][c] = ch


def pier(c0, c1, ch):
    fill(m, GROUND, ROWS - 1, c0, c1, ch)


def river(c0, c1, bridge=True, spikes=(), towers=()):
    """Water from row 15 down; optional bridge deck on row 14, spikes on the surface row, and
    2-wide X-braced truss towers standing in the water under the deck."""
    if bridge:
        fill(m, GROUND, GROUND, c0, c1, "B")
    fill(m, GROUND + 1, ROWS - 1, c0, c1, "~")
    for s0, s1 in spikes:
        fill(m, GROUND + 1, GROUND + 1, s0, s1, "^")
    for t in towers:
        fill(m, GROUND + 1, ROWS - 1, t, t + 1, "%")


def solid(frame, kind, w, top=None):
    """Decor collider whose height comes from the art: top = opaque height / 48 (minus a lip)."""
    if top is None:
        p = FRAMES / f"{frame}.png"
        if p.exists():
            im = Image.open(p)
            bbox = im.getbbox() or (0, 0, im.width, im.height)
            top = round((im.height - bbox[1]) / 48 - 0.1, 2)
        else:
            top = 1
    return {"frame": frame, "solid": kind, "w": w, "top": top}


# ---------------------------------------------------------------- start pier (dark stone)
pier(0, 17, "#")
put(m, 13, 2, "P")
put(m, 13, 5, "1")                        # BRIDGES ARE FOR SOME PEOPLE.
put(d, 13, 8, "A")                        # road-works sign
put(d, 13, 9, "C")                        # cone
put(d, 13, 10, "F")                       # concrete pipe stack (cols 10-12), standable
put(m, 9, 11, "c")
put(d, 13, 14, "D")                       # green pipe (cols 14-15)
put(m, 10, 3, "==?=[")                    # brick row with a ? block, like the mockup

# ---------------------------------------------------------------- bridge 1 + crane hook
river(18, 31, spikes=[(21, 23)], towers=[26])
put(m, 11, 20, "c.c.c")
put(m, 7, 25, "H")                        # hook (192 px tall) with a hazard block, drops onto the deck
for r in range(8, 11):
    put(m, r, 25, ",")

# ---------------------------------------------------------------- pier 2 (dark stone)
pier(32, 47, "#")
put(d, 13, 34, "B")                       # barrel
put(d, 13, 36, "G")                       # crate stack (cols 36-38), standable
put(m, 8, 37, "$")                        # money bag above the crates
put(m, 10, 42, "?=?")
put(m, 13, 41, "J")                       # journalist
put(d, 13, 45, "O")                       # trash bin

# ---------------------------------------------------------------- open water, scaffold on cables
river(48, 63, bridge=False, spikes=[(51, 55), (58, 60)])
put(m, 11, 49, "m.........*")             # hanging scaffold platform (horizontal mover)
put(m, 8, 52, "c.c.c")

# ---------------------------------------------------------------- pier 3 (sandstone), checkpoint
pier(64, 79, "@")
put(m, 13, 65, "K")
put(d, 13, 67, "H")                       # site cabin (cols 67-70), roof is standable
put(m, 9, 68, "cc")
put(m, 13, 73, "s")
put(m, 13, 75, "d")                       # gated detective
put(d, 13, 77, "I")                       # TV camera

# ---------------------------------------------------------------- long bridge, two towers, hook
river(80, 97, spikes=[(81, 83), (88, 90), (95, 96)], towers=[85, 92])
put(m, 10, 83, "c.c.t.c.c")               # coin arc with one marked bill
put(m, 5, 89, "H")
for r in range(6, 11):
    put(m, r, 89, ",")

# ---------------------------------------------------------------- pier 4 (dark stone), pipes
pier(98, 113, "#")
put(d, 13, 99, "E")                       # tall green pipe (cols 99-100)
put(m, 9, 103, "=?==")
put(m, 7, 104, "c")
put(d, 13, 104, "J")                      # concrete barrier (cols 104-106), standable
put(m, 13, 108, "j")                      # gated journalist
put(d, 13, 109, "N")                      # campaign billboard (cols 109-112), roof is standable
put(m, 10, 111, "t")                      # marked bill on the billboard

# ---------------------------------------------------------------- last bridge
river(114, 127, spikes=[(116, 118), (123, 125)], towers=[120])
put(m, 11, 117, "c...c")

# ---------------------------------------------------------------- final sandstone pier
pier(128, 149, "@")
put(d, 13, 128, "K")                      # fisherman at the pier edge
put(m, 13, 130, "K")                      # checkpoint
put(d, 13, 132, "L")                      # rebar bundle
put(m, 13, 135, "s")
put(m, 13, 137, "d")
put(d, 13, 138, "G")                      # crate stack (cols 138-140)
put(m, 8, 139, "c")
put(d, 13, 142, "I")                      # TV camera at the finish
put(m, 13, 144, "2")                      # FACTS HURT.
put(m, 13, 146, "G")

meta = {
    "id": "l12", "world": 1, "label": "1-2",
    "material": "pier", "material2": "sand", "tileset": "b1", "oneway": "truss_plat", "timeLimit": 200,
    "parallax": [
        # sky screen-fixed; skyline bottom hidden behind the river's shore (statue just under the HUD);
        # river water starts just above the pier tops and runs below the map (open under the bridges)
        {"key": "l12_sky", "scroll": 0.05, "y": 0},
        {"key": "l12_far", "scroll": 0.1, "bottomRow": 16, "lift": -45},
        {"key": "l12_mid", "scroll": 0.3, "bottomRow": 19, "lift": -18},
    ],
    "narration": [
        {"col": 21, "key": "l12_hook"}, {"col": 48, "key": "l12_scaffold"}, {"col": 66, "key": "l12_cabin"},
        {"col": 76, "key": "l12_camera"}, {"col": 126, "key": "l12_fisherman"},
    ],
    "signs": [{"sprite": "plaque", "caption": "sign_bridges"}, {"sprite": "plaque", "caption": "sign_facts"}],
    "decor": {
        "A": "caution_sign", "B": "barrel", "C": "traffic_cone", "I": "tv_camera",
        "K": "fisherman", "L": {"frame": "rebar_bundle", "w": 3},
        "D": {"frame": "pipe_short", "solid": "full", "w": 2, "top": 2},
        "E": {"frame": "pipe_tall", "solid": "full", "w": 2, "top": 3},
        "F": solid("pipe_stack", "top", 3),
        "G": solid("crate_stack", "full", 3),
        "H": solid("site_cabin", "top", 4),
        "J": solid("jersey_barrier", "full", 3),
        "N": {"frame": "billboard_campaign", "solid": "top", "w": 4, "top": 3},
        "O": {"frame": "trash_bin", "solid": "full", "w": 1, "top": 1.5},
    },
}

rows_m = ["".join(r) for r in m]
rows_d = ["".join(r) for r in d]
text = json.dumps(meta, indent=2, ensure_ascii=False) + "\n===map\n" + "\n".join(rows_m) + "\n===decor\n" + "\n".join(rows_d) + "\n"
(ROOT / "src" / "levels" / "ascii" / "l12_bridge.txt").write_text(text, encoding="utf-8")
print(f"l12_bridge: {COLS}x{ROWS}")
