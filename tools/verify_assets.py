"""Check that every frame / clip / tile / layer the game references exists and is well-formed.

  python tools/verify_assets.py            # exit 1 on missing critical assets
  python tools/verify_assets.py --strict   # also fail on placeholders and missing optional assets

Reads: public/assets/atlases/*.json, anims.json, tilesets/*.json, manifest.json,
       src/config/assetsRequired.js (names the game uses), src/levels/ascii/*.txt (tiles/props/parallax).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

ATLAS_DIR = px.PUBLIC_ASSETS / "atlases"
TILESET_DIR = px.PUBLIC_ASSETS / "tilesets"
REQUIRED_JS = px.ROOT / "src" / "config" / "assetsRequired.js"
ASCII_DIR = px.ROOT / "src" / "levels" / "ascii"


def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def parse_required():
    """Very small parser for the exported arrays in assetsRequired.js."""
    text = REQUIRED_JS.read_text(encoding="utf-8") if REQUIRED_JS.exists() else ""
    out = {}
    for m in re.finditer(r"export const (\w+)\s*=\s*\[(.*?)\];", text, re.S):
        out[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()
    problems, warnings = [], []

    atlases = {}
    for name in ("chars", "props", "ui"):
        j = load_json(ATLAS_DIR / f"{name}.json")
        png = ATLAS_DIR / f"{name}.png"
        if not j or not png.exists():
            problems.append(f"atlas {name} missing (run npm run assets:slice && npm run assets:pack)")
            continue
        atlases[name] = set(j["frames"])
        im = Image.open(png)
        if im.size != (j["meta"]["size"]["w"], j["meta"]["size"]["h"]):
            problems.append(f"atlas {name}: png size {im.size} != json {j['meta']['size']}")
        for fname, fr in j["frames"].items():
            f = fr["frame"]
            if f["x"] + f["w"] > im.width or f["y"] + f["h"] > im.height:
                problems.append(f"atlas {name}: frame {fname} outside image")
    # character frames: 64 tall, feet row present
    if "chars" in atlases:
        j = load_json(ATLAS_DIR / "chars.json")
        im = Image.open(ATLAS_DIR / "chars.png").convert("RGBA")
        for fname, fr in j["frames"].items():
            f = fr["frame"]
            # 96 px characters; 144 px bosses (animator, speaker). Feet always 6 px above the frame bottom.
            if f["h"] not in (px.FRAME, 144):
                problems.append(f"chars/{fname}: height {f['h']} not in ({px.FRAME}, 144)")
            baseline = f["h"] - (px.FRAME - px.BASELINE)
            crop = im.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
            row = crop.crop((0, baseline - 1, f["w"], baseline)).getbbox()
            if row is None:
                warnings.append(f"chars/{fname}: nothing on the feet row y={px.BASELINE - 1} (baseline drift?)")

    req = parse_required()
    for fname in req.get("CHAR_FRAMES", []):
        if fname not in atlases.get("chars", set()):
            (problems if fname in req.get("CRITICAL", []) else warnings).append(f"missing chars frame: {fname}")
    for fname in req.get("PROP_FRAMES", []):
        if fname not in atlases.get("props", set()):
            (problems if fname in req.get("CRITICAL", []) else warnings).append(f"missing props frame: {fname}")
    for fname in req.get("UI_FRAMES", []):
        if fname not in atlases.get("ui", set()):
            problems.append(f"missing ui frame: {fname}")

    anims = load_json(ATLAS_DIR / "anims.json") or {}
    for clip in req.get("CLIPS", []):
        if clip not in anims:
            warnings.append(f"animation clip not available yet: {clip}")

    # tilesets referenced by levels
    for lvl in sorted(ASCII_DIR.glob("*.txt")):
        head = lvl.read_text(encoding="utf-8").split("===")[0]
        try:
            meta = json.loads(head)
        except json.JSONDecodeError as e:
            problems.append(f"{lvl.name}: bad frontmatter ({e})")
            continue
        ts = meta.get("tileset", "w1")
        tj = load_json(TILESET_DIR / f"{ts}.json")
        if not tj:
            (problems if ts == "w1" else warnings).append(f"{lvl.name}: tileset {ts} missing")
        else:
            mat = meta.get("material", "stone")
            if f"{mat}_c" not in tj["tiles"] and f"{mat}_top_l" not in tj["tiles"]:
                problems.append(f"{lvl.name}: material '{mat}' has no tiles in {ts}")
        for layer in meta.get("parallax", []):
            name = layer["key"].replace(f"{meta['id']}_", "")
            p = px.PUBLIC_ASSETS / "parallax" / meta["id"] / f"{name}.png"
            if not p.exists():
                warnings.append(f"{lvl.name}: parallax layer {p.relative_to(px.PUBLIC_ASSETS)} missing")
        for b in meta.get("backfill", []):
            if tj and b.get("tile") not in tj["tiles"]:
                problems.append(f"{lvl.name}: backfill tile {b.get('tile')} not in {ts}")
        for ch, spec in (meta.get("decor") or {}).items():
            frame = spec.get("frame") if isinstance(spec, dict) else spec
            if frame not in atlases.get("props", set()):
                warnings.append(f"{lvl.name}: decor '{ch}' -> props/{frame} missing")
        for s in meta.get("signs", []):
            if s.get("sprite") != "plaque" and s.get("sprite") not in atlases.get("props", set()):
                warnings.append(f"{lvl.name}: sign sprite {s.get('sprite')} missing")

    manifest = load_json(px.PUBLIC_ASSETS / "manifest.json")
    if not manifest:
        problems.append("public/assets/manifest.json missing (run npm run assets:pack)")

    for w in warnings:
        print(f"[warn] {w}")
    for p in problems:
        print(f"[FAIL] {p}")
    print(f"verify_assets: {len(problems)} problem(s), {len(warnings)} warning(s)")
    if problems or (args.strict and warnings):
        sys.exit(1)


if __name__ == "__main__":
    main()
