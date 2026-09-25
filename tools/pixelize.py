"""Turn generated candidate images into game-ready frames according to the manifest's `post` recipe.

  python tools/pixelize.py                 # process every approved asset (tools/approved.json)
  python tools/pixelize.py --ids id1 id2   # subset
  python tools/pixelize.py --candidate assets_src/raw/<id>/v001.png --id <id> --preview out.png

Recipes (manifest `post.kind`):
  sheet  grid of character/prop cells -> assets_src/frames/<atlas>/<name>.png
  tiles  grid of 32px tiles           -> assets_src/frames/tilesets/<world>/<name>.png
  bg     parallax strip               -> public/assets/parallax/<level>/<layer>.png (seamless)
  card   story card                   -> public/assets/story/<name>.png (960x540)
  single one sprite on magenta        -> assets_src/frames/<atlas>/<name>.png

Every character frame passes the style gates from docs/ART_BIBLE.md (palette compliance before
quantization, pixel pitch, height, outline) and the results are written next to the frames.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import yaml
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

MANIFEST = px.ROOT / "tools" / "manifest.yaml"
APPROVED = px.ROOT / "tools" / "approved.json"
TEMPLATES = px.ROOT / "assets_src" / "templates"

GATES = {
    "palette_min": 0.80,      # fraction of pixels within tolerance of the palette, before quantize
                              # (canonical sprites score 0.89-0.94; new materials such as police
                              #  blue bands or cash green sit just under that and snap on quantize)
    "height_min": 48, "height_max": 60,  # character height in the 64 frame (canonical: 56)
    "outline_min": 0.40,      # dark-outline share of the silhouette edge (canonical: 0.47-0.79)
}


def load_manifest():
    return yaml.safe_load(MANIFEST.read_text(encoding="utf-8"))


def load_approved():
    return json.loads(APPROVED.read_text(encoding="utf-8")) if APPROVED.exists() else {}


def asset_by_id(manifest, aid):
    for a in manifest["assets"]:
        if a["id"] == aid:
            return a
    raise KeyError(aid)


def template_meta(name):
    meta = json.loads((TEMPLATES / f"{name}.json").read_text(encoding="utf-8"))
    return meta


# --------------------------------------------------------------------------- cell slicing
def grid_cells(img: Image.Image, cols: int, rows: int):
    """Yield (index, cell image) for a generated sheet, tolerating small size drift."""
    w, h = img.size
    cw, ch = w / cols, h / rows
    for r in range(rows):
        for c in range(cols):
            box = (round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))
            yield r * cols + c, img.crop(box)


def component_cells(img: Image.Image, expected: int, merge_px: int = 18, pad: int = 12):
    """Slice a sheet by objects instead of by ruler (for sheets where the model drifted off the grid).
    Pieces closer than `merge_px` are merged (flag + pole, coin + sparkle), tiny specks are dropped,
    objects are grouped into rows by vertical centre and returned in reading order as cell crops."""
    from scipy import ndimage
    keyed = px.key_magenta(img.convert("RGBA"))
    mask = np.array(keyed)[..., 3] > 100
    grown = ndimage.binary_dilation(mask, iterations=merge_px)
    labels, n = ndimage.label(grown)
    objs = []
    for i, sl in enumerate(ndimage.find_objects(labels), start=1):
        ys, xs = sl
        area = int((mask[sl] & (labels[sl] == i)).sum())
        if area < 400:
            continue
        objs.append([xs.start, ys.start, xs.stop, ys.stop, area])
    # keep the `expected` biggest objects, then order them into rows
    objs = sorted(objs, key=lambda o: -o[4])[:expected]
    objs.sort(key=lambda o: (o[1] + o[3]) / 2)
    rows, cur = [], []
    for o in objs:
        cy = (o[1] + o[3]) / 2
        if cur and cy - (cur[-1][1] + cur[-1][3]) / 2 > (o[3] - o[1]) * 0.6 and cy - np.mean([(c[1] + c[3]) / 2 for c in cur]) > 60:
            rows.append(cur); cur = []
        cur.append(o)
    if cur:
        rows.append(cur)
    out = []
    W, H = img.size
    for r in rows:
        for o in sorted(r, key=lambda o: o[0]):
            box = (max(0, o[0] - pad + merge_px), max(0, o[1] - pad + merge_px),
                   min(W, o[2] + pad - merge_px), min(H, o[3] + pad - merge_px))
            crop = Image.new("RGBA", (box[2] - box[0] + 2 * pad, box[3] - box[1] + 2 * pad), (255, 0, 255, 255))
            crop.paste(img.crop(box).convert("RGBA"), (pad, pad))
            out.append(crop)
    return list(enumerate(out))


def clean_cell(cell: Image.Image, min_area: int = 40) -> Image.Image:
    """Key magenta, drop specks and grid remnants, keep the biggest cluster of components."""
    c = px.key_magenta(cell.convert("RGBA"))
    c = px.binarize_alpha(c, 100)
    arr = np.array(c)
    mask = arr[..., 3] > 0
    labels, boxes = px.component_boxes(mask)
    if not boxes:
        return px.trim(c)
    # keep components whose area is at least 3% of the largest (drops crumbs, keeps a mic/hat)
    largest = max(b[2] for b in boxes)
    main_box = next(b for _, b, a in boxes if a == largest)
    keep = np.zeros_like(mask)
    for lab, box, area in boxes:
        if area < max(min_area, 0.03 * largest):
            continue
        # detached bits entirely below the body (dust puffs, ground shadows) would inflate the height
        if area < largest and box[1] >= main_box[3] - 2:
            continue
        keep |= labels == lab
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    # generated sheets are drawn at pitch 4: a 2-px erosion removes the blended edge ring and
    # keeps the dark outline (defringe returns dark ring pixels)
    return px.trim(px.defringe(Image.fromarray(arr, "RGBA"), radius=2))


def char_frame_from_cell(cell: Image.Image, palette, frame_h: int, baseline: int, method: str,
                         frame: int = None):
    """Character cell -> frame of height `frame` (64 legacy / 96 v2); sprite `frame_h` tall, feet on `baseline`.
    Wide poses get a frame 4/3 wider (80 / 128)."""
    frame = frame or px.FRAME
    raw = clean_cell(cell)
    stats = {"pitch_raw": px.detect_pixel_pitch(raw)}
    wide = frame * 4 // 3
    s = px.resample_to_height(raw, frame_h, max_w=wide - 2, method=method)
    stats["palette_compliance_raw"] = px.palette_compliance(s, palette)
    s = px.trim(px.clean_edge_specks(px.binarize_alpha(px.quantize(s, palette))))
    fw = frame if s.width <= frame - 2 else wide
    out = px.place_in_frame(s, fw, frame, baseline, "feet")
    m = px.measure_sprite(out, palette)
    stats.update({"width": m.width, "height": m.height, "outline_ratio": m.outline_ratio})
    lo, hi = frame_h - 10, frame_h + 4
    stats["pass"] = (stats["palette_compliance_raw"] >= GATES["palette_min"]
                     and lo <= m.height <= hi and m.outline_ratio >= GATES["outline_min"])
    return out, stats


def prop_frame_from_cell(cell: Image.Image, palette, fw: int, fh: int, anchor: str, method: str,
                         mode: str = "fit"):
    """Prop cell -> fw x fh frame. mode 'fit' keeps aspect inside the box (bottom- or centre-anchored);
    'exact' stretches to the box (blocks, pipes: things that must line up with the 48 px grid)."""
    raw = clean_cell(cell)
    stats = {"pitch_raw": px.detect_pixel_pitch(raw)}
    if mode == "exact":
        s = raw.resize((fw, fh), Image.NEAREST if method == "nearest" else Image.BOX)
    else:
        margin = 0 if max(fw, fh) > 64 else 2
        s = px.resample_to_height(raw, fh - margin, max_w=fw - margin, method=method)
    stats["palette_compliance_raw"] = px.palette_compliance(s, palette)
    s = px.binarize_alpha(px.quantize(s, palette))
    if mode != "exact":
        s = px.trim(px.clean_edge_specks(s))
        frame = px.place_in_frame(s, fw, fh, fh, anchor)
    else:
        frame = s
    stats["pass"] = stats["palette_compliance_raw"] >= GATES["palette_min"] and s.width > 4 and s.height > 4
    return frame, stats


def solidify(arr, passes: int = 6):
    """Fill transparent pixels of a (mostly) solid tile from their opaque 4-neighbours, so the tile
    grid has no see-through seams (the template's grid lines are keyed out with the magenta)."""
    a = arr.copy()
    for _ in range(passes):
        op = a[..., 3] > 0
        if op.all():
            break
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            src = np.roll(np.roll(a, dy, 0), dx, 1)
            sop = np.roll(np.roll(op, dy, 0), dx, 1)
            # no wrap-around from the opposite edge
            if dy == 1: sop[0, :] = False
            if dy == -1: sop[-1, :] = False
            if dx == 1: sop[:, 0] = False
            if dx == -1: sop[:, -1] = False
            fill = (~(a[..., 3] > 0)) & sop
            a[fill] = src[fill]
        a[..., 3] = np.where(a[..., 3] > 0, 255, 0)
    return a


def tile_from_cell(cell: Image.Image, palette, size: int = 32):
    """Whole cell -> one tile (no trimming: partially transparent tiles keep their scale/alpha)."""
    c = px.binarize_alpha(px.key_magenta(cell.convert("RGBA")), 100)
    if c.getbbox() is None or (np.array(c)[..., 3] > 0).mean() < 0.02:
        return None, {"pass": False, "reason": "empty"}
    t = c.resize((size, size), Image.BOX)
    t = px.binarize_alpha(t, 100)
    stats = {"palette_compliance_raw": px.palette_compliance(t, palette)}
    t = px.quantize(t, palette)
    arr = np.array(t)
    if (arr[..., 3] > 0).mean() > 0.97:
        arr[..., 3] = 255        # fully opaque tile: remove keying pinholes
    elif (arr[..., 3] > 0).mean() > 0.8:
        arr = solidify(arr)      # solid ground tile with a keyed grid-line border: close the gaps
    t = Image.fromarray(arr, "RGBA")
    # seam check: left column vs right column, top row vs bottom row
    a = arr[..., :3].astype(int)
    stats["seam_lr"] = float(np.abs(a[:, 0] - a[:, -1]).mean())
    stats["seam_tb"] = float(np.abs(a[0] - a[-1]).mean())
    stats["pass"] = stats["palette_compliance_raw"] >= GATES["palette_min"]
    return t, stats


def degrid(tile: Image.Image, max_w: int = 4, dark: int = 60, share: float = 0.85) -> Image.Image:
    """Remove template grid lines that the model painted along a tile's edges.

    An edge column/row is a grid line when >= `share` of it is near-black. Every line pixel takes the
    colour (or transparency) of the first non-line pixel further inward, so platforms and water
    connect seamlessly and no black box is drawn over the sky. Only for tiles listed in `degrid`:
    solid blocks keep their dark seams, which are part of the style.
    """
    a = np.array(tile.convert("RGBA"))
    n = a.shape[0]
    lum = a[..., :3].astype(int).sum(2) / 3
    is_dark = (a[..., 3] > 0) & (lum < dark)

    opaque = a[..., 3] > 0

    def is_line(sel, ref):
        """sel/ref: index tuples for the edge line and a reference line further inward."""
        if is_dark[sel].mean() >= share:
            return True
        # tinted lines (dark teal on water): much darker than the tile just inside them
        m, r = opaque[sel], opaque[ref]
        if m.mean() < share or r.mean() < share:
            return False
        return lum[sel][m].mean() < 0.72 * lum[ref][r].mean()

    def line_width(at):           # consecutive line columns/rows from an edge
        w = 0
        while w < max_w and is_line(at(w), at(max_w + 2)):
            w += 1
        return w

    out = a.copy()
    s = slice(None)
    w = line_width(lambda k: (s, k))
    for k in range(w): out[:, k] = a[:, w]
    w = line_width(lambda k: (s, n - 1 - k))
    for k in range(w): out[:, n - 1 - k] = a[:, n - 1 - w]
    w = line_width(lambda k: (k, s))
    for k in range(w): out[k, :] = out[w, :]
    w = line_width(lambda k: (n - 1 - k, s))
    for k in range(w): out[n - 1 - k, :] = out[n - 1 - w, :]
    return Image.fromarray(out, "RGBA")


# --------------------------------------------------------------------------- recipes
LEGACY_SCALE = 1.5   # v1 assets were authored for the 32 px grid; the world is now 48 px


def process(asset: dict, image_path: Path, palette, write: bool = True, method: str = "nearest"):
    """Apply the asset's post recipe to one candidate. Returns (frames[(name, img)], metrics{}).
    v1 assets (any batch except V2*) are scaled x1.5 (nearest) so they fit the 48 px world until
    they are regenerated."""
    post = asset["post"]
    kind = post["kind"]
    legacy = not str(asset.get("batch", "")).startswith("V2") and kind in ("sheet", "single", "tiles")
    if legacy and write:
        frames, metrics = process(asset, image_path, palette, write=False, method=method)
        scaled = [(n, f.resize((round(f.width * LEGACY_SCALE), round(f.height * LEGACY_SCALE)), Image.NEAREST))
                  for n, f in frames]
        for name, frame in scaled:
            if kind == "tiles":
                out = px.ensure_dir(px.FRAMES_DIR / "tilesets" / post["world"])
                frame.save(out / f"{name}.png")
            else:
                target_atlas, short = (name.split("/", 1) if "/" in name else (post.get("atlas", "chars"), name))
                frame.save(px.ensure_dir(px.FRAMES_DIR / target_atlas) / f"{short}.png")
        return scaled, metrics
    img = Image.open(image_path).convert("RGBA")
    frames, metrics = [], {}

    if kind in ("sheet", "single"):
        if kind == "single":
            cells = [(0, img)]
        elif post.get("slice") == "components":
            cells = component_cells(img, len([n for n in post["names"] if n]))
        else:
            tm = template_meta(asset["template"])
            cells = list(grid_cells(img, tm["cols"], tm["rows"]))
            # `grow: {name: [left, top, right, bottom]}` widens one cell's crop (px of the raw sheet) when the
            # model drew a prop past its cell border (the district taxi's nose runs into the next cell)
            grow = post.get("grow") or {}
            if grow:
                cw, ch = img.width / tm["cols"], img.height / tm["rows"]
                for k, (idx, _) in enumerate(cells):
                    nm = post["names"][idx] if idx < len(post["names"]) else None
                    if nm in grow:
                        gl, gt, gr, gb = grow[nm]
                        r, c = divmod(idx, tm["cols"])
                        box = (max(0, round(c * cw) - gl), max(0, round(r * ch) - gt),
                               min(img.width, round((c + 1) * cw) + gr), min(img.height, round((r + 1) * ch) + gb))
                        cells[k] = (idx, img.crop(box))
        names = post["names"]
        atlas = post.get("atlas", "chars")
        sizes = post.get("sizes") or {}
        exact = set(post.get("exact") or [])
        # `groups`: several characters on one sheet, each {prefix: {frame, frame_h, baseline}}. The first
        # cell of a character (its idle pose) sets ONE scale for all its cells, so crouching, sitting and
        # jumping poses keep their true size instead of being stretched to frame_h.
        groups = post.get("groups") or {}
        group_scale = {}

        def group_of(nm):
            best = None
            for pre in groups:
                if nm.startswith(pre + "_") and (best is None or len(pre) > len(best)):
                    best = pre
            return best

        def raw_height(c):
            bb = clean_cell(c).getbbox()
            return (bb[3] - bb[1]) if bb else 1

        for idx, cell in cells:
            if idx < len(names) and names[idx]:
                g = group_of(names[idx])
                if g and g not in group_scale:
                    group_scale[g] = groups[g]["frame_h"] / raw_height(cell)
        for idx, cell in cells:
            if idx >= len(names) or not names[idx]:
                continue
            name = names[idx]
            short = name.split("/")[-1]
            g = group_of(name) if atlas == "chars" else None
            if g:
                spec = groups[g]
                target = max(8, min(spec.get("baseline", 90) - 2, round(raw_height(cell) * group_scale[g])))
                frame, st = char_frame_from_cell(cell, palette, target, spec.get("baseline", 90),
                                                 method, frame=spec.get("frame", 96))
            elif atlas == "chars" and "/" not in name:
                frame, st = char_frame_from_cell(cell, palette, post.get("frame_h", 56), post.get("baseline", 60),
                                                 method, frame=post.get("frame", 64))
            else:
                if short in sizes:
                    fw, fh, mode = (list(sizes[short]) + ["fit"])[:3]
                else:
                    fw, fh = post.get("frame_w", 32), post.get("frame_h", 32)
                    mode = "exact" if short in exact else "fit"
                frame, st = prop_frame_from_cell(cell, palette, fw, fh, post.get("anchor", "feet"), method, mode)
            frames.append((name, frame))
            metrics[name] = st
        if write:
            for name, frame in frames:
                target_atlas, short = (name.split("/", 1) if "/" in name else (atlas, name))
                out = px.ensure_dir(px.FRAMES_DIR / target_atlas)
                frame.save(out / f"{short}.png")

    elif kind == "tiles":
        tm = template_meta(asset["template"])
        world = post["world"]
        size = post.get("size", 32)
        cells = dict(grid_cells(img, tm["cols"], tm["rows"]))
        # `cells` map (name -> index | [index, part]) overrides the row-major `names` list; a part
        # ("top","bottom","left","right") takes that half of the cell and repeats it to keep pitch.
        mapping = {n: i for i, n in enumerate(post.get("names", [])) if n}
        mapping.update(post.get("cells") or {})
        for name, spec in mapping.items():
            idx, part = (spec, None) if not isinstance(spec, list) else (spec[0], spec[1] if len(spec) > 1 else None)
            cell = cells.get(idx)
            if cell is None:
                metrics[name] = {"pass": False, "reason": f"cell {idx} out of range"}
                continue
            if part:
                w, h = cell.size
                half = {"top": (0, 0, w, h // 2), "bottom": (0, h // 2, w, h),
                        "left": (0, 0, w // 2, h), "right": (w // 2, 0, w, h)}[part]
                piece = cell.crop(half)
                doubled = Image.new("RGBA", (w, h))
                if part in ("top", "bottom"):
                    doubled.paste(piece, (0, 0)); doubled.paste(piece, (0, h // 2))
                else:
                    doubled.paste(piece, (0, 0)); doubled.paste(piece, (w // 2, 0))
                cell = doubled
            inset = post.get("inset", 0)
            if inset:
                # trim neighbour-cell bleed (thin strips of the row above/beside) before scaling
                w, h = cell.size
                dx, dy = round(w * inset), round(h * inset)
                cell = cell.crop((dx, dy, w - dx, h - dy))
            tile, st = tile_from_cell(cell, palette, size)
            if tile is None:
                metrics[name] = st
                continue
            if name in set(post.get("degrid") or []):
                tile = degrid(tile)
            if name in set(post.get("align_top") or []):
                # one-way platforms collide at the tile's top edge: move the art up to it
                bb = tile.getbbox()
                if bb and bb[1] > 0:
                    shifted = Image.new("RGBA", tile.size)
                    shifted.paste(tile.crop((0, bb[1], tile.width, tile.height)), (0, 0))
                    tile = shifted
            frames.append((name, tile))
            metrics[name] = st
        if write:
            out = px.ensure_dir(px.FRAMES_DIR / "tilesets" / world)
            for name, tile in frames:
                tile.save(out / f"{name}.png")

    elif kind == "bg":
        from make_parallax import make_layer
        q = post.get("quantize", True)   # True: global palette, int: adaptive colours, False: none
        layer, st = make_layer(img, post.get("width", 960), post.get("height"), q if isinstance(q, int) and not isinstance(q, bool) else (palette if q else None),
                               seamless=post.get("seamless", True),
                               strip_sky=post.get("strip_sky", post["layer"] != "sky"),
                               crop_bottom=post.get("crop_bottom", True))
        frames.append((post["layer"], layer))
        metrics[post["layer"]] = st
        if write:
            out = px.ensure_dir(px.PUBLIC_ASSETS / "parallax" / post["level"])
            layer.save(out / f"{post['layer']}.png")

    elif kind == "card":
        w, h = post.get("width", 960), post.get("height", 540)
        scale = max(w / img.width, h / img.height)
        s = img.resize((round(img.width * scale), round(img.height * scale)), Image.BOX)
        x0, y0 = (s.width - w) // 2, (s.height - h) // 2
        card = s.crop((x0, y0, x0 + w, y0 + h))
        st = {"palette_compliance_raw": px.palette_compliance(card, palette)}
        if post.get("quantize", True):
            card = px.quantize(card, palette)
        arr = np.array(card); arr[..., 3] = 255
        card = Image.fromarray(arr, "RGBA")
        st["pass"] = True
        frames.append((post["name"], card))
        metrics[post["name"]] = st
        if write:
            out = px.ensure_dir(px.PUBLIC_ASSETS / "story")
            card.save(out / f"{post['name']}.png")
    else:
        raise ValueError(f"unknown post.kind {kind}")
    return frames, metrics


def strip_preview(frames, scale: int = 2) -> Image.Image:
    return px.contact_sheet(frames, cols=min(8, max(1, len(frames))), scale=scale, pad=4)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ids", nargs="*")
    ap.add_argument("--candidate", help="process one raw image instead of the approved one")
    ap.add_argument("--id", help="asset id for --candidate")
    ap.add_argument("--preview", help="write a contact-sheet preview PNG for --candidate")
    ap.add_argument("--method", default="nearest", choices=["nearest", "box"])
    args = ap.parse_args()

    manifest = load_manifest()
    palette = px.load_palette()
    if args.candidate:
        asset = asset_by_id(manifest, args.id)
        frames, metrics = process(asset, Path(args.candidate), palette, write=False, method=args.method)
        if args.preview:
            strip_preview(frames).save(args.preview)
        print(json.dumps(metrics, indent=1))
        return

    approved = load_approved()
    ids = args.ids or list(approved)
    # legacy (v1) assets first so the regenerated V2 frames with the same names win
    batch_of = {a["id"]: str(a.get("batch", "")) for a in manifest["assets"]}
    ids = sorted(ids, key=lambda i: batch_of.get(i, "").startswith("V2"))
    report = {}
    for aid in ids:
        if aid not in approved:
            print(f"[skip] {aid}: not approved (python tools/approve.py {aid} vNNN)")
            continue
        asset = asset_by_id(manifest, aid)
        ver = approved[aid]
        path = px.RAW_DIR / aid / (ver if ver.endswith(".png") else f"{ver}.png")
        if not path.exists():
            print(f"[skip] {aid}: {path} missing")
            continue
        frames, metrics = process(asset, path, palette, write=True, method=args.method)
        fixup = asset["post"].get("fixup")
        if fixup:   # hand-authored follow-up edit for this asset (tools/<fixup>.py main())
            import importlib
            importlib.import_module(fixup).main()
        fails = [n for n, m in metrics.items() if not m.get("pass", True)]
        report[aid] = {"version": ver, "frames": len(frames), "failed_gates": fails, "metrics": metrics}
        print(f"{aid:28s} {ver} -> {len(frames)} frames" + (f"  GATE FAIL: {fails}" if fails else "  ok"))
    (px.REVIEW_DIR / "pixelize_report.json").write_text(json.dumps(report, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
