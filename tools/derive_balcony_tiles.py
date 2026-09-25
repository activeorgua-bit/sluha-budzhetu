"""Split the generated 96x48 balcony prop into w2 tiles: a slab row (one-way platform, walkable top)
and a railing row drawn above it. Run after pixelize: python tools/derive_balcony_tiles.py"""
import sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px

src = px.FRAMES_DIR / "props" / "balcony.png"
out = px.ensure_dir(px.FRAMES_DIR / "tilesets" / "w2")
im = Image.open(src).convert("RGBA")
w, h = im.size  # 96 x 48, bottom anchored
rail_h = h - 16
for i, pos in enumerate("lmr"):
    x0 = i * 32
    rail = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    rail.paste(im.crop((x0, h - 16 - 32, x0 + 32, h - 16)), (0, 0))
    rail.save(out / f"balcony_st_rail_{pos}.png")
    slab = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    slab.paste(im.crop((x0, h - 16, x0 + 32, h)), (0, 0))
    slab.save(out / f"balcony_st_{pos}.png")
print("balcony tiles written to", out)
