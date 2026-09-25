"""oppmp_throw: the generated pose includes the flying chocolate bar; the game throws its own projectile,
so keep only the largest connected figure. Runs as the `fixup` of w2_oppmp2 (pixelize.py)."""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
F = ROOT / "assets_src" / "frames" / "chars" / "oppmp_throw.png"


def main():
    im = np.array(Image.open(F).convert("RGBA"))
    lab, n = ndimage.label(im[..., 3] > 0)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = 1 + int(np.argmax(sizes))
        im[lab != keep] = 0
        Image.fromarray(im, "RGBA").save(F)
    print(f"oppmp_throw: kept the figure ({n} parts before)")


if __name__ == "__main__":
    main()
