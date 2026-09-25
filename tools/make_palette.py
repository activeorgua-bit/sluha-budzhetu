"""Build palette v2 (authored ramps + colours sampled from the level mockups) and its strip.

  python tools/make_palette.py

Writes assets_src/reference/palette.json + .gpl and crops/palette_strip.png (the strip is sent
with every generation prompt). Near-duplicates (< min_distance RGB) are dropped.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import yaml
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

SEED = px.ROOT / "tools" / "palette_seed.yaml"
SWATCH, COLUMNS = 48, 12


def kmeans_colors(paths, k, seed=7):
    from scipy.cluster.vq import kmeans2
    pix = []
    for p in paths:
        im = Image.open(p).convert("RGB")
        im = im.resize((im.width // 3, im.height // 3), Image.NEAREST)
        pix.append(np.array(im).reshape(-1, 3))
    data = np.concatenate(pix).astype(np.float64)
    rng = np.random.default_rng(seed)
    data = data[rng.choice(len(data), size=min(len(data), 60000), replace=False)]
    centroids, labels = kmeans2(data, k, seed=seed, minit="++")
    counts = np.bincount(labels, minlength=k)
    order = np.argsort(-counts)
    return [tuple(int(v) for v in centroids[i]) for i in order if counts[i] > 0]


def main():
    seed = yaml.safe_load(SEED.read_text(encoding="utf-8"))
    groups = [{"name": g["name"], "colors": [c.upper() for c in g["colors"]]} for g in seed["groups"]]
    existing = [px.hex_to_rgb(c) for g in groups for c in g["colors"]]
    s = seed.get("sample") or {}
    if s:
        paths = [px.REF_DIR / n for n in s["images"]]
        mind = s.get("min_distance", 20)
        sampled = []
        for rgb in kmeans_colors(paths, s.get("k", 24)):
            d = min(np.sqrt(sum((a - b) ** 2 for a, b in zip(rgb, e))) for e in existing + sampled)
            if d >= mind:
                sampled.append(rgb)
        groups.append({"name": "sampled", "colors": [px.rgb_to_hex(c) for c in sampled]})
    # dedupe exact repeats across groups
    seen = set()
    for g in groups:
        g["colors"] = [c for c in g["colors"] if not (c in seen or seen.add(c))]
    groups = [g for g in groups if g["colors"]]
    (px.REF_DIR / "palette.json").write_text(json.dumps({"groups": groups}, indent=1), encoding="utf-8")
    lines = ["GIMP Palette", "Name: Sluha Budzhetu v2", f"Columns: {COLUMNS}", "#"]
    for g in groups:
        for c in g["colors"]:
            r, gg, b = px.hex_to_rgb(c)
            lines.append(f"{r:3d} {gg:3d} {b:3d}\t{g['name']}")
    (px.REF_DIR / "palette.gpl").write_text("\n".join(lines) + "\n", encoding="utf-8")
    colors = [c for g in groups for c in g["colors"]]
    rows = (len(colors) + COLUMNS - 1) // COLUMNS
    strip = Image.new("RGB", (COLUMNS * SWATCH, rows * SWATCH), (243, 234, 219))
    d = ImageDraw.Draw(strip)
    for i, c in enumerate(colors):
        x, y = (i % COLUMNS) * SWATCH, (i // COLUMNS) * SWATCH
        d.rectangle([x + 2, y + 2, x + SWATCH - 3, y + SWATCH - 3], fill=px.hex_to_rgb(c))
    px.ensure_dir(px.REF_DIR / "crops")
    strip.save(px.REF_DIR / "crops" / "palette_strip.png")
    print(f"palette v2: {len(colors)} colours in {len(groups)} groups; strip {strip.size}")


if __name__ == "__main__":
    main()
