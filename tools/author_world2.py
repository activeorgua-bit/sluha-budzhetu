"""Author the world 2 levels (the chestnut campaign) on coordinate canvases.

  python tools/author_world2.py && node tools/validate_levels.mjs

  p21  Mariinsky park   (2-1)  chestnut alley -> fountain plaza -> secret hatch -> boss: animator in a
                                Patron costume in front of the Rada door
  p21b Stalin-era bunker (2-1B, bonus via the hatch) rats in ushankas, 'Kapital' books, boss rat
  p22  Rada corridor    (2-2)  journalists (m/f), opposition MPs, harmless assistants
  p23  Session hall     (2-3)  boss arena: the Speaker; seated MPs on the tiers throw chestnuts

Rows 0-17 (48 px tiles), ground surface on row 14. Solid decor heights are measured from the frames.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "assets_src" / "frames" / "props"
ROWS, GROUND = 18, 14


class Canvas:
    def __init__(self, cols):
        self.cols = cols
        self.m = [["." for _ in range(cols)] for _ in range(ROWS)]
        self.d = [["." for _ in range(cols)] for _ in range(ROWS)]

    def put(self, row, col, s, layer="m"):
        g = self.m if layer == "m" else self.d
        for i, ch in enumerate(s):
            g[row][col + i] = ch

    def dec(self, col, ch, row=13):
        self.put(row, col, ch, "d")

    def fill(self, r0, r1, c0, c1, ch):
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                self.m[r][c] = ch

    def ground(self, c0, c1, ch="#"):
        self.fill(GROUND, ROWS - 1, c0, c1, ch)

    def write(self, name, meta):
        rows_m = ["".join(r) for r in self.m]
        rows_d = ["".join(r) for r in self.d]
        text = json.dumps(meta, indent=2, ensure_ascii=False) + "\n===map\n" + "\n".join(rows_m) + "\n===decor\n" + "\n".join(rows_d) + "\n"
        (ROOT / "src" / "levels" / "ascii" / f"{name}.txt").write_text(text, encoding="utf-8")
        print(f"{name}: {self.cols}x{ROWS}")


def top_of(frame, fallback=1.0):
    """Walkable height of a prop in tiles (opaque height / 48, minus a small lip)."""
    p = FRAMES / f"{frame}.png"
    if not p.exists():
        return fallback
    im = Image.open(p)
    bb = im.getbbox() or (0, 0, im.width, im.height)
    return round((im.height - bb[1]) / 48 - 0.1, 2)


def solid(frame, kind, w, top=None):
    return {"frame": frame, "solid": kind, "w": w, "top": top if top is not None else top_of(frame)}


def far_scroll(cols, layer_w):
    """Scroll rate that moves a non-repeating far layer exactly across its width over the level."""
    return round((layer_w - 960) / max(1, cols * 48 - 960), 3)


# =============================================================================== p21 Mariinsky park
def mariinsky():
    c = Canvas(180)
    c.ground(0, 179)
    c.put(13, 2, "P")
    c.put(13, 5, "1")                        # MARIINSKY PARK. DO NOT PICK THE CHESTNUTS!
    # --- chestnut alley
    c.put(13, 9, "T"); c.put(13, 12, "o"); c.put(13, 14, "o")
    c.dec(16, "A")                           # globe lamp
    c.dec(18, "B")                           # bench (cols 18-20)
    c.put(13, 23, "L")                       # old lady
    c.fill(12, 13, 26, 27, "e")              # hedge
    c.fill(11, 11, 29, 34, "-")              # white balustrade terrace
    c.put(10, 29, "c.o.c.")
    c.put(13, 37, "k")                       # kid
    c.put(13, 41, "T"); c.put(13, 44, "o")
    c.put(9, 46, "=?=")
    # --- fountain plaza
    c.dec(50, "C")                           # flower bed (cols 50-52)
    c.dec(54, "D")                           # stone vase
    c.dec(57, "E")                           # fountain (cols 57-61), rim is standable
    c.put(9, 58, "c.c.c")
    c.put(13, 64, "J")                       # journalist
    c.dec(66, "A")
    c.put(13, 70, "C")                       # cop
    c.put(13, 73, "K")
    c.put(13, 75, "s")
    c.put(13, 77, "d")                       # gated detective
    c.put(13, 81, "T"); c.put(13, 84, "o"); c.put(13, 86, "o")
    c.put(13, 85, "k")
    c.dec(88, "F")                           # ice-cream cart
    c.fill(12, 13, 92, 93, "g")              # granite steps
    c.fill(10, 13, 95, 96, "g")
    c.put(7, 95, "c"); c.put(6, 96, "$")
    # --- secret hatch among the thujas
    c.dec(99, "H")
    c.put(13, 101, "Z")                      # secret hatch -> bunker (bonus)
    c.dec(103, "H")
    c.dec(105, "A")
    c.put(13, 108, "L")
    c.fill(11, 11, 110, 115, "-")
    c.put(10, 110, "o.c.c.")
    c.fill(8, 8, 117, 121, "-")
    c.put(7, 119, "$")
    c.put(13, 117, "L")
    c.put(13, 125, "T"); c.put(13, 128, "o"); c.put(13, 131, "k")
    c.put(13, 134, "j")                      # gated journalist
    c.dec(136, "S")                          # liquor kiosk (cols 136-138): E buys whisky
    c.put(10, 141, "t")
    c.put(13, 144, "K")
    # --- boss plaza in front of the Rada
    c.dec(146, "L")                          # flag
    c.put(13, 149, "o"); c.put(13, 151, "o"); c.put(13, 153, "o")
    c.put(13, 155, "T")
    c.dec(159, "A")
    c.put(13, 163, "X")                      # boss: animator in a Patron costume
    c.put(13, 168, "2")                      # ELECTED MEMBERS ONLY
    c.dec(171, "A")
    c.dec(173, "M")                          # parliament door (cols 173-176)
    c.put(13, 175, "G")
    c.put(7, 118, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "p21", "world": 2, "label": "2-1",
        "material": "park", "material2": "granite", "tileset": "p1", "oneway": "balus_plat", "timeLimit": 240,
        "boss": {"type": "animator"}, "secret": "p21b", "doorChoice": True,
        "narration": [{"col": 7, "key": "p21_tree"}, {"col": 55, "key": "p21_fountain"}, {"col": 98, "key": "p21_hatch"}],
        "parallax": [
            {"key": "p21_sky", "scroll": 0.05, "y": 0},
            # palace at the start, the Rada at the end: the layer crosses exactly once
            # the Rada (right end of the layer) is glued to the world for the last 500 px, so it stays behind its door
            {"key": "p21_far", "scroll": round((1800 - 960 - 500) / (180 * 48 - 960 - 500), 4), "lockLast": 500, "bottomRow": 14, "lift": -150},
            {"key": "p21_mid", "scroll": 0.3, "bottomRow": 14, "lift": 0, "zone": [0, 140]},
        ],
        "signs": [{"sprite": "plaque", "caption": "sign_park"}, {"sprite": "plaque", "caption": "sign_rada"}],
        "decor": {
            "A": "lamp_rada", "C": {"frame": "tulip_bed", "w": 3}, "D": {"frame": "vase_stone", "w": 1},   # C: a side-view raised bed (the top-down one looked flat)
            "F": {"frame": "icecream_cart", "w": 3}, "H": {"frame": "thuja", "w": 1},
            "I": {"frame": "fence_iron", "w": 3}, "L": {"frame": "flagpole", "w": 2},
            "M": {"frame": "rada_door", "w": 4},
            "S": {"frame": "liquor_kiosk", "w": 3, "shop": "whiskey"},
            "B": solid("bench_park", "top", 3, 0.75),
            "E": solid("mfountain", "top", 5, 1.3),
        },
    }
    c.write("p21_mariinsky", meta)


# =============================================================================== p21b bunker (bonus)
def bunker():
    c = Canvas(120)
    c.ground(0, 119)
    c.put(13, 2, "P")
    c.put(13, 5, "1")                        # SHELTER No.1 (1953)
    c.dec(8, "A")                            # blast door (cols 8-10)
    c.dec(13, "B", 10)                       # red banner on the wall
    c.put(13, 15, "r")
    c.dec(18, "C")                           # vintage desk (cols 18-20), standable
    c.put(12, 19, "b")                       # 'Kapital' on the desk
    c.dec(22, "D")                           # phone table
    c.put(13, 26, "r")
    c.dec(28, "E")                           # bookshelf (cols 28-30), standable
    c.put(8, 29, "b")
    c.dec(33, "F", 10)                       # propaganda poster
    c.fill(11, 11, 35, 41, "-")              # catwalk
    c.put(10, 36, "c.b.c")
    c.put(13, 38, "r")
    c.dec(44, "G")                           # Lenin bust
    c.dec(47, "H", 10)                       # shelf of golden Lenins
    c.dec(51, "I")                           # radio
    c.put(13, 53, "r")
    c.dec(56, "J")                           # crate with a red star (cols 56-57)
    c.dec(58, "J")
    c.put(11, 57, "$")                       # party gold on the crates
    c.put(13, 62, "K")
    c.put(13, 64, "o"); c.put(13, 65, "b")
    c.put(13, 60, "u")                       # vodka, vintage 1953
    c.put(10, 84, "u")                       # vodka on the bunk bed
    # flooded passage under a catwalk: 5 tiles, so the coin-free jump is not at the very limit
    c.fill(GROUND, ROWS - 1, 70, 74, ".")
    c.fill(GROUND + 1, ROWS - 1, 70, 74, "~")
    c.fill(11, 11, 68, 77, "-")
    c.put(10, 70, "c.c.c")
    c.put(13, 80, "r")
    c.dec(82, "L")                           # bunk bed (cols 82-84), standable
    c.dec(86, "M", 10)                       # gas mask on a hook
    c.dec(88, "N")                           # phones on a table
    c.dec(91, "O")                           # book stack
    c.put(13, 93, "b"); c.put(13, 95, "o")
    c.dec(97, "P")                           # CRT TV
    c.put(13, 99, "K")
    c.put(13, 106, "X")                      # boss: the balalaika rat
    c.dec(110, "B", 10)
    c.dec(113, "A")                          # blast door exit (cols 113-115)
    c.put(13, 116, "G")
    c.put(10, 82, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "p21b", "world": 2, "label": "2-1B",
        "material": "bunker", "tileset": "p1", "oneway": "catwalk_plat", "timeLimit": 200, "bgColor": "#1b1f1a",
        "boss": {"type": "ratboss"},
        "narration": [{"col": 42, "key": "p21b_lenin"}, {"col": 58, "key": "p21b_vodka"}, {"col": 87, "key": "p21b_phones"}],
        "parallax": [{"key": "p21b_wall", "scroll": 0.35, "y": 0}],
        "backfill": [{"tile": "bunker_c", "from": 0, "to": 120, "row": 14, "tint": "#50504a"}],
        "signs": [{"sprite": "plaque", "caption": "sign_bunker"}],
        "decor": {
            "A": {"frame": "blast_door", "w": 3}, "B": {"frame": "banner_red", "w": 2}, "D": "phone_table",
            "F": {"frame": "poster_soviet", "w": 2}, "G": {"frame": "lenin_bust", "w": 2},
            "H": {"frame": "lenin_shelf", "w": 3}, "I": {"frame": "radio_old", "w": 2},
            "M": "gas_mask", "N": {"frame": "phones_table", "w": 2}, "O": "book_stack", "P": {"frame": "crt_tv", "w": 2},
            "C": solid("desk_vintage", "top", 3),
            "E": solid("bookshelf", "top", 3),
            "J": solid("crate_star", "full", 2),
            "L": solid("bunk_bed", "top", 3),
        },
    }
    c.write("p21b_bunker", meta)


# =============================================================================== p22 Rada corridor
def corridor():
    c = Canvas(160)
    c.ground(0, 159)
    c.ground(62, 92, "@")                    # blue carpet hall
    c.put(13, 2, "P")
    c.put(13, 6, "1")                        # QUIET! VOTING IN PROGRESS
    for col in (10, 34, 58, 82, 106, 130, 152):
        c.dec(col, "A")                      # marble columns (decor, behind)
    # no separate curtained windows: the painted wall has its own (the sprites floated over its doors)
    for col in (16, 46, 94, 140):
        c.dec(col, "H", 8)                   # chandeliers
    c.put(13, 14, "J")
    c.dec(18, "B")                           # palm
    c.put(13, 19, "o")
    c.put(13, 26, "A")                       # assistant
    c.put(9, 28, "?=?")
    c.dec(31, "C")                           # velvet bench (cols 31-33), standable
    c.put(13, 38, "O")                       # opposition MP
    c.fill(11, 11, 42, 49, "-")              # balustrade mezzanine
    c.put(10, 43, "c.c.o.c")
    c.dec(51, "D")                           # water cooler
    c.put(13, 54, "F")                       # female journalist
    c.dec(56, "E")                           # wooden door
    c.put(13, 60, "K")
    c.dec(64, "G")                           # exhibition of children's drawings
    c.put(13, 66, "C")                       # security officer
    c.put(13, 72, "A")
    c.dec(76, "I")                           # press wall
    c.put(13, 79, "b")
    c.put(13, 84, "O")
    c.dec(88, "J")                           # flag
    c.put(13, 90, "o")
    c.put(13, 96, "j")
    c.fill(11, 11, 99, 108, "-")
    c.fill(8, 8, 102, 106, "-")
    c.put(10, 99, "c.c.c")
    c.put(7, 104, "$")
    c.put(13, 102, "s")
    c.put(13, 104, "d")
    c.dec(109, "B")
    c.put(13, 110, "o")
    c.put(13, 112, "F")
    c.dec(115, "O")                          # empty office: desk (cols 115-117)
    c.dec(118, "Q")                          # minibar
    c.put(12, 116, "y")                      # whisky on the desk
    c.put(13, 118, "y")                      # whisky in the minibar
    c.put(13, 120, "K")
    c.dec(122, "C")
    c.put(13, 126, "A")
    c.put(10, 129, "t")
    c.dec(132, "E")
    c.put(13, 137, "O")
    c.put(13, 143, "J")
    c.put(13, 146, "o")
    c.put(13, 150, "2")
    c.dec(154, "E")                          # door to the session hall
    c.put(13, 156, "G")
    c.put(7, 103, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "p22", "world": 2, "label": "2-2",
        "material": "parquet", "material2": "carpet", "tileset": "r1", "oneway": "balus_plat", "timeLimit": 220,
        "bgColor": "#d9c9a3",
        "narration": [{"col": 36, "key": "p22_oppmp"}, {"col": 75, "key": "p22_press"}, {"col": 114, "key": "p22_office"}],
        "parallax": [{"key": "p22_wall", "scroll": 0.35, "y": 0}],
        "signs": [{"sprite": "plaque", "caption": "sign_corridor"}, {"sprite": "plaque", "caption": "sign_hall"}],
        "decor": {
            "A": {"frame": "column_marble", "w": 2}, "H": {"frame": "chandelier", "w": 3},
            "B": {"frame": "palm_pot", "w": 2}, "D": "water_cooler", "E": {"frame": "door_wood", "w": 3},
            "G": {"frame": "exhibit_stand", "w": 4}, "I": {"frame": "press_wall", "w": 4}, "J": "flag_stand",
            "C": solid("velvet_bench", "top", 3, 0.8),
            "O": {"frame": "office_desk", "w": 3}, "Q": "minibar",
        },
    }
    c.write("p22_corridor", meta)


# =============================================================================== p23 session hall (boss)
def hall():
    c = Canvas(64)
    c.ground(0, 63)
    # seat-row tiers on both sides (MPs watch and throw chestnuts from them)
    c.fill(10, 13, 0, 3, "@"); c.fill(11, 13, 4, 6, "@"); c.fill(12, 13, 7, 9, "@")
    c.fill(12, 13, 54, 56, "@"); c.fill(11, 13, 57, 59, "@"); c.fill(10, 13, 60, 63, "@")
    for col, row in ((1, 9), (3, 9), (5, 10), (8, 11), (55, 11), (58, 10), (61, 9), (63, 9)):
        c.put(row, col, "M")
    c.put(13, 12, "P")
    c.dec(26, "J"); c.dec(38, "J")           # flags
    c.dec(29, "D")                           # presidium desk (behind)
    c.dec(31, "R")                           # rostrum
    c.dec(31, "T", 10)                       # trident panel on the wall
    c.fill(11, 11, 16, 21, "-")              # balcony ledges above the shockwaves
    c.fill(11, 11, 42, 47, "-")
    c.put(10, 17, "o.o.b")
    c.put(10, 43, "b.o.o")
    for col in (14, 15, 23, 40, 48, 49):
        c.put(13, col, "o")
    c.put(13, 34, "X")                       # THE SPEAKER
    c.dec(51, "E")                           # exit door (cols 51-53)
    c.put(13, 52, "G")
    c.put(10, 20, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "p23", "world": 2, "label": "2-3",
        "material": "parquet", "material2": "seats", "tileset": "r1", "oneway": "balus_plat", "timeLimit": 240,
        "bgColor": "#e6dcc0",
        "boss": {"type": "speaker"},
        "detectivePressure": 1.35,   # a corrupt run faces the Speaker and NABU at once: fewer detectives here
        "parallax": [{"key": "p23_wall", "scroll": 0.15, "y": -40}],
        "signs": [],
        "decor": {
            "J": "flag_stand", "D": {"frame": "presidium_desk", "w": 6}, "R": {"frame": "rostrum", "w": 3},
            "T": {"frame": "trident_panel", "w": 3}, "E": {"frame": "door_wood", "w": 3},
        },
    }
    c.write("p23_hall", meta)


if __name__ == "__main__":
    mariinsky()
    bunker()
    corridor()
    hall()
