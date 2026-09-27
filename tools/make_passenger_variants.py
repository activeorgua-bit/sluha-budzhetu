"""Colour variants of the metro passengers, so the crowd is not six identical twins.

For each passenger type the coat / jacket (the torso band of every frame) is recoloured into two
more colours: <skin>2_* and <skin>3_* frames. Heads, legs and outlines keep their colours; skin
tones are kept where the coat itself is not skin-coloured (the beige trench and the brown jacket
recolour everything in the band except outlines).

  python tools/make_passenger_variants.py     (runs after pixelize of m1_passengers_a / _b)
"""
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CHARS = ROOT / "assets_src" / "frames" / "chars"
# skin: ((hue shift of variant 2, variant 3) in degrees, keep skin tones?)
SKINS = {
    # the two older men and the woman with shopping bags keep their original coats (recolouring looked off)
    "ymale": ((150, 250), True), "yfemale": ((300, 150), True),
    "ofemale": ((120, 250), True),      # the woman with shopping bags keeps her own coat too
}
POSES = ["idle", "walk1", "walk2", "angry"]
SAMPLE = (0.46, 0.62)  # rows where the coat colour is measured (below the face, above the legs)
BAND = (0.44, 0.97)    # rows that may be recoloured (from below the chin), only where the pixel has the coat's colour


def hsv_of(a):
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    return h % 1, s, v


def coat_hue(a, op, top, h, keep_skin):
    H, S, V = hsv_of(a)
    y0, y1 = int(top + h * SAMPLE[0]), int(top + h * SAMPLE[1])
    m = np.zeros_like(op); m[y0:y1] = op[y0:y1]
    m &= (S > 0.15) & (V > 0.25)
    if keep_skin:
        m &= ~((H > 0.02) & (H < 0.12) & (S > 0.2) & (S < 0.62) & (V > 0.55))
    if not m.any():
        return None
    hist, edges = np.histogram(H[m], bins=36, range=(0, 1))
    return (edges[hist.argmax()] + 1 / 72) % 1


def recolour(im: Image.Image, shift: float, keep_skin: bool) -> Image.Image:
    a = np.array(im.convert("RGBA")).astype(float)
    op = a[..., 3] > 0
    rows = np.where(op.any(axis=1))[0]
    if not len(rows):
        return im
    top, bot = rows.min(), rows.max()
    h = bot - top
    hue = coat_hue(a, op, top, h, keep_skin)
    if hue is None:
        return im
    H, S, V = hsv_of(a)
    dist = np.minimum(np.abs(H - hue), 1 - np.abs(H - hue))
    m = op & (dist < 0.075) & (S > 0.1) & (V > 0.2)
    band = np.zeros_like(op); band[int(top + h * BAND[0]):int(top + h * BAND[1])] = True
    m &= band
    if keep_skin:                                   # hands stay hands
        m &= ~((H > 0.02) & (H < 0.12) & (S > 0.2) & (S < 0.62) & (V > 0.55))
    out = a.copy()
    for y, x in zip(*np.where(m)):
        s = max(S[y, x], 0.42)
        nr, ng, nb = colorsys.hsv_to_rgb((H[y, x] + shift / 360) % 1, s, V[y, x])
        out[y, x, :3] = (nr * 255, ng * 255, nb * 255)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def main():
    made = 0
    for skin, (shifts, keep) in SKINS.items():
        for k, shift in enumerate(shifts, start=2):
            for pose in POSES:
                src = CHARS / f"{skin}_{pose}.png"
                if not src.exists():
                    continue
                recolour(Image.open(src), shift, keep).save(CHARS / f"{skin}{k}_{pose}.png")
                made += 1
    print(f"passenger variants: {made} frames")


if __name__ == "__main__":
    main()
