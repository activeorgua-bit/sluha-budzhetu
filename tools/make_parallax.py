"""Parallax layer helpers: seamless horizontal loop + quantize + resize.

Used by pixelize.py (post.kind == "bg") and as a CLI:
  python tools/make_parallax.py --in raw.png --out public/assets/parallax/l11/far.png --width 960
  python tools/make_parallax.py --check public/assets/parallax/l12/far.png      # seam score only
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402


def seam_score(img: Image.Image) -> float:
    """Mean abs RGB difference between the right and left edge columns (0 = perfect loop)."""
    a = np.array(img.convert("RGB")).astype(int)
    return float(np.abs(a[:, 0] - a[:, -1]).mean())


def make_seamless(img: Image.Image, blend_px: int = 48) -> Image.Image:
    """Roll by half the width and cross-fade the (now centred) seam, then roll back.

    The blend is applied on the original edges: the left `blend_px` columns are blended with the
    columns that will wrap around from the right side so col 0 continues col W-1.
    """
    arr = np.array(img.convert("RGBA")).astype(np.float32)
    h, w = arr.shape[:2]
    blend_px = min(blend_px, w // 4)
    rolled = np.roll(arr, w // 2, axis=1)  # seam now at x = w//2
    c = w // 2
    for i in range(blend_px):
        t = (i + 0.5) / blend_px  # 0 -> left side, 1 -> right side
        xl = c - blend_px + i
        xr = c + i
        left_src = rolled[:, xl]
        right_src = rolled[:, xr]
        # feather both sides toward each other
        rolled[:, xl] = left_src * (1 - t * 0.5) + right_src * (t * 0.5)
        rolled[:, xr] = right_src * (1 - (1 - t) * 0.5) + left_src * ((1 - t) * 0.5)
    out = np.roll(rolled, -(w // 2), axis=1)
    # the cross-fade leaves half-transparent "ghost" copies of roofs and treetops over the sky:
    # pixel art has binary alpha, so anything not fully opaque at the seam is sky
    seam = np.zeros(w, bool); seam[:blend_px] = True; seam[w - blend_px:] = True
    ghost = (out[..., 3] < 255) & seam[None, :]
    out[ghost] = 0
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def key_sky(img: Image.Image, tol: float = 26.0) -> Image.Image:
    """Make the flat sky above a far/mid strip transparent: key the colour of the top rows,
    but only pixels connected to the top edge (so a blue window lower down survives)."""
    from scipy import ndimage
    arr = np.array(img.convert("RGBA")).astype(np.int32)
    top = arr[:6, :, :3].reshape(-1, 3)
    med = np.median(top, axis=0)
    d = np.sqrt(((arr[..., :3] - med) ** 2).sum(axis=2))
    mask = d <= tol
    labels, n = ndimage.label(mask)
    top_labels = set(np.unique(labels[0])) - {0}
    sky = np.isin(labels, list(top_labels))
    arr[..., 3] = np.where(sky, 0, arr[..., 3])
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def crop_bottom_band(img: Image.Image, tol: float = 30.0) -> Image.Image:
    """The model often leaves a flat band of sky colour under a strip's 'flat bottom edge'.
    Remove bottom rows that are mostly that colour (or already transparent)."""
    arr = np.array(img.convert("RGBA")).astype(np.int32)
    top = arr[:6, :, :3].reshape(-1, 3)
    sky = np.median(top, axis=0)
    h = arr.shape[0]
    cut = h
    for y in range(h - 1, h // 2, -1):
        row = arr[y]
        med = np.median(row[:, :3], axis=0)
        uniform = np.sqrt(((row[:, :3] - med) ** 2).sum(axis=1)) <= tol
        near_sky = np.sqrt(((row[:, :3] - sky) ** 2).sum(axis=1)) <= tol
        empty = row[:, 3] == 0
        bluish = med[2] > med[0] + 40
        if (near_sky | empty).mean() > 0.85 or (bluish and uniform.mean() > 0.85):
            cut = y
        else:
            break
    return img.crop((0, 0, img.width, cut)) if cut < h else img


def remove_wires(img: Image.Image, share: float = 0.6, drop: int = 45, max_thick: int = 3) -> Image.Image:
    """Erase thin dark horizontal lines that run across most of a layer (trolleybus wires the model
    likes to paint over facades). In game they read as a rendering bug. A row is a wire row when
    >= `share` of its pixels are darker (RGB sum) by `drop` than both the row 2 above and 2 below;
    up to `max_thick` consecutive rows are replaced by the rows just outside the line."""
    a = np.array(img.convert("RGBA")).astype(int)
    lum = a[..., :3].sum(2)
    H = a.shape[0]
    darker = np.zeros_like(lum, dtype=bool)
    darker[2:H - 2] = (lum[2:H - 2] < lum[:H - 4] - drop) & (lum[2:H - 2] < lum[4:] - drop)
    row_share = darker.mean(1)
    out = a.copy()
    y = 2
    while y < H - 2:
        if row_share[y] >= share:
            t = 1
            while t < max_thick and y + t < H - 2 and row_share[y + t] >= share * 0.7:
                t += 1
            above, below = a[y - 1], a[min(H - 1, y + t)]
            for k in range(t):
                src = above if k < (t + 1) // 2 else below
                mask = darker[y + k] | (lum[y + k] < np.minimum(lum[y - 1], lum[min(H - 1, y + t)]))
                out[y + k][mask] = src[mask]
            y += t
        else:
            y += 1
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def adaptive_quantize(img: Image.Image, colors: int = 64) -> Image.Image:
    """Quantize RGB to `colors` flat colours from the image itself (no dithering); alpha kept binary."""
    rgba = img.convert("RGBA")
    alpha = np.array(rgba)[..., 3]
    q = rgba.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = np.array(q.convert("RGBA"))
    out[..., 3] = np.where(alpha > 127, 255, 0)
    return Image.fromarray(out, "RGBA")


def make_layer(img: Image.Image, width: int = 960, height: int | None = None, palette=None,
               seamless: bool = True, strip_sky: bool = False, crop_bottom: bool = True):
    """Resize to the layer width (keeping aspect unless height given), loop-fix, quantize."""
    scale = width / img.width
    h = height or round(img.height * scale)
    s = img.convert("RGBA").resize((width, h), Image.BOX)
    if strip_sky:
        s = key_sky(s)
        if crop_bottom:   # river layers keep their (bluish) water rows
            s = crop_bottom_band(s)
        s = remove_wires(s)
    stats = {"seam_before": seam_score(s)}
    if seamless and stats["seam_before"] > 6:
        s = make_seamless(s)
    if isinstance(palette, int):
        # adaptive palette: flat pixel-art colours taken from the image itself (keeps vivid hues
        # that the global palette would snap to dull neighbours)
        stats["palette_compliance_raw"] = 1.0
        s = adaptive_quantize(s, palette)
    elif palette:
        stats["palette_compliance_raw"] = px.palette_compliance(s, palette)
        s = px.quantize(s, palette)
    stats["seam_after"] = seam_score(s)
    stats["pass"] = stats["seam_after"] < 18
    return s, stats


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--in", dest="inp")
    ap.add_argument("--out")
    ap.add_argument("--width", type=int, default=960)
    ap.add_argument("--height", type=int)
    ap.add_argument("--no-quantize", action="store_true")
    ap.add_argument("--check")
    args = ap.parse_args()
    if args.check:
        print(f"seam score: {seam_score(Image.open(args.check)):.1f} (< 18 is fine)")
        return
    if not args.inp or not args.out:
        ap.error("--in and --out required")
    palette = None if args.no_quantize else px.load_palette()
    layer, stats = make_layer(Image.open(args.inp), args.width, args.height, palette)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    layer.save(args.out)
    print(args.out, layer.size, stats)


if __name__ == "__main__":
    main()
