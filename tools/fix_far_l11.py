"""Level 1-1 far skyline: keep ONE landmark set, and make the strip wide enough never to repeat it.

The generated panorama contained the Kyiv landmark set twice (bell tower, cathedral, flag, Motherland
statue) plus seam-blend ghosts at both edges, and the 1100 px strip tiles while the camera scrolls, so
up to three sets were visible. The user asked for 1 monument, 1 flag, 1 tall church and 1-2 shorter ones.

  A = original with the right-hand set and the edge ghosts replaced by clean trees/apartment blocks
  B = A with the left-hand set replaced as well (landmark-free)
  layer = roll(A + B)  -> 2200 px; at scroll 0.15 over the street zone the camera moves < 600 px,
                          so the single set is never seen twice.

Patches copy whole columns (rows 0..y1) from a landmark-free donor range of the same image; transparent
rows above the donor's treeline become sky.

  python tools/fix_far_l11.py   (pixelize.py runs it automatically via `fixup:` in the manifest)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "parallax" / "l11" / "far.png"
SRC = ROOT / "assets_src" / "frames" / "parallax_l11_far_1100.png"   # pristine pixelize output

# (x0, width, donor_x, rows_down_to) in the 1100 px source. Applied in order, each reading the
# already-patched image, so later patches can use cleaned areas as donors (the right edge 1046+ holds
# a seam-blend ghost tower and must never be a donor).
PATCH_A = [
    (806, 50, 990, 270),     # duplicate flag
    (864, 76, 940, 280),     # duplicate statue
    (528, 100, 936, 266),    # duplicate bell tower + two small chapels
    (656, 72, 412, 306),     # duplicate cathedral, left half
    (728, 72, 484, 306),     # duplicate cathedral, right half
    (1040, 60, 806, 262),    # seam ghost bell tower on the right edge
    (0, 30, 108, 262),       # seam ghost dome on the left edge
]
# B removes the kept set too, using A's cleaned areas as donors
PATCH_B = [
    (0, 112, 528, 266),      # bell tower + chapels
    (138, 70, 656, 306),     # cathedral, left half
    (208, 70, 726, 306),     # cathedral, right half
    (280, 50, 806, 270),     # flag
    (336, 80, 864, 280),     # statue
]
ROLL = 330          # landmark set further right: the bell tower and cathedral clear the grey building


def patch(a: np.ndarray, ops) -> np.ndarray:
    out = a.copy()
    for x0, w, dx, y1 in ops:
        out[:y1, x0:x0 + w] = out[:y1, dx:dx + w].copy()
    return out


def main():
    current = Image.open(OUT)
    if current.width == 1100 or not SRC.exists():   # fresh pixelize output: keep it as the source
        SRC.parent.mkdir(parents=True, exist_ok=True)
        current.save(SRC)
    src = np.array(Image.open(SRC).convert("RGBA"))
    assert src.shape[1] == 1100, f"expected the 1100 px pixelize output, got {src.shape}"
    a = patch(src, PATCH_A)
    b = patch(a, PATCH_B)
    layer = np.roll(np.concatenate([a, b], axis=1), ROLL, axis=1)
    layer[layer[..., 3] < 255] = 0      # no half-transparent seam ghosts (binary alpha)
    Image.fromarray(layer, "RGBA").save(OUT)
    print(f"far.png -> {layer.shape[1]}x{layer.shape[0]} (one landmark set at x {28 + ROLL}-{410 + ROLL})")


if __name__ == "__main__":
    main()
