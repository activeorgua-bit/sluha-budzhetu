"""Slice the canonical ChatGPT sheets into game-ready frames and extract the palette.

Inputs  (assets_src/reference/): sheet_sprites.png (1448x1086), mockup_level_1-2_skyline.png,
        mockup_level_1-3_bridge.png (1672x941)
Outputs: assets_src/reference/palette.json + palette.gpl
         assets_src/frames/{chars,props,ui}/*.png        (64-tall chars, feet at y=60; props)
         assets_src/frames/tilesets/w1/*.png              (32x32 tiles derived from the samples)
         assets_src/review/canonical.png + canonical_metrics.json
Run from the project root:  python tools/slice_reference.py [nearest|box]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

SHEET = px.REF_DIR / "sheet_sprites.png"
MOCK_SKY = px.REF_DIR / "mockup_level_1-2_skyline.png"
MOCK_BRIDGE = px.REF_DIR / "mockup_level_1-3_bridge.png"

# ---------------------------------------------------------------------------
# Regions on sheet_sprites.png (1448x1086). Boxes are generous; the slicer trims
# to the actual pixels and drops caption text (captions sit BELOW characters and
# ABOVE props on this sheet).
CHARS = {
    "politician_idle":  (462, 80, 570, 228),
    "politician_walk1": (655, 80, 780, 228),
    "politician_walk2": (860, 80, 990, 228),
    "politician_jump":  (1050, 74, 1185, 224),
    "journalist_idle":  (448, 312, 566, 444),
    "journalist_walk1": (640, 312, 760, 444),
    "journalist_walk2": (826, 312, 946, 444),
    "journalist_mic":   (996, 312, 1140, 444),
    "journalist_camera": (1230, 312, 1340, 444),
}
CHAR_TRIM_TEXT = 22  # px cut from the bottom of each char box (caption)

PROPS = {  # name: (box, frame_w, frame_h, anchor)
    "crate":          ((402, 572, 510, 672), 32, 32, "feet"),
    "wood_box":       ((536, 572, 640, 672), 32, 32, "feet"),
    "coin":           ((676, 572, 744, 672), 32, 32, "center"),
    "question_block": ((788, 572, 940, 672), 32, 32, "feet"),
    "brick_block":    ((962, 572, 1074, 672), 32, 32, "feet"),
    "metal_block":    ((1116, 572, 1230, 672), 32, 32, "feet"),
    "hook_block":     ((1266, 572, 1384, 728), 32, 64, "feet"),
    "barrel":         ((398, 752, 490, 858), 32, 32, "feet"),
    "pipe":           ((506, 752, 604, 858), 32, 32, "feet"),
    "pipe_stack":     ((616, 752, 730, 858), 48, 32, "feet"),
    "caution_sign":   ((748, 752, 840, 858), 32, 32, "feet"),
    "traffic_cone":   ((872, 752, 950, 858), 32, 32, "feet"),
    "rebar_platform": ((976, 752, 1096, 870), 64, 48, "feet"),
    "wood_platform":  ((1108, 752, 1240, 870), 64, 48, "feet"),
}

TILES = {  # 2x2-tile platform samples -> 64x64 (top row = surface tiles, bottom = fill)
    "tile_stone":  (24, 958, 190, 1068),
    "tile_brick":  (206, 958, 364, 1068),
    "tile_steel":  (382, 958, 534, 1068),
    "scaffold":    (568, 958, 712, 1068),
    "ladder":      (742, 958, 814, 1068),
    "suspended_platform": (866, 958, 1036, 1068),
}

PALETTE_REGION = (18, 60, 350, 900)
PALETTE_GROUPS = ["sky", "water", "browns", "brick_wood", "steel", "hazard",
                  "greens", "skin", "hair", "clothing"]


def crop_key(img: Image.Image, box, tol=38, trim_text=0, soft=10):
    c = img.crop(box).convert("RGBA")
    if trim_text:
        c = c.crop((0, 0, c.width, c.height - trim_text))
    c = px.key_color(c, px.CREAM, tol=tol, soft=soft)
    c = px.keep_components(c, min_area=25, drop_text_like=True)
    return px.trim(c)


# ---------------------------------------------------------------------------
def extract_palette(sheet: Image.Image):
    region = sheet.crop(PALETTE_REGION).convert("RGB")
    arr = np.array(region).astype(np.int32)
    d = np.sqrt(((arr - np.array(px.CREAM)) ** 2).sum(axis=2))
    mask = d > 30
    labels, boxes = px.component_boxes(mask)
    swatches = []
    for lab, (x0, y0, x1, y1), area in boxes:
        w, h = x1 - x0, y1 - y0
        if not (28 <= w <= 70 and 28 <= h <= 70):
            continue
        if area < 0.7 * w * h:
            continue
        sub = arr[y0 + 4:y1 - 4, x0 + 4:x1 - 4].reshape(-1, 3)
        med = np.median(sub, axis=0)
        var = np.abs(sub - med).mean()
        if var > 18:      # striped hazard swatches etc.
            continue
        swatches.append((y0 + PALETTE_REGION[1], x0 + PALETTE_REGION[0], tuple(int(v) for v in med)))
    swatches.sort()
    rows = []
    for y, x, rgb in swatches:
        if rows and abs(rows[-1][0] - y) < 20:
            rows[-1][1].append((x, rgb))
        else:
            rows.append([y, [(x, rgb)]])
    groups = []
    for i, (y, items) in enumerate(rows):
        items.sort()
        name = PALETTE_GROUPS[i] if i < len(PALETTE_GROUPS) else f"row{i}"
        colors = []
        for _, rgb in items:
            hx = px.rgb_to_hex(rgb)
            if hx not in colors:
                colors.append(hx)
        groups.append({"name": name, "colors": colors})
    groups.append({"name": "extra", "colors": ["#000000", "#FFFFFF", "#1C1C1C"]})
    return groups


def write_palette(groups):
    px.ensure_dir(px.REF_DIR)
    (px.REF_DIR / "palette.json").write_text(json.dumps({"groups": groups}, indent=2), encoding="utf-8")
    lines = ["GIMP Palette", "Name: Sluha Budzhetu", "Columns: 8", "#"]
    for g in groups:
        for hx in g["colors"]:
            r, gg, b = px.hex_to_rgb(hx)
            lines.append(f"{r:3d} {gg:3d} {b:3d}\t{g['name']}")
    (px.REF_DIR / "palette.gpl").write_text("\n".join(lines) + "\n", encoding="utf-8")
    n = sum(len(g["colors"]) for g in groups)
    print(f"palette: {len(groups)} groups, {n} colours -> {px.REF_DIR / 'palette.json'}")


def palette_group(groups, *names):
    out = []
    for g in groups:
        if g["name"] in names:
            out += [px.hex_to_rgb(h) for h in g["colors"]]
    return out


# ---------------------------------------------------------------------------
def grabcut(img: Image.Image, box, iters=6, margin=2):
    """Cut a sprite out of a busy mockup background with OpenCV GrabCut."""
    import cv2
    crop = np.array(img.crop(box).convert("RGB"))[:, :, ::-1].copy()  # BGR
    mask = np.zeros(crop.shape[:2], np.uint8)
    rect = (margin, margin, crop.shape[1] - 2 * margin, crop.shape[0] - 2 * margin)
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(crop, mask, rect, bgd, fgd, iters, cv2.GC_INIT_WITH_RECT)
    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    rgba = np.dstack([crop[:, :, ::-1], fg])
    out = Image.fromarray(rgba, "RGBA")
    out = px.keep_components(out, min_area=60, drop_text_like=False)
    return px.trim(out)


def key_black(img: Image.Image, box, tol=60):
    c = img.crop(box).convert("RGBA")
    c = px.key_color(c, (0, 0, 0), tol=tol, soft=20)
    c = px.keep_components(c, min_area=20, drop_text_like=False)
    return px.trim(c)


def key_bg_colors(img: Image.Image, box, colors, tol=34):
    """Crop then remove pixels close to the given background colours (sky/water)."""
    c = img.crop(box).convert("RGBA")
    c = px.key_colors(c, colors, tol=tol)
    c = px.keep_components(c, min_area=40, drop_text_like=False)
    return px.trim(c)


def rect_crop(img: Image.Image, box):
    return img.crop(box).convert("RGBA")


def char_frame(raw: Image.Image, palette, method: str, stats: dict | None = None) -> Image.Image:
    """Characters: 56 px tall, feet at y=60, frame 64 wide (80 for wide poses)."""
    s = px.defringe(px.trim(raw), radius=1)
    s = px.resample_to_height(px.trim(s), 56, max_w=78, method=method)
    if stats is not None:
        stats["palette_compliance_raw"] = px.palette_compliance(s, palette)
        stats["pitch_raw"] = px.detect_pixel_pitch(raw)
    s = px.trim(px.clean_edge_specks(px.binarize_alpha(px.quantize(s, palette))))
    fw = 64 if s.width <= 62 else 80
    return px.place_in_frame(s, fw, px.FRAME, px.BASELINE, "feet")


def split_tiles(img64: Image.Image, prefix: str, out_dir: Path, names=("top_l", "top_r", "fill_l", "fill_r")):
    """Split a 64x64 sample into four 32x32 tiles."""
    boxes = [(0, 0, 32, 32), (32, 0, 64, 32), (0, 32, 32, 64), (32, 32, 64, 64)]
    for n, b in zip(names, boxes):
        img64.crop(b).save(out_dir / f"{prefix}_{n}.png")


def flat_tile(color_top, color_fill, out: Path, wave: bool = False):
    """Procedural 32x32 tile (used for water until batch C delivers real tiles)."""
    t = Image.new("RGBA", (32, 32), color_fill + (255,))
    d = np.array(t)
    d[0:4, :, :3] = color_top
    if wave:
        for x in range(0, 32, 8):
            d[4:6, x:x + 4, :3] = color_top
    Image.fromarray(d, "RGBA").save(out)


# ---------------------------------------------------------------------------
def main(method: str = "nearest"):
    sheet = Image.open(SHEET).convert("RGB")
    groups = extract_palette(sheet)
    write_palette(groups)
    palette = px.load_palette()
    sky_water = palette_group(groups, "sky", "water")

    out_chars = px.ensure_dir(px.FRAMES_DIR / "chars")
    out_props = px.ensure_dir(px.FRAMES_DIR / "props")
    out_ui = px.ensure_dir(px.FRAMES_DIR / "ui")
    out_w1 = px.ensure_dir(px.FRAMES_DIR / "tilesets" / "w1")
    samples_dir = px.ensure_dir(px.REF_DIR / "crops")
    px.ensure_dir(px.REVIEW_DIR)

    review = []
    metrics = {}

    # the palette strip itself is a generation reference (colour lock)
    sheet.crop(PALETTE_REGION).save(samples_dir / "palette_strip.png")
    # the two mockups, downscaled, as compact style references (level look, HUD, props in context)
    Image.open(MOCK_SKY).convert("RGB").resize((836, 470), Image.LANCZOS).save(samples_dir / "mockup_skyline_small.png")
    Image.open(MOCK_BRIDGE).convert("RGB").resize((836, 470), Image.LANCZOS).save(samples_dir / "mockup_bridge_small.png")

    # characters ------------------------------------------------------------
    for name, box in CHARS.items():
        raw = crop_key(sheet, box, trim_text=CHAR_TRIM_TEXT)
        raw.save(samples_dir / f"{name}.png")            # full-res crop = generation reference
        stats = {}
        frame = char_frame(raw, palette, method, stats)
        frame.save(out_chars / f"{name}.png")
        m = px.measure_sprite(frame, palette).__dict__
        m.update(stats)
        metrics[name] = m
        review.append((name, frame))

    # detective from the level 1-2 mockup ------------------------------------
    sky = Image.open(MOCK_SKY).convert("RGB")
    bridge = Image.open(MOCK_BRIDGE).convert("RGB")
    det = grabcut(sky, (1196, 590, 1322, 772))
    det.save(samples_dir / "detective_idle.png")
    stats = {}
    frame = char_frame(det, palette, method, stats)
    frame.save(out_chars / "detective_idle.png")
    m = px.measure_sprite(frame, palette).__dict__
    m.update(stats)
    metrics["detective_idle"] = m
    review.append(("detective_idle", frame))

    # props cut from the mockups ------------------------------------------------
    mock_props = {
        # name: (raw image, fw, fh, anchor, target_h)
        "money_bag":     (grabcut(sky, (262, 618, 352, 728)), 32, 32, "feet", 30),
        "warrant":       (key_bg_colors(sky, (760, 486, 884, 606), sky_water, 40), 32, 32, "center", 28),
        "sign_reform":   (grabcut(sky, (26, 322, 296, 512)), 96, 64, "feet", 62),
        "sign_nabu":     (grabcut(sky, (1384, 616, 1550, 772)), 64, 64, "feet", 60),
        "sign_bridges":  (grabcut(bridge, (16, 276, 232, 440)), 96, 64, "feet", 62),
        "sign_facts":    (rect_crop(bridge, (1530, 698, 1640, 792)), 64, 64, "feet", 56),
        "crane_hook":    (grabcut(bridge, (876, 170, 1004, 400)), 48, 96, "feet", 94),
        "hanging_rebar": (grabcut(bridge, (1212, 226, 1548, 364)), 96, 48, "feet", 46),
        "bridge_girder": (key_bg_colors(bridge, (640, 586, 1000, 664), sky_water, 44), 96, 32, "feet", 30),
        "spike":         (key_bg_colors(bridge, (868, 812, 934, 872), sky_water, 44), 32, 32, "feet", 26),
    }
    for name, (raw, fw, fh, anchor, th) in mock_props.items():
        raw.save(samples_dir / f"{name}.png")
        frame = px.make_frame(raw, fw, fh, target_h=th, baseline=fh - 1, palette=palette,
                              method=method, anchor=anchor, max_w=fw - 2)
        frame.save(out_props / f"{name}.png")
        review.append((name, frame))

    # HUD icons (black HUD strip on the bridge mockup)
    for name, box, fw, fh in [("hud_portrait", (350, 60, 414, 126), 32, 32),
                              ("hud_bag", (690, 62, 748, 126), 32, 32)]:
        raw = key_black(bridge, box)
        frame = px.make_frame(raw, fw, fh, target_h=30, baseline=fh - 1, palette=palette,
                              method=method, anchor="center", max_w=30)
        frame.save(out_ui / f"{name}.png")
        review.append((name, frame))

    # props from the sheet -----------------------------------------------------
    for name, (box, fw, fh, anchor) in PROPS.items():
        raw = crop_key(sheet, box, trim_text=0)
        raw.save(samples_dir / f"{name}.png")
        frame = px.make_frame(raw, fw, fh, target_h=fh - 2, baseline=fh - 1, palette=palette,
                              method=method, anchor=anchor, max_w=fw - 2)
        frame.save(out_props / f"{name}.png")
        review.append((name, frame))

    # tile samples -> 64x64 (2x2 tiles) + derived 32x32 tileset w1 ------------
    resample = Image.NEAREST if method == "nearest" else Image.BOX
    for name, box in TILES.items():
        raw = px.trim(crop_key(sheet, box, trim_text=0))
        raw.save(samples_dir / f"{name}.png")
        if name == "ladder":
            frame = px.make_frame(raw, 32, 64, target_h=64, baseline=64, palette=palette,
                                  method=method, anchor="feet", max_w=32)
            frame.crop((0, 0, 32, 32)).save(out_w1 / "ladder_top.png")
            frame.crop((0, 32, 32, 64)).save(out_w1 / "ladder_mid.png")
        elif name == "suspended_platform":
            frame = px.make_frame(raw, 64, 32, target_h=30, baseline=31, palette=palette,
                                  method=method, anchor="feet", max_w=64)
            frame.save(out_props / "suspended_platform.png")
        else:
            frame = px.binarize_alpha(px.quantize(raw.resize((64, 64), resample), palette))
            mat = name.replace("tile_", "")
            split_tiles(frame, mat, out_w1)
        review.append((name, frame))

    # single-tile solids / decor for w1
    for src, tile in [("brick_block", "brick_block"), ("metal_block", "metal_block"),
                      ("crate", "crate"), ("wood_box", "wood_box"), ("spike", "spike")]:
        Image.open(out_props / f"{src}.png").convert("RGBA").save(out_w1 / f"{tile}.png")
    girder = Image.open(out_props / "bridge_girder.png").convert("RGBA")
    for i, n in enumerate(("girder_l", "girder_m", "girder_r")):
        girder.crop((i * 32, 0, i * 32 + 32, 32)).save(out_w1 / f"{n}.png")
    for src, prefix in [("wood_platform", "wood_plat"), ("rebar_platform", "rebar_plat")]:
        p = Image.open(out_props / f"{src}.png").convert("RGBA")
        # one-way platforms: the top 32 rows carry the walkable surface
        top = p.crop((0, p.height - 48, 64, p.height - 16)) if p.height >= 48 else p.crop((0, 0, 64, 32))
        top.crop((0, 0, 32, 32)).save(out_w1 / f"{prefix}_l.png")
        top.crop((32, 0, 64, 32)).save(out_w1 / f"{prefix}_r.png")
    water = palette_group(groups, "water")
    if len(water) >= 3:
        flat_tile(water[1], water[3] if len(water) > 3 else water[2], out_w1 / "water_top.png", wave=True)
        flat_tile(water[3] if len(water) > 3 else water[2], water[-1], out_w1 / "water_fill.png")
    hook_block = Image.open(out_props / "hook_block.png").convert("RGBA")
    hook_block.crop((0, 0, 32, 32)).save(out_w1 / "hook_chain.png")
    hook_block.crop((0, 32, 32, 64)).save(out_w1 / "hook_crate.png")

    # review sheet + metrics ---------------------------------------------------
    sheet_img = px.contact_sheet(review, cols=8, scale=3)
    sheet_img.save(px.REVIEW_DIR / "canonical.png")
    (px.REVIEW_DIR / "canonical_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"frames: {len(review)} -> {px.FRAMES_DIR}")
    print(f"w1 tiles: {len(list(out_w1.glob('*.png')))} -> {out_w1}")
    print(f"review sheet -> {px.REVIEW_DIR / 'canonical.png'}")
    for k, v in metrics.items():
        print(f"  {k:20s} {v['width']:2d}x{v['height']:2d} head={v['head_ratio']:.2f} "
              f"outline={v['outline_ratio']:.2f} pal_raw={v.get('palette_compliance_raw', 0):.2f} "
              f"pitch_raw={v.get('pitch_raw', 0):.0f}")


if __name__ == "__main__":
    if "--legacy" not in sys.argv:
        print("slice_reference.py is the v1 slicer (32 px grid, palette v1). The game now uses v2 assets;
"
              "run with --legacy only to rebuild the old canonical crops. It would overwrite palette.json.")
        sys.exit(0)
    main(next((a for a in sys.argv[1:] if not a.startswith("--")), "nearest"))
