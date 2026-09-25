"""Import generated images (from the Magnific connector, a URL, or a local file) as candidates.

  python tools/import_candidate.py <asset_id> <url-or-path> [<url-or-path> ...] [--note "..."] [--batch A]

Saves assets_src/raw/<asset_id>/vNNN.png (next free number), appends to meta.json, and rebuilds
assets_src/review/<batch>.html (batch taken from the manifest unless --batch is given).
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

import requests
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402
import pixelize  # noqa: E402
from generate_assets import build_review  # noqa: E402


def next_version(dest: Path) -> int:
    existing = sorted(dest.glob("v[0-9][0-9][0-9].png"))
    return len(existing) + 1


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("asset_id")
    ap.add_argument("sources", nargs="+")
    ap.add_argument("--note", default="")
    ap.add_argument("--batch")
    ap.add_argument("--no-review", action="store_true")
    args = ap.parse_args()

    manifest = yaml.safe_load((px.ROOT / "tools" / "manifest.yaml").read_text(encoding="utf-8"))
    asset = pixelize.asset_by_id(manifest, args.asset_id)
    dest = px.RAW_DIR / args.asset_id
    dest.mkdir(parents=True, exist_ok=True)
    saved = []
    for src in args.sources:
        n = next_version(dest)
        out = dest / f"v{n:03d}.png"
        if src.startswith("http"):
            r = requests.get(src, timeout=180)
            r.raise_for_status()
            out.write_bytes(r.content)
        else:
            shutil.copy(src, out)
        saved.append(out.name)
        print(f"saved {out.relative_to(px.ROOT)} ({out.stat().st_size // 1024} KB)")
    meta_path = dest / "meta.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {"runs": []}
    meta["runs"].append({"time": time.strftime("%Y-%m-%d %H:%M:%S"), "source": "connector",
                         "files": saved, "note": args.note})
    meta_path.write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")
    if not args.no_review:
        batch = args.batch or asset.get("batch", "adhoc")
        ids = [a["id"] for a in manifest["assets"] if a.get("batch") == batch]
        build_review(manifest, batch, ids)


if __name__ == "__main__":
    main()
