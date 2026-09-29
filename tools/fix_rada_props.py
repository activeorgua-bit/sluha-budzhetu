"""Rada props follow-up: the velvet sofa (props velvet_bench) was cut off on the left by its sheet cell.

The sofa is symmetric (three cushions, an arm and a leg at each end), so its left half is rebuilt as
the mirror of the right half.

  python tools/fix_rada_props.py      (runs after pixelize of the Rada props sheet)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PROPS = ROOT / "assets_src" / "frames" / "props"


def main():
    p = PROPS / "velvet_bench.png"
    a = np.array(Image.open(p).convert("RGBA"))
    w = a.shape[1]
    right = a[:, w // 2:]
    a[:, :w - w // 2] = right[:, ::-1][:, :w - w // 2]
    Image.fromarray(a, "RGBA").save(p)
    print("velvet_bench: left half mirrored from the right (both arms and legs)")


if __name__ == "__main__":
    main()
