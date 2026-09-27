"""The far colonnade of the metro hall as an overlay (parallax/m11/farcols.png), so a distant train can run
along the far wall BEHIND the far pillars and the far platform edge.

far.png keeps everything; farcols.png keeps only the far pillars (capital to base) and the floor
below the wall line. The level draws: far hall -> train -> farcols (same scroll as far.png).

  python tools/make_metro_farmask.py      (runs after pixelize of m11_bg_far)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / "public" / "assets" / "parallax" / "m11"
WALL = (500, 575)      # rows of the far wall between the pillars (pillars are brighter there)
CAP_TOP = 455          # the far capitals start here
FLOOR = 594            # the far platform floor starts below the wall's base line


def main():
    im = Image.open(DIR / "far.png").convert("RGBA")
    a = np.array(im)
    lum = a[WALL[0]:WALL[1], :, :3].astype(int).mean(axis=2).mean(axis=0)
    pillar = lum > lum.mean() + 8
    # grow each pillar run a little: the dark outlines belong to the pillar
    grown = pillar.copy()
    for d in range(1, 7):
        grown[d:] |= pillar[:-d]
        grown[:-d] |= pillar[d:]
    keep = np.zeros(a.shape[:2], bool)
    keep[CAP_TOP:FLOOR, grown] = True
    keep[FLOOR:, :] = True
    out = a.copy()
    out[~keep] = 0
    Image.fromarray(out, "RGBA").save(DIR / "farcols.png")
    runs = int(np.sum(np.diff(grown.astype(int)) == 1))
    print(f"farcols.png: {runs} far pillars + floor from y {FLOOR}")


if __name__ == "__main__":
    main()
