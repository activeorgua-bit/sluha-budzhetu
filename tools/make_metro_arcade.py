"""Zoloti Vorota arcade: 8 tileable bays (props zv_bay_1..8) + a chandelier that hangs from the arch.

The two generated strips (m1_arcade_a / m1_arcade_b) are flat front elevations with the same
geometry: 4 pillars ~645 px apart. Cutting them blindly at quarters gave bays whose arches did not
meet. Now:
  1. ONE canonical bay: the half from an inner pillar's centre to the arch apex (half the pillar
     spacing), mirrored, so both bay edges are exactly at an arch apex -> any bay fits any bay.
  2. The 8 mosaic panels (4 per strip) are measured and pasted into the canonical bay.
  3. Above the panel the transverse arch band (ochre bricks + blue mosaic with red rosettes) rises
     into the vault, which darkens in flat steps towards the top: a ceiling, not an endless wall.
  4. zv_chandelier: the ring chandelier with its chain lengthened to reach the arch apex.

  python tools/make_metro_arcade.py
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets_src" / "raw"
OUT = ROOT / "assets_src" / "frames" / "props"
STRIPS = [("m1_arcade_a", 1), ("m1_arcade_b", 5)]
BAY_W = 288            # 6 tiles
FULL_H = 672           # floor (row 14) to the top of the level
CHANDELIER_ROW_BOTTOM = 11 * 48   # the chandelier's bottom in world px (decor row 10)


def light(p):
    r, g, b = int(p[0]), int(p[1]), int(p[2])
    return r > 200 and g > 185 and b > 140 and max(r, g, b) - min(r, g, b) < 60


def pillar_centres(al):
    y = al.shape[0] - 60
    row, runs, s = al[y], [], None
    for x in range(len(row)):
        if row[x] and s is None:
            s = x
        if not row[x] and s is not None:
            runs.append((s, x)); s = None
    if s is not None:
        runs.append((s, len(row)))
    return [(a + b) // 2 for a, b in runs if b - a > 150]


def panel_rect(a, c):
    """(x0, y0, x1, y1) of the mosaic panel above the pillar centred at c (source pixels)."""
    orange = (a[..., 0] > 170) & (a[..., 1] > 90) & (a[..., 1] < 200) & (a[..., 2] < 110) & (a[..., 3] > 0)
    band = orange[60:330, max(0, c - 220):c + 220]
    ys, xs = np.where(band)
    x0, x1 = xs.min() + max(0, c - 220), xs.max() + max(0, c - 220)
    y0 = ys.min() + 60
    pw = x1 - x0
    # the capital: the first row below the panel where a light run through c is clearly wider than the panel
    y1 = None
    for y in range(y0 + 80, a.shape[0] - 40):
        if not light(a[y, c]):
            continue
        l = c
        while l > 0 and light(a[y, l]):
            l -= 1
        r = c
        while r < a.shape[1] - 1 and light(a[y, r]):
            r += 1
        if r - l > 1.25 * pw:
            y1 = y
            break
    return x0 - 6, y0 - 6, x1 + 7, y1


def main():
    palette = px.load_palette()
    OUT.mkdir(parents=True, exist_ok=True)
    strips = {}
    for asset, first in STRIPS:
        src = RAW / asset / "v001.png"
        if not src.exists():
            print(f"[skip] {src} missing"); return
        strips[asset] = (np.array(px.key_magenta(Image.open(src).convert("RGBA"))), first)

    # 1. canonical bay from strip B, pillar 3
    a, _ = strips["m1_arcade_b"]
    cs = pillar_centres(a[..., 3] > 0)
    spacing = int(round(np.mean(np.diff(cs))))
    c = cs[2]
    half = spacing // 2
    left = a[:, c - half:c]
    canon = np.concatenate([left, left[:, ::-1]], axis=1)          # (h, 2*half)
    cpx = half                                                      # pillar centre in the canonical bay
    crect = panel_rect(a, c)
    cx0, cy0, cx1, cy1 = crect[0] - (c - half), crect[1], crect[2] - (c - half), crect[3]
    print(f"spacing {spacing}, canonical panel {cx0},{cy0}-{cx1},{cy1}")

    made = []
    for asset, (arr, first) in strips.items():
        for k, pc in enumerate(pillar_centres(arr[..., 3] > 0)):
            x0, y0, x1, y1 = panel_rect(arr, pc)
            panel = Image.fromarray(arr[y0:y1, x0:x1], "RGBA").resize((cx1 - cx0, cy1 - cy0), Image.NEAREST)
            bay = canon.copy()
            bay[cy0:cy1, cx0:cx1] = np.array(panel)
            img = Image.fromarray(bay, "RGBA")
            h = round(img.height * BAY_W / img.width)
            img = px.binarize_alpha(px.quantize(img.resize((BAY_W, h), Image.BOX), palette))
            b = np.array(img)
            s = BAY_W / canon.shape[1]
            ptop = int(cy0 * s)
            pl, pr = int(cx0 * s), int(cx1 * s)
            b = add_vault(b, ptop, pl, pr)
            name = f"zv_bay_{first + k}"
            Image.fromarray(b, "RGBA").save(OUT / f"{name}.png")
            made.append(name)
    print("arcade bays:", made)
    make_chandelier(np.array(Image.open(OUT / f"{made[0]}.png")))


def add_vault(b, ptop, pl, pr):
    """Extend the bay upward to FULL_H: the transverse arch band rises from the panel into a vault
    that darkens in flat steps towards the top (a ceiling)."""
    h, w = b.shape[:2]
    pad = FULL_H - h
    if pad <= 0:
        return b[h - FULL_H:]
    wall = b[4:10].reshape(-1, 4)
    wall = wall[wall[:, 3] > 0]
    base = np.median(wall, axis=0).astype(np.uint8) if len(wall) else np.array([240, 236, 226, 255], np.uint8)
    top = np.zeros((pad, w, 4), np.uint8)
    top[:] = base
    # the vault curves away: 3 flat steps, darker towards the crown
    for i, f in enumerate((0.93, 0.87, 0.81)):
        y1 = int(pad * (0.34 - i * 0.11))
        top[:max(0, y1)] = (base[:3] * f).astype(np.uint8).tolist() + [255]
    # the transverse arch band rising from the panel (ochre brick edges, blue mosaic, red rosettes)
    OCH, OCH2, BLUE, RED, GOLD, OUT_ = (206, 150, 70), (166, 110, 48), (52, 92, 160), (182, 50, 40), (226, 182, 86), (40, 30, 26)
    bw = int((pr - pl) * 0.86)
    x0 = (w - bw) // 2
    rows = pad + ptop
    col = np.concatenate([top, b[:ptop]], axis=0)[:rows]
    for y in range(rows):
        col[y, x0:x0 + bw, :3] = BLUE
        col[y, x0:x0 + 8, :3] = OCH; col[y, x0 + bw - 8:x0 + bw, :3] = OCH
        col[y, x0 + 2:x0 + 4, :3] = OCH2; col[y, x0 + bw - 4:x0 + bw - 2, :3] = OCH2
        col[y, x0, :3] = OUT_; col[y, x0 + bw - 1, :3] = OUT_
        if y % 12 == 0:                      # brick joints
            col[y, x0 + 1:x0 + 8, :3] = OCH2; col[y, x0 + bw - 8:x0 + bw - 1, :3] = OCH2
    cx = w // 2
    for y in range(18, rows - 18, 36):       # rosettes
        for dy in range(-7, 8):
            for dx in range(-7, 8):
                d = dx * dx + dy * dy
                if d <= 49:
                    col[y + dy, cx + dx, :3] = GOLD if d > 25 else (RED if d > 4 else GOLD)
    col[..., 3] = 255
    return np.concatenate([col, b[ptop:]], axis=0)[-FULL_H:]


def make_chandelier(bay):
    """The ring chandelier with a chain long enough to reach the arch apex (the bay edge)."""
    src = Image.open(OUT / "kyiv_chandelier.png").convert("RGBA")
    a = np.array(src)
    ys, xs = np.where(a[..., 3] > 0)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    # the arch apex: first see-through row from the top at the bay's edge column
    al = bay[..., 3]
    apex = next(y for y in range(200, FULL_H) if al[y, 1] == 0)
    need = CHANDELIER_ROW_BOTTOM - apex             # the chandelier's full height in px
    h, w = a.shape[:2]
    cx = w // 2
    chain_rows = a[:max(6, h // 5)]                  # the top of the sprite: the chain
    link = chain_rows[:, cx - 4:cx + 5]
    extra = max(0, need - h)
    out = np.zeros((h + extra, w, 4), np.uint8)
    for y in range(0, extra, len(link)):
        seg = link[:min(len(link), extra - y)]
        out[y:y + len(seg), cx - 4:cx + 5] = seg
    out[extra:] = a
    Image.fromarray(out, "RGBA").save(OUT / "zv_chandelier.png")
    print(f"zv_chandelier: apex y {apex}, height {out.shape[0]} (chain +{extra})")


if __name__ == "__main__":
    main()
