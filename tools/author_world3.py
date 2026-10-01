"""Author the world 3 levels (the fall) on coordinate canvases.

  python tools/author_world3.py && node tools/validate_levels.mjs

  e31 the oligarch's party (3-1): villa at night, pools, bandits (friendly if you are corrupt enough),
      MPs, journalists; the mafia boss makes his offer (Yes / No) — either way a cut scene follows.
  e32 the block district at golden hour (3-2): yards with falling balconies, the sport court with
      gopniks, the dog park, the riverside with the wave footbridge, a street; boss: the gopnik gang;
      exit: a taxi (5 bribes, free for an honest politician).
  e33 the central railway station (3-3): lots of cops; buy a ticket (E at the ticket office) and board.
"""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("w2", ROOT / "tools" / "author_world2.py")
w2 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(w2)
Canvas, solid, far_scroll, GROUND, ROWS = w2.Canvas, w2.solid, w2.far_scroll, w2.GROUND, w2.ROWS


def pool(c, c0, c1):
    c.fill(GROUND, ROWS - 1, c0, c1, ".")
    c.fill(GROUND + 1, ROWS - 1, c0, c1, "~")


# =============================================================================== e31 party
def party():
    c = Canvas(150)
    c.ground(0, 149)
    c.put(13, 2, "P")
    c.put(13, 5, "1")                        # PARTY "FRIENDS ONLY"
    c.dec(8, "A")                            # velvet rope
    c.put(13, 12, "N")                       # bandit
    c.dec(15, "B")                           # golden gate (background)
    c.put(10, 17, "c.c.c")
    c.dec(18, "C")                           # champagne tower
    c.dec(21, "D")                           # buffet table (standable)
    c.put(13, 25, "R")                       # MP guest
    c.dec(27, "E")                           # DJ table (standable)
    c.dec(28, "F", 6)                        # disco ball
    c.put(9, 28, "c")
    c.dec(32, "G")                           # white sofa (standable)
    c.put(12, 33, "y")                       # whisky on the sofa
    c.put(13, 36, "N")
    pool(c, 40, 49)
    c.fill(11, 11, 41, 43, "-"); c.fill(11, 11, 46, 48, "-")
    c.put(10, 42, "c"); c.put(10, 47, "c")
    c.dec(51, "H")                           # hot tub
    c.put(13, 55, "K")
    c.put(13, 58, "F")                       # female journalist
    c.dec(60, "I")                           # golden lion
    c.dec(63, "J")                           # white piano (standable)
    c.put(9, 64, "$")
    c.dec(68, "L")                           # supercar (roof standable)
    c.put(9, 70, "c.c")
    c.put(13, 75, "N")
    c.put(13, 78, "R")
    c.dec(80, "M")                           # gift pile
    c.dec(82, "O")                           # ice swan
    c.put(13, 85, "j")
    c.dec(87, "Q")                           # open safe (solid)
    c.put(8, 88, "$")
    pool(c, 92, 99)
    c.fill(11, 11, 93, 95, "-"); c.fill(9, 9, 96, 98, "-")
    c.put(8, 97, "t")
    c.put(13, 103, "K")
    c.dec(106, "S")                          # palm with lights
    c.put(13, 112, "N")                      # a few tiles from the checkpoint: no punch back into the pool
    c.put(13, 112, "J")
    c.put(12, 115, "y")
    c.dec(116, "D")
    c.put(13, 120, "N")
    c.put(13, 123, "R")
    c.dec(126, "A")
    c.put(13, 133, "X")                      # the mafia boss and his offer
    c.dec(138, "B")
    c.dec(142, "A")
    c.put(13, 146, "G")
    c.put(8, 96, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "e31", "world": 3, "label": "3-1",
        "material": "villa", "tileset": "v1", "oneway": "glass_plat", "timeLimit": 240, "bgColor": "#0b0f2a",
        "boss": {"type": "mafia"},
        "narration": [{"col": 25, "key": "e31_dj"}, {"col": 38, "key": "e31_pool"}, {"col": 85, "key": "e31_safe"}],
        "parallax": [
            {"key": "e31_sky", "scroll": 0.05, "y": 0},
            {"key": "e31_far", "scroll": far_scroll(150, 1800), "bottomRow": 14, "lift": -24},
        ],
        "signs": [{"sprite": "plaque", "caption": "sign_villa"}],
        "decor": {
            "A": {"frame": "velvet_rope", "w": 3}, "B": {"frame": "gate_gold", "w": 3}, "C": {"frame": "champagne_tower", "w": 2},
            "F": {"frame": "disco_ball", "w": 2}, "H": {"frame": "hot_tub", "w": 3}, "I": {"frame": "lion_statue", "w": 2},
            "M": {"frame": "gift_pile", "w": 2}, "O": {"frame": "ice_swan", "w": 2}, "S": {"frame": "palm_lights", "w": 2},
            "D": solid("buffet_table", "top", 3),
            "E": solid("dj_table", "top", 4),
            "G": solid("sofa_white", "top", 3, 0.9),
            "J": solid("piano_white", "top", 4),
            "L": solid("supercar", "top", 5, 1.3),
            "Q": solid("safe_black", "full", 2),
        },
    }
    c.write("e31_party", meta)


# =============================================================================== e32 block district
def district():
    c = Canvas(230)
    c.ground(0, 229)
    c.ground(60, 95, "@")                    # the sport court (red surface via materialZones)
    c.ground(125, 141, "@")                  # riverside lawn
    c.put(13, 2, "P")
    c.put(13, 5, "1")                        # TROIESHCHYNA. WELCOME
    # --- yards between the panel blocks
    c.dec(8, "A")                            # block entrance
    c.put(13, 11, "!")                       # falling balcony (corrupt only)
    c.put(13, 14, "L")                       # old lady
    c.dec(17, "B")                           # sandbox (standable rim)
    c.dec(22, "C")                           # swings
    c.put(13, 25, "!")
    c.put(13, 28, "h")                       # gopnik
    c.dec(31, "D")                           # garages (roof standable)
    c.put(9, 32, "c.c.c")
    c.put(13, 38, "i")                       # angry citizen (eggs, only if you are corrupt)
    c.dec(40, "E")                           # waste bins (solid)
    c.dec(44, "A")
    c.put(13, 46, "!")
    c.put(13, 50, "T"); c.put(13, 52, "o"); c.put(13, 53, "o")
    c.dec(54, "S")                           # liquor kiosk: E buys whisky
    c.put(13, 58, "K")
    # --- sport court
    c.dec(60, "F", 13)                       # mesh fence (background)
    c.dec(66, "G")                           # basketball hoop
    c.put(13, 68, "h")
    c.dec(71, "H")                           # workout bars (standable)
    c.put(9, 72, "c.c")
    c.put(13, 77, "h")
    c.dec(80, "I")                           # slide
    c.fill(11, 11, 85, 90, "-")              # a concrete ledge along the court
    c.put(10, 86, "c.o.c")
    c.put(13, 88, "L")
    c.dec(92, "F")
    # --- dog park
    c.put(13, 100, "I"); c.put(13, 102, "Y")
    c.dec(105, "J")                          # birch
    c.put(13, 110, "I"); c.put(13, 112, "Y")
    c.put(13, 116, "i")
    c.put(13, 118, "c")
    c.put(13, 121, "K")
    # --- riverside park and the wave footbridge
    c.put(13, 128, "T"); c.put(13, 130, "o"); c.put(13, 132, "o")
    c.dec(134, "K")                          # riverside bench (standable)
    c.put(13, 138, "i")
    c.fill(GROUND, GROUND, 142, 157, "B")    # the wave footbridge (gives way only under the corrupt)
    c.fill(GROUND + 1, ROWS - 1, 142, 157, "~")
    c.put(10, 148, "c.c")
    c.put(13, 162, "s"); c.put(13, 164, "d")
    c.put(13, 167, "i")
    c.put(13, 172, "K")
    # --- street: a chestnut tree before the gang, so an honest politician can restock for the boss
    c.put(13, 175, "T"); c.put(13, 178, "o"); c.put(13, 190, "o")
    # a money bag on the pavement before the gang: after the mafia deal a corrupt politician arrives broke,
    # and this is enough to buy the gang off (8); it hangs a jump up, so an honest one walks under it
    c.put(11, 182, "$")                      # just above head height: jump for it
    c.dec(180, "M"); c.dec(192, "M"); c.dec(204, "M")      # soviet street lamps
    c.put(13, 184, "C")
    c.put(13, 188, "J")
    c.dec(195, "J")
    c.put(13, 198, "d")
    c.put(10, 200, "t")
    c.put(13, 208, "X")                      # the gopnik gang
    # a second bag past the gang, before the taxi: the fare (3) and the train ticket at the station (5)
    c.put(11, 211, "$")
    c.dec(214, "T")                          # the taxi
    c.put(13, 221, "2")                      # plaque: taxi rank
    c.put(13, 224, "G")
    c.put(10, 87, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "e32", "world": 3, "label": "3-2",
        "material": "asphalt", "material2": "grass", "tileset": "d1", "oneway": "ledge_plat", "timeLimit": 300,
        "bgColor": "#f7b27a", "goal": "taxi", "boss": {"type": "gopboss"},
        "detectivePressure": 1.35,   # fewer NABU detectives in the district (the late-game wall for a corrupt run)
        "materialZones": [{"ch": "@", "from": 60, "to": 96, "mat": "sport"}],
        "bridgeStyle": "wave", "bridgeHostileOnly": True, "collapseMin": 1.0,   # the footbridge holds a moment even under the corrupt
        "backfill": [{"tile": "asphalt_c", "from": 0, "to": 142, "row": 14, "tint": "#7a5a4a"},
                     {"tile": "asphalt_c", "from": 158, "to": 230, "row": 14, "tint": "#7a5a4a"}],
        "narration": [{"col": 9, "key": "e32_debris"}, {"col": 60, "key": "e32_court"}, {"col": 97, "key": "e32_dogs"},
                      {"col": 126, "key": "e32_river"}, {"col": 139, "key": "e32_bridge"}, {"col": 178, "key": "e32_street"}],
        "parallax": [
            {"key": "e32_sky", "scroll": 0.05, "y": 0},
            {"key": "e32_far", "scroll": 0.08, "bottomRow": 14, "lift": 40, "zone": [[0, 122], [176, 999]]},
            {"key": "e32_river", "scroll": 0.12, "bottomRow": 17, "lift": -20, "zone": [122, 176]},
            {"key": "e32_mid", "scroll": 0.35, "bottomRow": 14, "lift": 0, "zone": [[0, 122], [176, 999]]},
        ],
        "signs": [{"sprite": "plaque", "caption": "sign_district"}, {"sprite": "plaque", "caption": "cut_taxi"}],
        "decor": {
            "A": {"frame": "block_entrance", "w": 4}, "C": {"frame": "swing_set", "w": 3}, "F": {"frame": "mesh_fence", "w": 3},
            "G": {"frame": "basket_hoop", "w": 2}, "I": {"frame": "slide_play", "w": 3}, "J": {"frame": "birch_yellow", "w": 4},
            "M": {"frame": "lamp_soviet", "w": 2}, "S": {"frame": "liquor_kiosk", "w": 3, "shop": "whiskey"},
            "T": {"frame": "taxi_car", "w": 5}, "W": {"frame": "wave_rail", "w": 4},
            "B": solid("sandbox", "top", 3, 0.6),
            "D": solid("garages", "top", 5),
            "E": solid("waste_bins", "full", 3),
            "H": solid("workout_bar", "top", 3),
            "K": solid("bench", "top", 3, 0.75),
        },
    }
    c.write("e32_district", meta)


# =============================================================================== e33 railway station
def station():
    c = Canvas(120)
    c.ground(0, 119)
    c.put(13, 2, "P")
    c.put(13, 5, "1")                        # KYIV-PASAZHYRSKYI
    c.dec(8, "A")                            # ticket office: E buys a ticket
    c.dec(14, "B")                           # departures board
    c.put(13, 18, "C")
    c.dec(21, "D")                           # seats (standable)
    c.put(10, 22, "c")
    c.dec(29, "E")                           # vending machine
    c.dec(33, "F")                           # turnstiles (solid)
    c.put(13, 38, "C")
    c.put(13, 42, "s")                       # a manhole for NABU (the gated detective here is gone: fewer for a corrupt run)
    c.put(13, 49, "J")
    c.dec(52, "G")                           # luggage trolley (standable)
    c.put(10, 53, "$")
    c.put(13, 56, "C")
    c.put(13, 60, "K")
    c.dec(63, "H")                           # suitcases (solid)
    c.dec(71, "I")                           # news kiosk (standable)
    c.put(9, 72, "c")
    c.dec(76, "L")                           # platform lamp
    c.dec(80, "M")                           # station clock
    c.put(13, 82, "C")
    c.fill(11, 11, 86, 95, "-")              # footbridge over the tracks
    c.put(10, 88, "c.c.t")
    c.put(13, 91, "D")
    c.put(13, 97, "F")
    c.put(13, 101, "C")
    c.dec(106, "T")                          # the train door
    c.put(13, 112, "G")
    c.put(10, 89, "+")   # voters' thank-you: +1 life (honest-reachable, off the beaten track)
    meta = {
        "id": "e33", "world": 3, "label": "3-3",
        "material": "platform", "tileset": "v1", "oneway": "foot_plat", "timeLimit": 200, "bgColor": "#f0a870",
        "goal": "train",
        "detectivePressure": 1.35,   # fewer NABU detectives at the station (5 cops instead of 7, too)
        "narration": [{"col": 13, "key": "e33_board"}, {"col": 100, "key": "e33_boss"}],
        "parallax": [
            {"key": "e33_sky", "scroll": 0.05, "y": 0},
            {"key": "e33_mid", "scroll": 0.3, "bottomRow": 14, "lift": 0},
        ],
        "signs": [{"sprite": "plaque", "caption": "sign_station"}],
        "decor": {
            "A": {"frame": "ticket_office", "w": 4, "shop": "ticket"}, "B": {"frame": "departures_board", "w": 4},
            "E": {"frame": "vending_machine", "w": 2}, "L": {"frame": "platform_lamp", "w": 2}, "M": {"frame": "station_clock", "w": 2},
            "T": {"frame": "train_door", "w": 5},
            "D": solid("station_seats", "top", 3, 0.9),
            "F": solid("turnstiles", "full", 3, 1.6),
            "G": solid("luggage_trolley", "top", 3),
            "H": solid("suitcases", "full", 2),
            "I": solid("news_kiosk", "top", 3),
        },
    }
    c.write("e33_station", meta)


if __name__ == "__main__":
    party()
    district()
    station()
