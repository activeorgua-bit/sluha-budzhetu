"""Render magenta grid templates that are sent to the image model as reference_images[0].

The model is asked to "fill this exact grid"; because every cell has a known geometry the
output can be sliced deterministically. Both magenta shades (#FF00FF fill, #E600E6 lines)
are removed by pixart.key_magenta().

Usage:
  python tools/make_grid_template.py                # writes the standard set
  python tools/make_grid_template.py --cols 4 --rows 3 --cell 256 --out my.png
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

TEMPLATE_DIR = px.ROOT / "assets_src" / "templates"
FILL = (255, 0, 255)
LINE = (230, 0, 230)

# name -> (cols, rows, cell px, baseline px from cell bottom, note)
STANDARD = {
    "chars_4x4_256": (4, 4, 256, 16, "characters: 16 cells, 64px frames at pitch 4"),
    "chars_4x3_256": (4, 3, 256, 16, "characters: 12 cells (1024x768, classic_4_3)"),
    "chars_4x2_256": (4, 2, 256, 16, "characters: 8 cells (1024x512, horizontal_2_1)"),
    "props_8x8_128": (8, 8, 128, 8, "props: 64 cells of 32px at pitch 4"),
    "props_4x4_256": (4, 4, 256, 16, "big props: 16 cells of 64px"),
    "tiles_8x8_128": (8, 8, 128, 0, "tiles: 64 cells of 32px, no baseline"),
}


def render(cols: int, rows: int, cell: int, baseline: int, line_w: int = 2) -> Image.Image:
    w, h = cols * cell, rows * cell
    img = Image.new("RGB", (w, h), FILL)
    d = ImageDraw.Draw(img)
    for c in range(cols + 1):
        x = min(w - line_w, c * cell)
        d.rectangle([x, 0, x + line_w - 1, h - 1], fill=LINE)
    for r in range(rows + 1):
        y = min(h - line_w, r * cell)
        d.rectangle([0, y, w - 1, y + line_w - 1], fill=LINE)
    if baseline > 0:
        for r in range(rows):
            y = (r + 1) * cell - baseline
            for c in range(cols):
                x0 = c * cell + cell // 6
                x1 = (c + 1) * cell - cell // 6
                d.rectangle([x0, y, x1, y], fill=LINE)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cols", type=int)
    ap.add_argument("--rows", type=int)
    ap.add_argument("--cell", type=int, default=256)
    ap.add_argument("--baseline", type=int, default=16)
    ap.add_argument("--out")
    args = ap.parse_args()
    px.ensure_dir(TEMPLATE_DIR)
    if args.cols and args.rows:
        img = render(args.cols, args.rows, args.cell, args.baseline)
        out = Path(args.out) if args.out else TEMPLATE_DIR / f"grid_{args.cols}x{args.rows}_{args.cell}.png"
        img.save(out)
        meta = {"cols": args.cols, "rows": args.rows, "cell": args.cell, "baseline": args.baseline}
        out.with_suffix(".json").write_text(json.dumps(meta), encoding="utf-8")
        print(f"wrote {out} {img.size}")
        return
    for name, (cols, rows, cell, baseline, note) in STANDARD.items():
        img = render(cols, rows, cell, baseline)
        out = TEMPLATE_DIR / f"{name}.png"
        img.save(out)
        out.with_suffix(".json").write_text(json.dumps(
            {"cols": cols, "rows": rows, "cell": cell, "baseline": baseline, "note": note}), encoding="utf-8")
        print(f"wrote {out.name} {img.size}  # {note}")


if __name__ == "__main__":
    main()
