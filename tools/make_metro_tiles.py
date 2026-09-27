"""Kyiv metro tileset (m1) cut from the generated sheet by hand-measured boxes.

The model drew the metro tiles in a drifting layout instead of the 8x8 template, so the grid slicer
cannot be used. The boxes below (2048 px source) were measured from the sheet's border lines.
Output: assets_src/frames/tilesets/m1/<name>.png (48x48), then pack_atlas.py builds the tileset.

  python tools/make_metro_tiles.py [path/to/raw.png]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets_src" / "raw" / "m1_tiles" / "v001.png"
OUT = ROOT / "assets_src" / "frames" / "tilesets" / "m1"

BOXES = {
    # '#' material "metro": polished pink-grey granite slabs over dark granite
    "metro_t": (4, 4, 256, 272), "metro_tl": (4, 4, 256, 272), "metro_t2": (514, 4, 768, 272),
    "metro_tr": (770, 4, 1024, 272),
    "metro_c": (4, 282, 256, 548), "metro_c2": (512, 557, 766, 830), "metro_c3": (258, 282, 512, 548),
    "metro_b": (4, 557, 256, 830), "metro_deep": (258, 557, 512, 830),
    # '@' material "platf": the platform edge with the yellow warning line
    "platf_t": (770, 557, 1024, 830), "platf_t2": (1028, 557, 1282, 830), "platf_tr": (1284, 557, 1538, 830),
    "platf_c": (4, 282, 256, 548),
    # one-way steel grating catwalk (thin: magenta below keys to transparent)
    "grate_plat_l": (4, 840, 256, 1094), "grate_plat_m": (258, 840, 512, 1094), "grate_plat_r": (514, 840, 768, 1094),
    # blue glazed tiles (walls), marble
    "bluetile_c": (516, 1080, 770, 1334), "bluetile_c2": (772, 1080, 1086, 1334),
    "marble_t": (1414, 4, 1668, 272), "marble_c": (1030, 290, 1284, 548),
}


def main(path=None):
    src = Image.open(path or RAW).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    palette = px.load_palette()
    for name, box in BOXES.items():
        cell = px.key_magenta(src.crop(box))
        tile = cell.resize((48, 48), Image.BOX)
        tile = px.binarize_alpha(px.quantize(tile, palette))
        if "_plat_" in name:          # the catwalk sits on the tile top; keep the grating only
            a = np.array(tile)
            rows = np.where(a[..., 3].max(axis=1) > 0)[0]
            if len(rows):
                top = rows.min()
                a = np.roll(a, -top, axis=0)
                a[48 - top:] = 0
            tile = Image.fromarray(a, "RGBA")
        tile.save(OUT / f"{name}.png")
    print(f"m1: {len(BOXES)} tiles -> {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
