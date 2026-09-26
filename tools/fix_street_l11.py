"""1-1 street facades: loop the strip at a building boundary instead of cross-fading it.

The generated strip starts with a cream building and ends with its twin, cut off. Cropping to the
period where the twin begins (x = 729, found by column matching) makes the loop join a white facade
to a complete cream building: no cross-fade, so no half-transparent ghost roof and no smeared
windows. The manifest entry has `seamless: false` so make_parallax leaves the ends alone.

Runs as the `fixup` of l1_bg_street (pixelize.py), or by hand:  python tools/fix_street_l11.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "parallax" / "l11" / "street.png"
PERIOD = 729


def main():
    im = Image.open(OUT).convert("RGBA")
    if im.width > PERIOD:
        im = im.crop((0, 0, PERIOD, im.height))
    a = np.array(im)
    a[a[..., 3] < 255] = 0          # binary alpha
    Image.fromarray(a, "RGBA").save(OUT)
    print(f"street.png -> {PERIOD}x{im.height} (loops white facade -> cream building)")


if __name__ == "__main__":
    main()
