"""Zoloti Vorota arcade: cut the generated colonnade strips into tileable bays (props zv_bay_1..8).

Each strip is a flat front elevation of FOUR bays (pillar centres at 1/8, 3/8, 5/8, 7/8), so cutting at
the quarters gives pillar-centred bays whose half arches meet their neighbours' at the bay edges.
The area under the arches is magenta in the source (-> transparent: the central hall shows through).
Each bay is scaled to BAY_W wide and extended upward with its own top rows (the plain white vault)
to FULL_H, so the vault reaches the top of the level even when the camera goes up.

  python tools/make_metro_arcade.py
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets_src" / "raw"
OUT = ROOT / "assets_src" / "frames" / "props"
STRIPS = [("m1_arcade_a", 1), ("m1_arcade_b", 5)]      # (asset id, first bay number)
BAY_W = 288          # 6 tiles
FULL_H = 672         # floor (row 14) to the top of the level


def bays_from(strip: Image.Image):
    w = strip.width
    for k in range(4):
        x0, x1 = round(k * w / 4), round((k + 1) * w / 4)
        yield strip.crop((x0, 0, x1, strip.height))


def main():
    palette = px.load_palette()
    OUT.mkdir(parents=True, exist_ok=True)
    made = []
    for asset, first in STRIPS:
        src = RAW / asset / "v001.png"
        if not src.exists():
            print(f"[skip] {src} missing")
            continue
        strip = px.key_magenta(Image.open(src).convert("RGBA"))
        for k, bay in enumerate(bays_from(strip)):
            h = round(bay.height * BAY_W / bay.width)
            b = bay.resize((BAY_W, h), Image.BOX)
            b = px.binarize_alpha(px.quantize(b, palette))
            a = np.array(b)
            # the vault above: repeat the top rows (plain white plaster) up to FULL_H
            if h < FULL_H:
                top = a[4:12]
                pad = np.concatenate([top] * ((FULL_H - h) // len(top) + 1), axis=0)[:FULL_H - h]
                a = np.concatenate([pad, a], axis=0)
            else:
                a = a[h - FULL_H:]
            name = f"zv_bay_{first + k}"
            Image.fromarray(a, "RGBA").save(OUT / f"{name}.png")
            made.append(name)
    print("arcade bays:", made)


if __name__ == "__main__":
    main()
