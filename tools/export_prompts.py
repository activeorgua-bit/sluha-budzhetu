"""Export every prompt from tools/manifest.yaml into docs/PROMPTS.md (human-readable)."""
import sys
from pathlib import Path
import yaml
sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_assets as ga
import pixart as px

m = yaml.safe_load((px.ROOT / "tools" / "manifest.yaml").read_text(encoding="utf-8"))
out = ["# Generation prompts", "",
       "Exported from `tools/manifest.yaml` by `python tools/export_prompts.py`. Reference paths are relative to",
       "`assets_src/reference/`; the grid template named in *template* is always sent first.", ""]
batches = {}
for a in m["assets"]:
    batches.setdefault(a.get("batch", "misc"), []).append(a)
for b, assets in batches.items():
    out.append(f"## Batch {b}")
    for a in assets:
        out.append(f"### `{a['id']}`")
        meta = [f"model `{a.get('model', m['defaults']['model'])}`", f"aspect `{a.get('aspect_ratio', m['defaults']['aspect_ratio'])}`",
                f"resolution `{a.get('resolution', m['defaults']['resolution'])}`"]
        if a.get("template"): meta.append(f"template `{a['template']}`")
        out.append("- " + " · ".join(meta))
        if a.get("references"): out.append("- references: " + ", ".join(f"`{r}`" for r in a["references"]))
        out.append("- output: `" + str(a["post"].get("kind")) + "` -> " + ", ".join(
            [n for n in a["post"].get("names", []) if n][:12]) + (" …" if len([n for n in a["post"].get("names", []) if n]) > 12 else "")
                   if a["post"].get("names") else "- output: `" + str(a["post"].get("kind")) + "`")
        out.append("")
        out.append("```text")
        out.append(ga.build_prompt(m, a))
        out.append("```")
        out.append("")
(px.ROOT / "docs" / "PROMPTS.md").write_text("\n".join(out), encoding="utf-8")
print("docs/PROMPTS.md written,", len(m["assets"]), "assets")
