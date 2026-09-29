"""Rada balustrade ends (r1 balus_plat_l / balus_plat_r) rebuilt from the middle piece.

The generated end cells were drawn at another scale on a dark brown ground, 8 px lower than the
middle piece, so the mezzanine ended in brown blocks with crooked joins. Each end is now the
middle piece with a plain stone end post (the rail's own colours) on its outer side.

The middle piece also loses the outline on its left and right edges (a dark seam between pieces).

  python tools/fix_rada_balus.py      (runs after pixelize of w2_tiles_rada)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / "assets_src" / "frames" / "tilesets" / "r1"
POST_W = 9          # end post width in px (including its outline)


def main():
    m = np.array(Image.open(DIR / "balus_plat_m.png").convert("RGBA"))
    rows = np.where(m[..., 3].max(axis=1) > 0)[0]
    top, bot = int(rows.min()), int(rows.max())
    # the middle piece was outlined on its left and right edges: a dark seam between every two pieces.
    # Continue the rail and the base through the edge columns instead.
    w = m.shape[1]
    for x, src in ((0, 1), (1, 2), (w - 1, w - 2), (w - 2, w - 3)):
        edge = m[top + 1:bot, x]
        m[top + 1:bot, x] = np.where((m[top + 1:bot, x, 3:] > 0) & (m[top + 1:bot, src, 3:] > 0), m[top + 1:bot, src], edge)
    Image.fromarray(m, "RGBA").save(DIR / "balus_plat_m.png")
    # colours from the middle piece's top rail: outline, light stone, shade
    outline = m[top, m.shape[1] // 2].copy()
    light = m[top + 3, m.shape[1] // 2].copy()
    shade = m[top + 6, m.shape[1] // 2].copy()
    left = m.copy()
    left[top:bot + 1, 0:POST_W] = light
    left[top:bot + 1, 0] = outline                  # outer edge
    left[top:bot + 1, POST_W - 1] = outline         # inner edge against the balusters
    left[top:bot + 1, POST_W - 3:POST_W - 1] = shade
    left[top, 0:POST_W] = outline                   # cap
    left[bot, 0:POST_W] = outline                   # base
    Image.fromarray(left, "RGBA").save(DIR / "balus_plat_l.png")
    Image.fromarray(left[:, ::-1].copy(), "RGBA").save(DIR / "balus_plat_r.png")
    print(f"balus_plat_l/r rebuilt from balus_plat_m (rows {top}-{bot}, end post {POST_W} px)")


if __name__ == "__main__":
    main()
