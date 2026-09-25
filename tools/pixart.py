"""Shared pixel-art helpers for the asset pipeline (slice, pixelize, pack).

All functions work on Pillow RGBA images and numpy arrays. No Phaser-specific code here.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
REF_DIR = ROOT / "assets_src" / "reference"
FRAMES_DIR = ROOT / "assets_src" / "frames"
RAW_DIR = ROOT / "assets_src" / "raw"
REVIEW_DIR = ROOT / "assets_src" / "review"
PUBLIC_ASSETS = ROOT / "public" / "assets"

FRAME = 96        # character frame size (v2: 96, legacy 64)
BASELINE = 90     # feet row inside the character frame
TILE = 48

MAGENTA = (255, 0, 255)
CREAM = (243, 234, 219)


# ---------------------------------------------------------------- palette
def load_palette(path: Path | None = None) -> list[tuple[int, int, int]]:
    path = path or (REF_DIR / "palette.json")
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    out = []
    for group in data["groups"]:
        for hx in group["colors"]:
            out.append(hex_to_rgb(hx))
    return out


def hex_to_rgb(hx: str) -> tuple[int, int, int]:
    hx = hx.lstrip("#")
    return tuple(int(hx[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb) -> str:
    return "#{:02X}{:02X}{:02X}".format(*[int(c) for c in rgb[:3]])


def quantize(img: Image.Image, palette: list[tuple[int, int, int]]) -> Image.Image:
    """Snap every opaque pixel to the nearest palette colour (no dithering)."""
    arr = np.array(img.convert("RGBA")).astype(np.int32)
    rgb = arr[..., :3]
    alpha = arr[..., 3]
    pal = np.array(palette, dtype=np.int32)  # (P,3)
    flat = rgb.reshape(-1, 3)
    idx = np.empty(flat.shape[0], dtype=np.int64)
    step = 65536
    for s in range(0, flat.shape[0], step):
        chunk = flat[s:s + step]
        d = ((chunk[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
        idx[s:s + step] = d.argmin(axis=1)
    snapped = pal[idx].reshape(rgb.shape)
    out = arr.copy()
    mask = alpha > 0
    out[..., :3][mask] = snapped[mask]
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def palette_compliance(img: Image.Image, palette, tol: float = 24.0) -> float:
    """Fraction of opaque pixels whose RGB is within tol (euclidean) of a palette colour."""
    arr = np.array(img.convert("RGBA")).astype(np.int32)
    mask = arr[..., 3] > 127
    if mask.sum() == 0:
        return 0.0
    rgb = arr[..., :3][mask]
    pal = np.array(palette, dtype=np.int32)
    d = np.sqrt(((rgb[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)).min(axis=1)
    return float((d <= tol).mean())


# ---------------------------------------------------------------- keying
def key_color(img: Image.Image, color, tol: float = 36.0, soft: float = 0.0) -> Image.Image:
    """Make pixels within tol of color transparent (optionally with a soft ramp)."""
    arr = np.array(img.convert("RGBA")).astype(np.float32)
    d = np.sqrt(((arr[..., :3] - np.array(color, dtype=np.float32)) ** 2).sum(axis=2))
    alpha = arr[..., 3]
    if soft > 0:
        ramp = np.clip((d - tol) / soft, 0, 1)
        alpha = np.minimum(alpha, ramp * 255)
    else:
        alpha = np.where(d <= tol, 0, alpha)
    arr[..., 3] = alpha
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def key_colors(img: Image.Image, colors, tol: float = 34.0) -> Image.Image:
    """Make pixels near ANY of the given colours transparent (e.g. sky + water behind a prop)."""
    arr = np.array(img.convert("RGBA")).astype(np.float32)
    cols = np.array(colors, dtype=np.float32)
    rgb = arr[..., :3].reshape(-1, 3)
    d = np.sqrt(((rgb[:, None, :] - cols[None, :, :]) ** 2).sum(axis=2)).min(axis=1).reshape(arr.shape[:2])
    arr[..., 3] = np.where(d <= tol, 0, arr[..., 3])
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def key_magenta(img: Image.Image, sat_min: float = 0.45) -> Image.Image:
    """Remove magenta chroma (any shade: #FF00FF, #E600E6, ...) using HSV; despill edges."""
    rgba = np.array(img.convert("RGBA")).astype(np.float32)
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    magenta_like = (r > 120) & (b > 120) & (g < 0.55 * np.minimum(r, b)) & (sat > sat_min)
    alpha = rgba[..., 3].copy()
    alpha[magenta_like] = 0
    spill = (~magenta_like) & (r > g + 40) & (b > g + 40) & (alpha > 0)
    rgba[..., 1][spill] = np.minimum(255, rgba[..., 1][spill] + 0.5 * (np.minimum(r, b)[spill] - g[spill]))
    rgba[..., 3] = alpha
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def defringe(img: Image.Image, radius: int = 1, dark_max: int = 120) -> Image.Image:
    """Remove the light halo left by keying: erode the opaque mask by `radius` and give back only
    those edge pixels that are genuinely dark (the 1-px outline). Run at source resolution."""
    from scipy import ndimage
    arr = np.array(img.convert("RGBA"))
    mask = arr[..., 3] > 127
    if not mask.any():
        return img
    eroded = ndimage.binary_erosion(mask, iterations=radius, border_value=0)
    ring = mask & ~eroded
    rgb = arr[..., :3].astype(np.int32)
    dark = rgb.max(axis=2) < dark_max
    keep = eroded | (ring & dark)
    arr[..., 3] = np.where(keep, 255, 0)
    return Image.fromarray(arr, "RGBA")


def clean_edge_specks(img: Image.Image, bright: int = 190) -> Image.Image:
    """Drop isolated bright pixels on the silhouette edge (keyed-background leftovers) while keeping
    contiguous light areas such as shirt cuffs. Works at frame resolution."""
    from scipy import ndimage
    arr = np.array(img.convert("RGBA"))
    mask = arr[..., 3] > 127
    if not mask.any():
        return img
    edge = mask & ~ndimage.binary_erosion(mask, border_value=0)
    rgb = arr[..., :3].astype(np.int32)
    light = mask & (rgb.max(axis=2) >= bright) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 60)
    # count light 4-neighbours
    k = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]])
    n_light = ndimage.convolve(light.astype(np.int32), k, mode="constant")
    specks = edge & light & (n_light <= 1)
    arr[..., 3] = np.where(specks, 0, arr[..., 3])
    return Image.fromarray(arr, "RGBA")


def binarize_alpha(img: Image.Image, threshold: int = 128) -> Image.Image:
    arr = np.array(img.convert("RGBA"))
    arr[..., 3] = np.where(arr[..., 3] >= threshold, 255, 0)
    return Image.fromarray(arr, "RGBA")


# ---------------------------------------------------------------- components
def components(mask: np.ndarray):
    """Label 8-connected components. Returns (labels, n)."""
    from scipy import ndimage
    structure = np.ones((3, 3), dtype=int)
    labels, n = ndimage.label(mask, structure=structure)
    return labels, n


def component_boxes(mask: np.ndarray):
    """[(label, (x0,y0,x1,y1), area)] for each component of a boolean mask."""
    from scipy import ndimage
    labels, n = components(mask)
    out = []
    objs = ndimage.find_objects(labels)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        ys, xs = sl
        area = int((labels[sl] == i).sum())
        out.append((i, (xs.start, ys.start, xs.stop, ys.stop), area))
    return labels, out


def keep_components(img: Image.Image, min_area: int = 30, drop_below_y: int | None = None,
                    drop_text_like: bool = True) -> Image.Image:
    """Keep meaningful components of an RGBA sprite crop; drop specks and label text."""
    arr = np.array(img.convert("RGBA"))
    mask = arr[..., 3] > 0
    labels, boxes = component_boxes(mask)
    keep = np.zeros_like(mask)
    h, w = mask.shape
    for lab, (x0, y0, x1, y1), area in boxes:
        bw, bh = x1 - x0, y1 - y0
        if area < min_area:
            continue
        if drop_below_y is not None and y0 >= drop_below_y:
            continue
        if drop_text_like and bh <= 16 and bw >= 2.5 * bh and (y0 > h * 0.6 or y1 < h * 0.3):
            continue  # short, wide, near the bottom or top edge: a caption
        if drop_text_like and bh <= 16 and area < 0.55 * bw * bh and (y0 > h * 0.6 or y1 < h * 0.3):
            continue  # sparse strip (letters)
        keep |= labels == lab
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr, "RGBA")


def trim(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


# ---------------------------------------------------------------- resampling
def detect_pixel_pitch(img: Image.Image, max_pitch: int = 12) -> float:
    """Estimate the native art-pixel size of an AI pixel-art image from horizontal run lengths."""
    arr = np.array(img.convert("RGBA"))
    mask = arr[..., 3] > 127
    rgb = arr[..., :3].astype(np.int32)
    runs = []
    h, w = mask.shape
    for y in range(0, h, max(1, h // 200)):
        row = rgb[y]
        m = mask[y]
        run = 1
        for x in range(1, w):
            same = m[x] and m[x - 1] and (np.abs(row[x] - row[x - 1]).sum() < 40)
            if same:
                run += 1
            else:
                if m[x - 1] and 1 <= run <= max_pitch:
                    runs.append(run)
                run = 1
    if not runs:
        return 1.0
    hist = np.bincount(runs)
    hist[0] = 0
    if hist.size > 2 and hist[2:].max() > 0.5 * hist[1]:
        hist[1] = 0
    return float(hist.argmax())


def resample_to_height(img: Image.Image, target_h: int, max_w: int | None = None,
                       method: str = "nearest") -> Image.Image:
    """Scale a trimmed sprite so its height == target_h (or width <= max_w), keeping aspect."""
    w, h = img.size
    scale = target_h / h
    if max_w is not None and w * scale > max_w:
        scale = max_w / w
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    if method == "nearest":
        return img.resize((nw, nh), Image.NEAREST)
    if method == "box":
        return img.resize((nw, nh), Image.BOX)
    return img.resize((nw, nh), Image.LANCZOS)


def place_in_frame(img: Image.Image, frame_w: int, frame_h: int, baseline: int,
                   anchor: str = "feet") -> Image.Image:
    """Paste a sprite centred horizontally with its bottom row on baseline (feet) or centred."""
    out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    w, h = img.size
    x = (frame_w - w) // 2
    y = baseline - h if anchor == "feet" else (frame_h - h) // 2
    out.paste(img, (x, y), img)
    return out


def make_frame(sprite: Image.Image, frame_w: int, frame_h: int, *, target_h: int, baseline: int,
               palette=None, method: str = "nearest", anchor: str = "feet",
               max_w: int | None = None) -> Image.Image:
    """Full path: trim -> defringe -> resample -> quantize -> binarize alpha -> place in frame."""
    s = defringe(trim(sprite), radius=1)
    s = resample_to_height(trim(s), target_h, max_w=max_w or frame_w - 2, method=method)
    if palette:
        s = quantize(s, palette)
    s = trim(clean_edge_specks(binarize_alpha(s)))
    return place_in_frame(s, frame_w, frame_h, baseline, anchor)


# ---------------------------------------------------------------- metrics
@dataclass
class SpriteMetrics:
    width: int
    height: int
    head_ratio: float
    outline_ratio: float
    palette_compliance: float
    pitch: float


def measure_sprite(frame: Image.Image, palette, dark_threshold: int = 70) -> SpriteMetrics:
    arr = np.array(frame.convert("RGBA"))
    mask = arr[..., 3] > 127
    if not mask.any():
        return SpriteMetrics(0, 0, 0, 0, 0, 0)
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    h, w = y1 - y0 + 1, x1 - x0 + 1
    # head ratio: widest row in the upper 60% is the head; the chin is the first row below it
    # where the width drops under 70% of that maximum (the neck). Chibi sprites: ~0.4-0.55.
    prof = mask[y0:y1 + 1].sum(axis=1)
    top = prof[: max(1, int(h * 0.6))]
    head_peak = int(top.argmax())
    chin = h
    for i in range(head_peak, h):
        if prof[i] < 0.7 * top[head_peak]:
            chin = i
            break
    head_ratio = chin / h if h else 0
    from scipy import ndimage
    eroded = ndimage.binary_erosion(mask)
    edge = mask & ~eroded
    rgb = arr[..., :3].astype(np.int32)
    dark = rgb.sum(axis=2) < dark_threshold * 3
    outline_ratio = float((edge & dark).sum() / max(1, edge.sum()))
    return SpriteMetrics(int(w), int(h), float(head_ratio), outline_ratio,
                         palette_compliance(frame, palette) if palette else 0.0,
                         detect_pixel_pitch(frame))


# ---------------------------------------------------------------- review sheets
def contact_sheet(items, cols: int = 8, scale: int = 3, pad: int = 8, bg=(40, 40, 48),
                  label_font_size: int = 11) -> Image.Image:
    """items: list of (label, PIL image). Returns one image with labels."""
    if not items:
        return Image.new("RGBA", (64, 64), bg)
    cell_w = max(im.width for _, im in items) * scale + pad * 2
    cell_h = max(im.height for _, im in items) * scale + pad * 2 + 14
    rows = math.ceil(len(items) / cols)
    sheet = Image.new("RGBA", (cell_w * cols, cell_h * rows), bg + (255,))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", label_font_size)
    except Exception:
        font = ImageFont.load_default()
    for i, (label, im) in enumerate(items):
        cx = (i % cols) * cell_w + pad
        cy = (i // cols) * cell_h + pad
        big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        chk = Image.new("RGBA", big.size, (90, 90, 100, 255))
        d = ImageDraw.Draw(chk)
        for yy in range(0, big.height, 8):
            for xx in range(0, big.width, 8):
                if (xx // 8 + yy // 8) % 2 == 0:
                    d.rectangle([xx, yy, xx + 7, yy + 7], fill=(110, 110, 122, 255))
        chk.alpha_composite(big)
        sheet.paste(chk, (cx, cy))
        draw.text((cx, cy + big.height + 2), label[:28], fill=(230, 230, 230, 255), font=font)
    return sheet


def ensure_dir(p: Path) -> Path:
    p.mkdir(parents=True, exist_ok=True)
    return p
