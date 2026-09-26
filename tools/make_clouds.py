"""Cloud sprites for the living sky (src/entities/world/Sky.js).

The soft, outline-free clouds of the bridge level's sky (the style of the user's bridge mockup) are cut
out one by one: a pixel belongs to a cloud when it is clearly brighter than the sky colour of its row.
Output: public/assets/atlases/clouds.png + clouds.json (Phaser JSON-hash atlas, frames cloud_0..N,
largest first).

  python tools/make_clouds.py        (then pack_atlas.py refreshes public/assets/manifest.json)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "parallax" / "l12" / "sky.png"
OUT = ROOT / "public" / "assets" / "atlases"
MIN_AREA = 80        # px; smaller specks are noise
PAD = 2


def main():
    rgb = np.array(Image.open(SRC).convert("RGB")).astype(int)
    h, w, _ = rgb.shape
    bg = np.median(rgb, axis=1, keepdims=True)                      # sky colour of each row
    lift = (rgb - bg).sum(axis=2)                                    # clouds are brighter than their row
    mask = (lift > 40) & ((rgb[..., 0] - bg[..., 0]) > 24)          # whiter, not just a brighter blue
    mask = ndimage.binary_closing(mask, structure=np.ones((3, 3)), iterations=1)
    mask = ndimage.binary_fill_holes(mask)
    labels, n = ndimage.label(ndimage.binary_dilation(mask, iterations=3))
    clouds = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        part = (labels[sl] == i) & mask[sl]
        if part.sum() < MIN_AREA:
            continue
        ys, xs = sl
        if xs.start == 0 or xs.stop == w:                            # cut by the image edge
            continue
        crop = rgb[sl].astype(np.uint8)
        alpha = np.where(part, 255, 0).astype(np.uint8)
        img = np.dstack([crop, alpha])
        img = np.pad(img, ((PAD, PAD), (PAD, PAD), (0, 0)))
        clouds.append(Image.fromarray(img, "RGBA"))
    clouds.sort(key=lambda im: -im.width * im.height)

    # simple shelf packing
    sheet_w = 512
    x = y = shelf = 0
    frames = {}
    placed = []
    for k, im in enumerate(clouds):
        if x + im.width > sheet_w:
            x, y, shelf = 0, y + shelf, 0
        placed.append((im, x, y))
        frames[f"cloud_{k}"] = {"frame": {"x": x, "y": y, "w": im.width, "h": im.height}, "rotated": False, "trimmed": False,
                                "spriteSourceSize": {"x": 0, "y": 0, "w": im.width, "h": im.height},
                                "sourceSize": {"w": im.width, "h": im.height}}
        x += im.width
        shelf = max(shelf, im.height)
    sheet = Image.new("RGBA", (sheet_w, y + shelf), (0, 0, 0, 0))
    for im, px, py in placed:
        sheet.paste(im, (px, py))
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / "clouds.png")
    (OUT / "clouds.json").write_text(json.dumps({"frames": frames, "meta": {"image": "clouds.png", "size": {"w": sheet.width, "h": sheet.height}, "scale": 1}}, indent=1), encoding="utf-8")
    print(f"clouds: {len(clouds)} sprites -> {sheet.width}x{sheet.height}", [f"{im.width}x{im.height}" for im in clouds])


if __name__ == "__main__":
    main()
