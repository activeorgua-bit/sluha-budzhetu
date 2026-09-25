"""Authoring aid: writes the six ASCII levels from fixed-width chunks so rows never misalign.

  python tools/author_levels.py          # (re)writes src/levels/ascii/*.txt
  node tools/validate_levels.mjs         # then validate

Edit the chunk tables below (or edit the .txt files directly — they are the source of truth for
the game; this script only helps to author them consistently). Legend: src/levels/legend.js.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "levels" / "ascii"
ROWS = 18
GROUND_TOP = 14


def chunk(width, rows=None, ground="#", floor=True, pit_char="~", pit_top=None):
    """Return 18 strings of `width`. rows: {row_index: string}. floor=False -> pit (rows 14..17)."""
    rows = rows or {}
    out = []
    for y in range(ROWS):
        if y in rows:
            s = rows[y]
            assert len(s) == width, f"row {y}: {s!r} has {len(s)} chars, expected {width}"
            out.append(s)
        elif y >= GROUND_TOP:
            if floor:
                out.append(ground * width)
            elif y == GROUND_TOP:
                out.append((pit_top or ".") * width)
            elif y == GROUND_TOP + 1 and pit_top is None and pit_char == "~":
                out.append("~" * width)
            else:
                out.append(pit_char * width)
        else:
            out.append("." * width)
    return out


def join(chunks):
    rows = ["" for _ in range(ROWS)]
    for c in chunks:
        for y in range(ROWS):
            rows[y] += c[y]
    return rows


def write_level(name, meta, map_chunks, decor_chunks=None):
    rows = join(map_chunks)
    cols = len(rows[0])
    assert all(len(r) == cols for r in rows), "map rows differ in length"
    decor = join(decor_chunks) if decor_chunks else ["." * cols for _ in range(ROWS)]
    text = json.dumps(meta, indent=2, ensure_ascii=False) + "\n===map\n" + "\n".join(rows) + "\n===decor\n" + "\n".join(decor) + "\n"
    (OUT / f"{name}.txt").write_text(text, encoding="utf-8")
    print(f"{name}: {cols}x{ROWS}")


def blank_decor(width, rows=None):
    rows = rows or {}
    return ["." * width if y not in rows else rows[y] for y in range(ROWS)]


# =============================================================================== 1-1 street
def l11():
    meta = {
        "id": "l11", "world": 1, "label": "1-1",
        "material": "asphalt", "material2": "dirt", "tileset": "w2", "timeLimit": 200,
        "subsoil": "dirt_c", "oneway": "balcony_st",
        "parallax": [{"key": "l11_sky", "scroll": 0.05, "y": 0}, {"key": "l11_far", "scroll": 0.2, "bottom": 424},
                     {"key": "l11_mid", "scroll": 0.45, "bottom": 436}],
        "signs": [{"sprite": "sign_reform", "caption": "sign_reform"}, {"sprite": "sign_facts", "caption": "sign_facts"}],
        "decor": {"A": "lamp_post", "B": "trash_can", "C": "bench_small", "D": "crate", "E": "barrel",
                  "F": "traffic_cone", "G": "caution_sign", "H": "pipe_stack", "K": "kiosk", "L": "billboard_campaign",
                  "M": "campaign_poster", "N": "birch", "O": "plant"},
    }
    m = [
        chunk(16, {13: "..P...1........."}),
        chunk(14, {13: "....==........", 12: "....==........"}),                       # low step
        chunk(12, {14: "##^^^^^^####"}),                                                # road works trench
        chunk(20, {11: "....----....----....", 10: ".....cc......cc.....", 13: "........J.......C..."}),
        chunk(10, {13: "...K...s.."}),
        chunk(16, {13: "....==..........", 12: "....==..........", 11: "....==....?....."}),  # 3-high wall + ? block
        # flooded pit: a moving platform AND a balcony route (two one-way balconies) across it
        chunk(14, {13: ".m....*.......", 11: "...---...---..", 9: "........--...."}, floor=False),
        chunk(12, {13: "....j.......", 11: "........t..."}),
        chunk(14, {13: "....2....G...."}),
    ]
    d = [
        blank_decor(16, {13: "......K...LA..B."}),
        blank_decor(14, {13: "..C....N...A.."}),
        blank_decor(12, {13: ".G........M."}),
        blank_decor(20, {13: "...D....A......E..N."}),
        blank_decor(10, {13: ".A.......F"}),
        blank_decor(16, {13: "H.......N....L.."}),
        blank_decor(14),
        blank_decor(12, {13: "..A.......A."}),
        blank_decor(14, {13: "..B..M...N...."}),
    ]
    write_level("l11_street", meta, m, d)


# =============================================================================== 1-2 bridge
def l12():
    meta = {
        "id": "l12", "world": 1, "label": "1-2",
        "material": "stone", "material2": "steel", "tileset": "w1", "timeLimit": 180,
        "parallax": [{"key": "l12_sky", "scroll": 0.05, "y": 0}, {"key": "l12_far", "scroll": 0.2, "bottom": 424},
                     {"key": "l12_mid", "scroll": 0.45, "bottom": 436}],
        "signs": [{"sprite": "sign_bridges", "caption": "sign_bridges"}, {"sprite": "sign_facts", "caption": "sign_facts"}],
        "decor": {"A": "pipe_stack", "B": "barrel", "C": "caution_sign", "D": "traffic_cone", "E": "crate", "F": "wood_box"},
    }
    m = [
        chunk(16, {13: "..P...1........."}),
        chunk(12, {14: "BBBBBBBBBBBB", 15: "~~^^^~~~^^^~"}, floor=False),
        chunk(12, {10: "....?...cccc", 11: "........----"}),
        chunk(14, {8: "......H.......", 9: "......,.......", 10: "......,.......", 11: "......,.......",
                   12: "......,.......", 13: ".....J........", 14: "BBBBBBBBBBBBBB", 15: "~^^~~~~~^^~~~~"}, floor=False),
        chunk(8, {13: "m......*"}, floor=False),
        chunk(12, {11: "..........%%", 12: "..........%%", 13: "..K....s.d%%"}, ground="@"),
        chunk(14, {10: "...c.c.t.c.c..", 14: "BBBBBBBBBBBBBB", 15: "~~~^^^~~~~^^^~"}, floor=False),
        chunk(8, {10: "n.......", 11: ":.......", 12: ":.......", 13: ":......."}, floor=False),
        chunk(12, {10: ".....$......", 11: "....----....", 13: ".......j...."}),
        chunk(6, {8: "..H...", 9: "..,...", 10: "..,...", 11: "..,...", 12: "..,...", 14: "BBBBBB", 15: "~^^^~~"}, floor=False),
        chunk(6, {13: "..2.G."}, ground="@"),
    ]
    d = [
        blank_decor(16, {13: "...........A..B."}), blank_decor(12), blank_decor(12, {13: "..C........."}),
        blank_decor(14), blank_decor(8), blank_decor(12, {13: "....D......."}), blank_decor(14), blank_decor(8),
        blank_decor(12, {13: "...E........"}), blank_decor(6), blank_decor(6),
    ]
    write_level("l12_bridge", meta, m, d)


# =============================================================================== 2-1 parliament
def l21():
    meta = {
        "id": "l21", "world": 2, "label": "2-1",
        "material": "marble", "material2": "wood", "tileset": "w2", "timeLimit": 200, "bgColor": "#f3e9d2",
        "subsoil": "wood_c", "oneway": "balcony",
        "parallax": [{"key": "l21_sky", "scroll": 0.05, "y": 0}, {"key": "l21_far", "scroll": 0.2, "bottom": 424},
                     {"key": "l21_mid", "scroll": 0.45, "bottom": 436}],
        "signs": [{"sprite": "sign_reform", "caption": "sign_rada"}, {"sprite": "sign_facts", "caption": "sign_facts"}],
        "decor": {"A": "rostrum", "B": "seat_row", "C": "chandelier", "D": "ballot_box", "E": "gavel", "F": "bench_small", "G": "campaign_poster"},
    }
    m = [
        chunk(16, {13: "..P...1........."}),
        chunk(16, {12: "....----........", 11: "....cc..........", 10: "........----....", 9: "........cc......",
                   8: "............----", 7: "............cc.."}),
        chunk(14, {11: "..@@..?...@@..", 12: "..@@......@@..", 13: "..@@......@@.."}),                    # columns + ? block
        chunk(12, {13: "..K...D....."}),
        chunk(18, {9: "n.................", 10: ":.................", 11: ":.................", 12: ":.................",
                   13: ":.................", 8: "....------------..", 7: "......cccccccc...."}),
        chunk(14, {14: "###......#####", 15: "###^^^^^^#####"}, floor=True) if False else
        chunk(14, {14: "###......#####", 15: "###^^^^^^#####", 16: "###~~~~~~#####", 17: "###~~~~~~#####"}),
        chunk(12, {13: "...J....j.s."}),
        chunk(14, {11: "...?....?.....", 9: ".....----.....", 8: "......$......."}),
        chunk(12, {13: "..K.....D..."}),
        chunk(12, {13: "...2....G..."}),
    ]
    d = [
        blank_decor(16, {13: "........A...B..."}), blank_decor(16, {13: "..F......B......"}), blank_decor(14, {6: "......C......."}),
        blank_decor(12, {13: "........D..."}), blank_decor(18, {13: "......B....B......"}), blank_decor(14),
        blank_decor(12, {13: "......E....."}), blank_decor(14, {13: "..G..........."}), blank_decor(12, {13: "....B......."}), blank_decor(12),
    ]
    write_level("l21_parliament", meta, m, d)


# =============================================================================== 2-2 courtyard
def l22():
    meta = {
        "id": "l22", "world": 2, "label": "2-2",
        "material": "dirt", "material2": "asphalt", "tileset": "w2", "timeLimit": 180,
        "subsoil": "dirt_c", "oneway": "bench",
        "parallax": [{"key": "l22_sky", "scroll": 0.05, "y": 0}, {"key": "l22_far", "scroll": 0.2, "bottom": 424},
                     {"key": "l22_mid", "scroll": 0.45, "bottom": 436}],
        "signs": [{"sprite": "sign_reform", "caption": "sign_voters"}, {"sprite": "sign_nabu", "caption": "sign_nabu"}],
        "decor": {"A": "bench_small", "B": "carpet_beater", "C": "garage_door", "D": "birch", "E": "trash_can",
                  "F": "campaign_poster", "G": "lamp_post", "H": "barrel"},
    }
    m = [
        chunk(16, {13: "..P...1........."}),
        chunk(14, {13: ".....V....V...", 12: "..--.........."}),
        chunk(12, {12: "..@@@@......", 13: "..@@@@......"}),                                              # garage roofs
        chunk(14, {11: "...----.......", 10: "....cc........", 13: ".K........V..."}),
        chunk(12, {14: "###.....####", 15: "###~~~~~####", 16: "###~~~~~####", 17: "###~~~~~####", 11: ".....$......"}),
        chunk(14, {13: "...V..v..V..J."}),
        chunk(12, {13: "..==...s....", 11: "......c.t.c."}),
        chunk(14, {13: "..K...........", 12: ".....@@@@.....", 10: "...........c.."}),
        chunk(12, {13: "...2....G..."}),
    ]
    d = [
        blank_decor(16, {13: "......A....D..E."}), blank_decor(14, {13: "..........F..."}), blank_decor(12, {13: "..C.C......."}),
        blank_decor(14, {13: "...B......G..."}), blank_decor(12), blank_decor(14, {13: "..........A..."}),
        blank_decor(12, {13: "..........H."}), blank_decor(14, {13: ".....C.C......"}), blank_decor(12, {13: ".....D......"}),
    ]
    write_level("l22_courtyard", meta, m, d)


# =============================================================================== 3-1 party
def l31():
    meta = {
        "id": "l31", "world": 3, "label": "3-1", "party": True,
        "material": "parquet", "material2": "concrete", "tileset": "w3", "timeLimit": 210, "bgColor": "#1a1030",
        "subsoil": "concrete_c", "oneway": "glass_plat",
        "parallax": [{"key": "l31_sky", "scroll": 0.05, "y": 0}, {"key": "l31_far", "scroll": 0.2, "bottom": 424},
                     {"key": "l31_mid", "scroll": 0.45, "bottom": 436}],
        "signs": [{"sprite": "sign_reform", "caption": "sign_party"}, {"sprite": "sign_facts", "caption": "sign_facts"}],
        "decor": {"A": "dj_table", "B": "disco_ball", "C": "champagne_tower", "D": "velvet_rope", "E": "bench_small", "F": "barrel"},
    }
    m = [
        chunk(16, {13: "..P...1...W....."}),
        chunk(16, {11: "c.c.c.c.c.c.c.c."}),
        chunk(14, {11: "..----------..", 10: "....$...$.....", 13: "......W......."}),
        chunk(12, {13: "..@@@@@@....", 12: "........c..."}),                                              # bar counter
        chunk(14, {13: "..K...W..J.W.."}),
        chunk(14, {9: "...n..........", 10: "...:..........", 11: "...:..........", 12: "...:..........", 13: "...:..........",
                   8: ".....--------.", 7: "......$..$..$."}),
        chunk(14, {13: "..m......*...."}, floor=False),
        chunk(12, {13: "..J.d.s..d.."}),
        chunk(14, {13: ".K............", 11: "...c.c.t.c.c.."}),
        chunk(14, {13: "...2..W..G...."}),
    ]
    d = [
        blank_decor(16, {13: "......D......A.."}), blank_decor(16, {5: "........B......."}), blank_decor(14, {13: "..C..........."}),
        blank_decor(12), blank_decor(14, {13: "....E........."}), blank_decor(14), blank_decor(14), blank_decor(12, {13: ".......F...."}),
        blank_decor(14, {5: "......B......."}), blank_decor(14, {13: "......D......."}),
    ]
    write_level("l31_party", meta, m, d)


# =============================================================================== 3-2 airport
def l32():
    meta = {
        "id": "l32", "world": 3, "label": "3-2",
        "material": "terminal", "material2": "tarmac", "tileset": "w3", "timeLimit": 240,
        "subsoil": "concrete_c", "oneway": "glass_plat",
        "parallax": [{"key": "l32_sky", "scroll": 0.05, "y": 0}, {"key": "l32_far", "scroll": 0.2, "bottom": 424},
                     {"key": "l32_mid", "scroll": 0.45, "bottom": 436}],
        "signs": [{"sprite": "sign_nabu", "caption": "sign_airport"}, {"sprite": "sign_facts", "caption": "sign_facts"}],
        "decor": {"A": "metal_detector", "B": "luggage_cart", "C": "suitcase", "D": "departures_board", "E": "boarding_stairs",
                  "F": "private_jet", "G": "traffic_cone", "H": "tug"},
    }
    m = [
        chunk(16, {13: "..P...1........."}),
        chunk(14, {13: "..m......*...."}, floor=False),                                                  # conveyor over the chute
        chunk(12, {13: ".K...D......", 10: "......----..", 9: ".......cc..."}),
        chunk(14, {11: "...@@..?..@@..", 12: "...@@.....@@..", 13: "...@@.....@@.."}),
        chunk(14, {13: "....j.s..d...."}),
        chunk(12, {9: "..n.........", 10: "..:.........", 11: "..:.........", 12: "..:.........", 13: "..:.........",
                   8: "....-------.", 7: ".......$...."}),
        chunk(12, {14: "##......####", 15: "##^^^^^^####", 16: "##~~~~~~####", 17: "##~~~~~~####"}, ground="@"),
        chunk(12, {13: "..K.....Q..."}, ground="@"),
        chunk(12, {13: "...2..G....."}, ground="@"),
    ]
    d = [
        blank_decor(16, {13: "........A....D.."}), blank_decor(14), blank_decor(12, {13: "........B..."}),
        blank_decor(14, {13: ".......C......"}), blank_decor(14, {13: "..........G..."}), blank_decor(12),
        blank_decor(12), blank_decor(12, {13: "....H......."}), blank_decor(12, {13: "......E..F.."}),
    ]
    write_level("l32_airport", meta, m, d)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    # 1-1 is authored by tools/author_level1.py (v2, 48 px art)
    for fn in (l12, l21, l22, l31, l32):
        fn()
