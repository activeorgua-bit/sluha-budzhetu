"""Pack frames into Phaser atlases and fixed-grid tilesets.

  assets_src/frames/<atlas>/*.png      -> public/assets/atlases/<atlas>.png + .json (Phaser JSON Hash)
  assets_src/frames/tilesets/<world>/*.png -> public/assets/tilesets/<world>.png + .json (32px grid)
  tools/anims.json (hand-written clip table) -> public/assets/atlases/anims.json (validated)

Frames inside one atlas may have different sizes (64x64 and 80x64 character frames both work;
the game anchors sprites by origin, feet at y=60).

Usage: python tools/pack_atlas.py [--atlas chars props ui] [--tilesets w1 w2 w3]
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

ATLAS_DIR = px.PUBLIC_ASSETS / "atlases"
TILESET_DIR = px.PUBLIC_ASSETS / "tilesets"
ANIMS_SRC = px.ROOT / "tools" / "anims.json"


def pack_atlas(name: str, frames_dir: Path, padding: int = 2, max_w: int = 2048):
    files = sorted(p for p in frames_dir.glob("*.png"))
    if not files:
        print(f"[skip] no frames in {frames_dir}")
        return None
    images = [(p.stem, Image.open(p).convert("RGBA")) for p in files]
    # simple shelf packer: sort by height desc, fill rows
    images.sort(key=lambda t: (-t[1].height, t[0]))
    shelves = []  # [y, height, x]
    placements = {}
    total_h = 0
    for stem, im in images:
        w, h = im.width + padding, im.height + padding
        placed = False
        for sh in shelves:
            if sh[1] >= h and sh[2] + w <= max_w:
                placements[stem] = (sh[2], sh[0], im)
                sh[2] += w
                placed = True
                break
        if not placed:
            y = total_h
            shelves.append([y, h, w])
            placements[stem] = (0, y, im)
            total_h += h
    width = max(sh[2] for sh in shelves)
    atlas = Image.new("RGBA", (width, total_h), (0, 0, 0, 0))
    frames = {}
    for stem, (x, y, im) in placements.items():
        atlas.paste(im, (x, y), im)
        frames[stem] = {
            "frame": {"x": x, "y": y, "w": im.width, "h": im.height},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": im.width, "h": im.height},
            "sourceSize": {"w": im.width, "h": im.height},
        }
    ATLAS_DIR.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS_DIR / f"{name}.png")
    meta = {
        "frames": frames,
        "meta": {"app": "sluha-pack_atlas", "version": "1.0", "image": f"{name}.png",
                 "format": "RGBA8888", "size": {"w": width, "h": total_h}, "scale": "1"},
    }
    (ATLAS_DIR / f"{name}.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f"atlas {name}: {len(frames)} frames -> {width}x{total_h}")
    return frames


SHARED_TILES = ["spike", "water_top", "water_top2", "water_fill", "ladder_top", "ladder_mid", "wood_plat_l",
                "wood_plat_r", "rebar_plat_l", "rebar_plat_r", "crate", "wood_box", "metal_block", "brick_block",
                "hazard_barrier", "scaffold_top_l", "scaffold_top_r", "scaffold_fill_l", "scaffold_fill_r"]


def share_tiles(base: Path, dest: Path):
    """Hazards, blocks and generic platforms are copied into every world's tileset that lacks them."""
    import shutil
    n = 0
    for name in SHARED_TILES:
        src = base / f"{name}.png"
        if src.exists() and not (dest / f"{name}.png").exists():
            shutil.copy(src, dest / f"{name}.png")
            n += 1
    return n


def pack_tileset(world: str, tiles_dir: Path, tile: int = 48, columns: int = 16):
    # shared hazards/blocks/platforms: prefer the regenerated v2 set (k1), fall back to legacy w1
    for base_name in ("k1", "w1"):
        base = tiles_dir.parent / base_name
        if tiles_dir.exists() and base.exists() and tiles_dir != base:
            share_tiles(base, tiles_dir)
    files = sorted(p for p in tiles_dir.glob("*.png"))
    if not files:
        print(f"[skip] no tiles in {tiles_dir}")
        return None
    names = []
    images = []
    for p in files:
        im = Image.open(p).convert("RGBA")
        if im.size != (tile, tile):
            # split multi-tile pieces into columns (32xN) or rows (Nx32)
            if im.width % tile == 0 and im.height % tile == 0:
                for ty in range(im.height // tile):
                    for tx in range(im.width // tile):
                        names.append(f"{p.stem}_{tx}_{ty}" if (im.width > tile or im.height > tile) else p.stem)
                        images.append(im.crop((tx * tile, ty * tile, (tx + 1) * tile, (ty + 1) * tile)))
                continue
            im = im.resize((tile, tile), Image.NEAREST)
        names.append(p.stem)
        images.append(im)
    # one-way platforms: the collision surface is the tile top, so the art must start there too.
    # A family (<name>_plat_l/m/r) whose middle piece starts N px down is shifted up by N
    # (the city slab started 12 px low: the politician seemed to hover above it).
    fams = {}
    for k, n in enumerate(names):
        m = re.match(r"(.+_plat)_(l|m|r)$", n)
        if m:
            fams.setdefault(m.group(1), {})[m.group(2)] = k
    for fam, parts in fams.items():
        if "m" not in parts:
            continue
        alpha = np.array(images[parts["m"]])[..., 3]
        rows_on = np.where(alpha.max(axis=1) > 0)[0]
        shift = int(rows_on.min()) if len(rows_on) else 0
        if shift < 3:
            continue
        for k in parts.values():
            src = images[k]
            moved = Image.new("RGBA", src.size, (0, 0, 0, 0))
            moved.paste(src.crop((0, shift, src.width, src.height)), (0, 0))
            images[k] = moved
        print(f"  {world}: {fam}_* art moved up {shift} px to the collision surface")
    # index 0 is reserved for "empty" so tilemap data can use 0 = no tile
    rows = math.ceil((len(images) + 1) / columns)
    sheet = Image.new("RGBA", (columns * tile, rows * tile), (0, 0, 0, 0))
    index = {}
    for i, (n, im) in enumerate(zip(names, images), start=1):
        x, y = (i % columns) * tile, (i // columns) * tile
        sheet.paste(im, (x, y), im)
        index[n] = i
    TILESET_DIR.mkdir(parents=True, exist_ok=True)
    sheet.save(TILESET_DIR / f"{world}.png")
    (TILESET_DIR / f"{world}.json").write_text(json.dumps(
        {"tileWidth": tile, "tileHeight": tile, "columns": columns, "count": len(images) + 1,
         "tiles": index}, indent=1), encoding="utf-8")
    print(f"tileset {world}: {len(images)} tiles -> {sheet.width}x{sheet.height}")
    return index


def write_anims(atlases: dict[str, dict]):
    """Copy tools/anims.json to public and drop clips whose frames are missing (reported)."""
    if not ANIMS_SRC.exists():
        print("[skip] tools/anims.json missing")
        return
    src = json.loads(ANIMS_SRC.read_text(encoding="utf-8"))
    out = {}
    missing = []
    for key, clip in src.items():
        atlas = clip["atlas"]
        frames = atlases.get(atlas)
        if frames is None:
            # atlas not packed in this run: trust the existing json on disk
            p = ATLAS_DIR / f"{atlas}.json"
            frames = json.loads(p.read_text(encoding="utf-8"))["frames"] if p.exists() else {}
        ok = [f for f in clip["frames"] if f in frames]
        if len(ok) != len(clip["frames"]):
            missing.append((key, [f for f in clip["frames"] if f not in frames]))
        if ok:
            out[key] = {**clip, "frames": ok}
    (ATLAS_DIR / "anims.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"anims: {len(out)} clips written")
    for key, m in missing:
        print(f"  [warn] clip '{key}' missing frames: {m}")


def write_manifest():
    """List every file under public/assets so the game only requests files that exist."""
    files = []
    for p in sorted(px.PUBLIC_ASSETS.rglob("*")):
        if p.is_file() and p.name != "manifest.json":
            files.append(p.relative_to(px.PUBLIC_ASSETS).as_posix())
    (px.PUBLIC_ASSETS / "manifest.json").write_text(json.dumps({"files": files}, indent=1), encoding="utf-8")
    print(f"manifest: {len(files)} files")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--atlas", nargs="*", default=["chars", "props", "ui"])
    ap.add_argument("--tilesets", nargs="*", default=None)
    args = ap.parse_args()
    packed = {}
    for a in args.atlas:
        res = pack_atlas(a, px.FRAMES_DIR / a)
        if res is not None:
            packed[a] = res
    worlds = args.tilesets
    if worlds is None:
        worlds = [p.name for p in sorted((px.FRAMES_DIR / "tilesets").glob("*")) if p.is_dir()]
    for w in worlds:
        pack_tileset(w, px.FRAMES_DIR / "tilesets" / w)
    write_anims(packed)
    write_manifest()


if __name__ == "__main__":
    main()
