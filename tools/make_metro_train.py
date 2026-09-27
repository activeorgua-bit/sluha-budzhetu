"""A five-car Kyiv metro train (props metro_train_long) from the two-car sprite metro_train.

metro_train = cab car | gangway | middle car. The long train is
  cab car | gangway | car | gangway | car | gangway | car | gangway | cab car (mirrored),
so it has a cab at both ends like the real rolling stock.

  python tools/make_metro_train.py      (after pixelize of metro_train)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PROPS = ROOT / "assets_src" / "frames" / "props"
CAB_END, CAR_START = 391, 410    # the cab car ends / the middle car starts (the gangway is between)
MIDDLE_CARS = 3


def main():
    a = np.array(Image.open(PROPS / "metro_train.png").convert("RGBA"))
    cab, gang, car = a[:, :CAB_END], a[:, CAB_END:CAR_START], a[:, CAR_START:]
    parts = [cab]
    for _ in range(MIDDLE_CARS):
        parts += [gang, car]
    parts += [gang, cab[:, ::-1]]
    out = np.concatenate(parts, axis=1)
    Image.fromarray(out, "RGBA").save(PROPS / "metro_train_long.png")
    print(f"metro_train_long: {out.shape[1]}x{out.shape[0]} ({MIDDLE_CARS + 2} cars)")


if __name__ == "__main__":
    main()
