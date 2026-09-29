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
  5. The shafts lose one stone course (mortar line to mortar line): the floor sits higher on screen,
     clear of the narration page, while the mosaics stay below the HUD.
  6. zv_bay_end: the hall's first pier. Its left half-arch would end in a hard vertical cut, so the
     piece stops at the capital slab and the wall above it is plain: the arcade starts at a wall.

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
PANEL_SCALE = 1.0     # full-size mosaics, in one piece with their ornament frame
SHAFT_SCALE = 0.8     # pillar shafts a little narrower than generated (the capitals keep their width)


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
    canon = narrow_shaft(canon, cpx)
    crect = panel_rect(a, c)
    cx0, cy0, cx1, cy1 = crect[0] - (c - half), crect[1], crect[2] - (c - half), crect[3]
    print(f"spacing {spacing}, canonical panel {cx0},{cy0}-{cx1},{cy1}")

    made = []
    for asset, (arr, first) in strips.items():
        for k, pc in enumerate(pillar_centres(arr[..., 3] > 0)):
            x0, y0, x1, y1 = panel_rect(arr, pc)
            # the mosaic at PANEL_SCALE of the full panel, standing on the capital, centred: the faces
            # come down out of the HUD's way; the freed space is plain vault wall
            pw, ph = round((cx1 - cx0) * PANEL_SCALE), round((cy1 - cy0) * PANEL_SCALE)
            panel = Image.fromarray(arr[y0:y1, x0:x1], "RGBA").resize((pw, ph), Image.NEAREST)
            bay = canon.copy()
            bay[cy0:cy1, cx0:cx1] = wall_colour(canon)
            px0 = cx0 + ((cx1 - cx0) - pw) // 2
            py0 = cy1 - ph
            bay[py0:cy1, px0:px0 + pw] = np.array(panel)
            img = Image.fromarray(bay, "RGBA")
            h = round(img.height * BAY_W / img.width)
            img = px.binarize_alpha(px.quantize(img.resize((BAY_W, h), Image.BOX), palette))
            b = cut_course(np.array(img))
            s = BAY_W / canon.shape[1]
            ptop = int(py0 * s)
            pl, pr = int(px0 * s), int((px0 + pw) * s)
            b = add_vault(b, ptop, pl, pr)
            name = f"zv_bay_{first + k}"
            Image.fromarray(b, "RGBA").save(OUT / f"{name}.png")
            made.append(name)
    print("arcade bays:", made)
    # the hall opens with just the ornamental half-arch: the end wall carries no mosaic panel
    bay = canon.copy()
    bay[cy0:cy1, cx0:cx1] = wall_colour(canon)
    img = Image.fromarray(bay, "RGBA")
    img = px.binarize_alpha(px.quantize(img.resize((BAY_W, round(img.height * BAY_W / img.width)), Image.BOX), palette))
    empty = add_vault(cut_course(np.array(img)), int(cy0 * s), pl, pr, band=False)
    make_end(empty, int(cx0 * s), int(cx1 * s))
    make_chandelier(np.array(Image.open(OUT / f"{made[0]}.png")))


def narrow_shaft(bay, c):
    """Squeeze the pillar shaft (below the capital) to SHAFT_SCALE of its width, around its centre."""
    al = bay[..., 3] > 0
    y = bay.shape[0] - 60
    l = c
    while l > 0 and al[y, l]:
        l -= 1
    r = c
    while r < bay.shape[1] - 1 and al[y, r]:
        r += 1
    w = r - l
    # the capital: going up from the floor, the first row where the opaque run is clearly wider than the shaft
    cap = y
    for yy in range(y, 0, -1):
        ll = c
        while ll > 0 and al[yy, ll]:
            ll -= 1
        rr = c
        while rr < bay.shape[1] - 1 and al[yy, rr]:
            rr += 1
        if rr - ll > w * 1.03:        # the whole corbel stays; only the plain shaft below is narrowed
            cap = yy + 1
            break
    shaft = Image.fromarray(bay[cap:, l:r], "RGBA")
    nw = int(w * SHAFT_SCALE)
    shaft = shaft.resize((nw, shaft.height), Image.NEAREST)
    out = bay.copy()
    out[cap:, l:r] = 0
    x0 = c - nw // 2
    out[cap:, x0:x0 + nw] = np.array(shaft)
    return out


def run_left(al, y, c):
    l = c
    while l > 0 and al[y, l]:
        l -= 1
    return l


def cut_course(b):
    """Remove one stone course from the pillar shaft (from a mortar line to the next)."""
    h, w = b.shape[:2]
    c = w // 2
    al = b[..., 3] > 0
    shaft_l = run_left(al, h - 30, c)
    top = next(y for y in range(h - 30, 0, -1) if run_left(al, y, c) != shaft_l) + 1
    lum = b[:, c - 30:c + 30, :3].astype(int).mean(axis=2).mean(axis=1)
    mortar = [y for y in range(top + 8, h - 30) if lum[y] < 170 and lum[y - 1] >= 170]
    m1, m2 = next((a, b2) for a, b2 in zip(mortar, mortar[1:]) if b2 - a >= 20)
    return np.delete(b, range(m1, m2), axis=0)


def make_end(bay, pl, pr):
    """The first pier of the hall: the pillar rises as masonry above its capital up to the vault (no
    mosaic, no left arch); the right half-arch springs from the capital."""
    b = bay.copy()
    h, w = b.shape[:2]
    c = w // 2
    al = b[..., 3] > 0
    xw = run_left(al, h - 40, c) + 1                        # the wall rises straight up from the shaft
    ls = [(y, run_left(al, y, c)) for y in range(h - 30, 0, -1)]
    ls = [(y, l) for y, l in ls if l > 0]
    # the slab: the longest run of rows with the same left edge above the shaft (the shaft is the first run)
    runs, cur = [], [ls[0]]
    for y, l in ls[1:]:
        if l == cur[-1][1]:
            cur.append((y, l))
        else:
            runs.append(cur); cur = [(y, l)]
    runs.append(cur)
    slab = max(runs[1:], key=len)
    x0, slab_top, slab_bot = slab[0][1] + 1, slab[-1][0], slab[0][0]
    wall = np.zeros((h, w), bool)
    # above the slab: everything left of the mosaic (the left arch and its spandrel)
    # above the slab: the left arch and its spandrel, and the empty panel field up to the right arch
    rgb = b[..., :3].astype(int)
    neutral = (rgb.max(axis=2) - rgb.min(axis=2) < 30) & (rgb.mean(axis=2) > 170) & al
    wall[:slab_top, xw:pl] = True
    wall[:slab_top, pl:pr + 3] |= neutral[:slab_top, pl:pr + 3]

    # under the mosaic the plinth stands on the slab; the left arch's foot beside it becomes wall too
    def stone(px):
        r, g, bl = int(px[0]), int(px[1]), int(px[2])
        return r > 200 and g > 175 and bl > 110 and r >= bl
    miss, xp = 0, c - 40
    for y in range(slab_top - 1, 0, -1):
        if sum(stone(b[y, x]) for x in range(c - 40, c + 40)) < 50:
            miss += 1                                       # an outline / mortar row, or the mosaic's frame
            if miss > 3:
                break
        else:
            miss, xp = 0, c - 40
            while xp > x0 and (stone(b[y, xp - 1]) or stone(b[y, xp - 2])):
                xp -= 1
        wall[y, xw:xp - 1] = True
    yb = y + 4                                              # the frame's bottom edge: chamfer its corner
    for yy in range(yb - 22, yb):
        wall[yy, xw:pl + 2 + (yy - (yb - 22)) * 10 // 22] = True
    # below the slab: the see-through arch opening left of the shaft

    # the masonry: the pillar shaft's own stone courses, repeated across and upward
    sl = run_left(al, h - 40, c) + 1
    sr = sl
    while al[h - 40, sr]:
        sr += 1
    tx0, tw = sl + 6, (sr - sl) - 12
    lum = b[:, tx0:tx0 + tw, :3].astype(int).mean(axis=2).mean(axis=1)
    top = slab_bot + 30
    mortar = [y for y in range(top, h - 30) if lum[y] < 170 and lum[y - 1] >= 170]
    period = 2 * int(np.median(np.diff(mortar)))
    m0 = mortar[0]
    ys, xs = np.where(wall)
    sy = np.where(ys >= m0, ys, m0 + (ys - m0) % period)
    sx = tx0 + (xs - xw) % tw
    b[ys, xs] = b[sy, sx]
    b[ys, xs, 3] = 255
    # the capital keeps its own left overhang and bracket; only above it the arch gives way to the pier
    # the wall's edge: an outline and a shaded return
    b[:slab_top, xw, :3] = (40, 30, 26)
    b[:slab_top, xw, 3] = 255
    b[:slab_top, xw + 1:xw + 4, :3] = (b[:slab_top, xw + 1:xw + 4, :3] * 0.82).astype(np.uint8)
    b[:slab_top, :xw] = 0
    Image.fromarray(b, "RGBA").save(OUT / "zv_bay_end.png")
    print(f"zv_bay_end: wall from x {xw}, slab {slab_top}-{slab_bot}")


def wall_colour(canon):
    """The plain vault wall colour (median of the bay's top rows)."""
    top = canon[4:10].reshape(-1, 4)
    top = top[top[:, 3] > 0]
    return np.median(top, axis=0).astype(np.uint8) if len(top) else np.array([240, 236, 226, 255], np.uint8)


def add_vault(b, ptop, pl, pr, band=True):
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
    if not band:
        return np.concatenate([top, b], axis=0)[-FULL_H:]
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
