"""Bridge-level water tiles: over the Dnipro the river is already painted by the parallax layer (its
water starts above the pier tops), so opaque water tiles read as dark boxes and a foam crest reads as a
dark line. Both b1 water tiles are fully transparent; the hazard itself is game logic, and the spikes
mark the dangerous spots.

Runs as the `fixup` of l12_tiles (pixelize.py), after the b1 frames are written.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TILES = ROOT / "assets_src" / "frames" / "tilesets"


def main():
    # b1 (Dnipro bridge) and d1 (the district's riverside): the river is a parallax layer
    for world in ("b1", "d1"):
        if not (TILES / world).exists():
            continue
        for name in ("water_top", "water_top2", "water_fill"):
            Image.new("RGBA", (48, 48), (0, 0, 0, 0)).save(TILES / world / f"{name}.png")
    print("b1/d1 water: transparent (the river is painted by the parallax layer)")


if __name__ == "__main__":
    main()
