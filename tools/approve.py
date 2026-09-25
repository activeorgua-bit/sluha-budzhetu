"""Record which generated candidate to use for an asset.

  python tools/approve.py <asset_id> <vNNN>     approve a candidate (assets_src/raw/<id>/vNNN.png)
  python tools/approve.py <asset_id> manual     use a hand-fixed assets_src/raw/<id>/manual.png
  python tools/approve.py --list                show candidates and approval state
  python tools/approve.py --unapprove <id>
Then run:  npm run assets:pixelize && npm run assets:pack && npm run assets:verify
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

APPROVED = px.ROOT / "tools" / "approved.json"


def load():
    return json.loads(APPROVED.read_text(encoding="utf-8")) if APPROVED.exists() else {}


def save(data):
    APPROVED.write_text(json.dumps(data, indent=1, sort_keys=True), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("asset_id", nargs="?")
    ap.add_argument("version", nargs="?")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--unapprove")
    args = ap.parse_args()
    data = load()
    if args.list or (not args.asset_id and not args.unapprove):
        for d in sorted(p for p in px.RAW_DIR.glob("*") if p.is_dir()):
            cands = sorted(p.name for p in d.glob("*.png"))
            mark = data.get(d.name, "-")
            print(f"{d.name:28s} approved={mark:8s} candidates={cands}")
        return
    if args.unapprove:
        data.pop(args.unapprove, None)
        save(data)
        print(f"unapproved {args.unapprove}")
        return
    if not args.version:
        ap.error("version required (vNNN or manual)")
    ver = args.version if args.version.endswith(".png") else f"{args.version}.png"
    path = px.RAW_DIR / args.asset_id / ver
    if not path.exists():
        print(f"ERROR: {path} does not exist", file=sys.stderr)
        sys.exit(1)
    data[args.asset_id] = args.version.replace(".png", "")
    save(data)
    print(f"approved {args.asset_id} -> {data[args.asset_id]}")


if __name__ == "__main__":
    main()
