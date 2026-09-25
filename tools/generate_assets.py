"""Generate assets through the Magnific API from tools/manifest.yaml and build review pages.

  python tools/generate_assets.py --dry-run --batch all          # print payloads, spend nothing
  python tools/generate_assets.py --batch calibration --n 3      # run a batch
  python tools/generate_assets.py --ids detective_sheet --quality low --n 1
  python tools/generate_assets.py --retry detective_sheet --note "feet must touch the baseline"
  python tools/generate_assets.py --review-only --batch A       # rebuild review html from raw/

Outputs: assets_src/raw/<id>/vNNN.png (+ meta.json), assets_src/review/<batch>.html,
         assets_src/cost_log.csv. Approved ids (tools/approved.json) are skipped unless --force.
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import html
import json
import sys
import time
from pathlib import Path

import yaml
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402
import pixelize  # noqa: E402
from magnific_client import MagnificClient, MagnificError  # noqa: E402

MANIFEST = px.ROOT / "tools" / "manifest.yaml"
TEMPLATES = px.ROOT / "assets_src" / "templates"


def palette_hexes():
    data = json.loads((px.REF_DIR / "palette.json").read_text(encoding="utf-8"))
    return [h for g in data["groups"] for h in g["colors"]]


def build_prompt(manifest, asset, note: str | None = None) -> str:
    p = asset["prompt"].strip()
    style = manifest.get("style_suffix", "").strip()
    pal = ", ".join(palette_hexes())
    text = p.replace("{palette}", pal).replace("{style}", style)
    for name, sheet in (manifest.get("designs") or {}).items():   # *politician* -> design sheet
        text = text.replace(f"*{name}*", str(sheet).strip())
    if "{style}" not in asset["prompt"] and style:
        text = f"{text}\n{style}"
    if "{palette}" not in asset["prompt"] and asset.get("post", {}).get("kind") in ("sheet", "tiles", "single"):
        text += f"\nUse only these colours: {pal}."
    if asset.get("template"):
        tm = pixelize.template_meta(asset["template"])
        text = (f"Fill the attached magenta grid template EXACTLY: {tm['cols']} columns x {tm['rows']} rows of "
                f"equal square cells, one item per cell, centred, nothing crossing cell borders, background "
                f"solid magenta #FF00FF everywhere else. " + text)
    if note:
        text += f"\nIMPORTANT CORRECTION: {note}"
    return text


def reference_paths(asset) -> list[Path]:
    refs = []
    if asset.get("template"):
        refs.append(TEMPLATES / f"{asset['template']}.png")
    for r in asset.get("references", []):
        p = Path(r)
        if not p.is_absolute():
            p = px.REF_DIR / r
        if not p.exists():
            raise FileNotFoundError(f"{asset['id']}: reference {p} missing (run tools/slice_reference.py first)")
        refs.append(p)
    return refs


def params_for(manifest, asset, args):
    d = dict(manifest.get("defaults", {}))
    d.update({k: v for k, v in asset.items() if k in ("model", "quality", "resolution", "num_images",
                                                     "background", "moderation", "aspect_ratio", "seed")})
    if args.quality: d["quality"] = args.quality
    if args.n: d["num_images"] = args.n
    if args.model: d["model"] = args.model
    if args.resolution: d["resolution"] = args.resolution
    model = d.pop("model")
    if model.startswith("gpt-image-2"):
        params = dict(aspect_ratio=d.get("aspect_ratio", "square_1_1"), resolution=d.get("resolution", "1k"),
                      quality=d.get("quality", "high"), num_images=int(d.get("num_images", 1)),
                      output_format="png", background=d.get("background", "opaque"),
                      moderation=d.get("moderation", "low"))
    elif model.startswith("seedream-v5"):
        params = dict(aspect_ratio=d.get("aspect_ratio", "square_1_1"), resolution=d.get("resolution", "2k"))
        if d.get("seed") is not None: params["seed"] = int(d["seed"])
    elif model.startswith("seedream"):
        params = dict(aspect_ratio=d.get("aspect_ratio", "square_1_1"))
        if d.get("seed") is not None: params["seed"] = int(d["seed"])
    else:
        params = {}
    return model, params


def run_one(client, manifest, asset, args, note=None):
    prompt = build_prompt(manifest, asset, note)
    refs = reference_paths(asset)
    model, params = params_for(manifest, asset, args)
    dest = px.RAW_DIR / asset["id"]
    t0 = time.time()
    paths = client.generate(model, prompt, refs, dest, **params)
    if not args.dry_run:
        meta_path = dest / "meta.json"
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {"runs": []}
        meta["runs"].append({"time": time.strftime("%Y-%m-%d %H:%M:%S"), "model": model, "params": params,
                             "prompt": prompt, "references": [str(r.relative_to(px.ROOT)) for r in refs],
                             "files": [p.name for p in paths], "seconds": round(time.time() - t0), "note": note})
        meta_path.write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")
    return paths


# --------------------------------------------------------------------------- review html
def build_review(manifest, batch: str, ids: list[str]):
    palette = px.load_palette()
    out_dir = px.ensure_dir(px.REVIEW_DIR / batch)
    rows = []
    for aid in ids:
        asset = pixelize.asset_by_id(manifest, aid)
        raw_dir = px.RAW_DIR / aid
        cands = sorted(raw_dir.glob("v*.png")) + sorted(raw_dir.glob("manual.png")) if raw_dir.exists() else []
        refs = [p for p in reference_paths(asset) if "templates" not in str(p)]
        ref_html = "".join(f'<img class="ref" src="../reference/{html.escape(p.relative_to(px.REF_DIR).as_posix())}" title="{p.name}">'
                           for p in refs if p.suffix == ".png")
        cand_html = []
        for c in cands:
            try:
                frames, metrics = pixelize.process(asset, c, palette, write=False)
                strip = pixelize.strip_preview(frames, scale=3) if frames else None
            except Exception as e:  # noqa: BLE001
                frames, metrics, strip = [], {"error": {"pass": False, "reason": str(e)}}, None
            strip_name = f"{aid}_{c.stem}_strip.png"
            if strip is not None:
                strip.save(out_dir / strip_name)
            fails = [n for n, m in metrics.items() if not m.get("pass", True)]
            status = "PASS" if frames and not fails else f"CHECK {fails}"
            table = "".join(
                f"<tr><td>{html.escape(n)}</td><td>{m.get('width', '')}x{m.get('height', '')}</td>"
                f"<td>{m.get('palette_compliance_raw', 0):.2f}</td><td>{m.get('pitch_raw', '')}</td>"
                f"<td>{m.get('outline_ratio', 0):.2f}</td><td>{'ok' if m.get('pass', True) else 'FAIL'}</td></tr>"
                for n, m in metrics.items())
            cand_html.append(f"""
<div class="cand">
  <h4>{c.name} <span class="{'ok' if status == 'PASS' else 'bad'}">{html.escape(status)}</span></h4>
  <img class="raw" src="../raw/{aid}/{c.name}">
  {f'<img class="strip" src="{batch}/{strip_name}">' if strip is not None else ''}
  <table><tr><th>frame</th><th>size</th><th>palette</th><th>pitch</th><th>outline</th><th>gate</th></tr>{table}</table>
  <code>python tools/approve.py {aid} {c.stem}</code>
</div>""")
        rows.append(f"""
<section>
  <h2>{aid} <small>{html.escape(asset.get('batch', ''))} · {html.escape(asset.get('post', {}).get('kind', ''))}</small></h2>
  <div class="refs"><b>canonical references</b><br>{ref_html}</div>
  <details><summary>prompt</summary><pre>{html.escape(build_prompt(manifest, asset))}</pre></details>
  <div class="cands">{''.join(cand_html) or '<i>no candidates yet</i>'}</div>
</section>""")
    page = f"""<!doctype html><meta charset="utf-8"><title>review {batch}</title>
<style>
body{{background:#1b1d24;color:#eee;font:13px/1.4 system-ui;margin:20px}} h2{{border-bottom:1px solid #444;margin-top:40px}}
img{{image-rendering:pixelated;background:repeating-conic-gradient(#555 0 25%,#666 0 50%) 0 0/16px 16px}}
.ref{{height:160px;margin:4px}} .raw{{width:512px;display:block;margin:6px 0}} .strip{{max-width:100%;display:block;margin:6px 0}}
.cands{{display:flex;flex-wrap:wrap;gap:20px}} .cand{{background:#242833;padding:10px;border-radius:6px;max-width:560px}}
table{{border-collapse:collapse;font-size:11px}} td,th{{border:1px solid #444;padding:2px 6px}}
.ok{{color:#7ddf7d}} .bad{{color:#ff6b6b}} code{{background:#000;padding:2px 6px;display:inline-block;margin-top:6px}}
pre{{white-space:pre-wrap;background:#111;padding:8px}}
</style>
<h1>Review — batch {html.escape(batch)}</h1>
<p>Compare each candidate (raw sheet + sliced frames at 3×) with the canonical references. Approve with the printed command, then
<code>npm run assets:pixelize &amp;&amp; npm run assets:pack &amp;&amp; npm run assets:verify</code>.</p>
{''.join(rows)}"""
    out = px.REVIEW_DIR / f"{batch}.html"
    out.write_text(page, encoding="utf-8")
    print(f"review -> {out}")


# --------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch", default=None, help="batch name from the manifest, or 'all'")
    ap.add_argument("--ids", nargs="*")
    ap.add_argument("--retry", help="asset id to regenerate once more (use with --note)")
    ap.add_argument("--note", help="correction appended to the prompt")
    ap.add_argument("--quality", choices=["low", "medium", "high"])
    ap.add_argument("--resolution", choices=["1k", "2k", "4k"])
    ap.add_argument("--n", type=int)
    ap.add_argument("--model")
    ap.add_argument("--force", action="store_true", help="regenerate even if approved")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--review-only", action="store_true")
    ap.add_argument("--concurrency", type=int, default=3)
    args = ap.parse_args()

    manifest = yaml.safe_load(MANIFEST.read_text(encoding="utf-8"))
    approved = pixelize.load_approved()
    assets = manifest["assets"]
    if args.retry:
        targets = [pixelize.asset_by_id(manifest, args.retry)]
        args.n = args.n or 1
    elif args.ids:
        targets = [pixelize.asset_by_id(manifest, i) for i in args.ids]
    elif args.batch:
        targets = assets if args.batch == "all" else [a for a in assets if a.get("batch") == args.batch]
    else:
        ap.error("give --batch, --ids or --retry")
    if not targets:
        print("nothing matched")
        return
    batch_name = args.batch or targets[0].get("batch", "adhoc")

    if not args.review_only:
        todo = [a for a in targets if args.force or args.retry or a["id"] not in approved]
        skipped = [a["id"] for a in targets if a not in todo]
        if skipped:
            print(f"skipping approved: {', '.join(skipped)}")
        client = MagnificClient(dry_run=args.dry_run)
        total_units = 0
        for a in todo:
            model, params = params_for(manifest, a, args)
            total_units += MagnificClient.estimate_units(model, params)
        print(f"{len(todo)} asset(s), ~{total_units:.0f} base units{' (dry run)' if args.dry_run else ''}")
        errors = []
        if args.dry_run or args.concurrency <= 1:
            for a in todo:
                try:
                    run_one(client, manifest, a, args, args.note if args.retry else None)
                except (MagnificError, FileNotFoundError) as e:
                    errors.append((a["id"], str(e)))
                    print(f"ERROR {a['id']}: {e}")
        else:
            with cf.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
                futs = {ex.submit(run_one, client, manifest, a, args, args.note if args.retry else None): a for a in todo}
                for f in cf.as_completed(futs):
                    a = futs[f]
                    try:
                        f.result()
                    except (MagnificError, FileNotFoundError) as e:
                        errors.append((a["id"], str(e)))
                        print(f"ERROR {a['id']}: {e}")
        if errors:
            print(f"{len(errors)} error(s)")
    if not args.dry_run:
        build_review(manifest, batch_name if batch_name != "all" else "all", [a["id"] for a in targets])


if __name__ == "__main__":
    try:
        main()
    except MagnificError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
