"""One-time migration of v1 frames (32 px grid) to the v2 48 px grid: nearest-neighbour x1.5.

  python tools/legacy_upscale.py          # idempotent: a stamp file prevents double scaling

Only an interim measure for levels that have not been regenerated yet: x1.5 of pixel art doubles
every other pixel. Regenerated v2 assets overwrite these files.
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixart as px  # noqa: E402

STAMP = px.FRAMES_DIR / ".legacy_upscaled"


def upscale(path: Path, factor: float = 1.5):
    im = Image.open(path).convert("RGBA")
    im.resize((round(im.width * factor), round(im.height * factor)), Image.NEAREST).save(path)


def main():
    if STAMP.exists():
        print("already upscaled (delete assets_src/frames/.legacy_upscaled to force)")
        return
    n = 0
    for p in px.FRAMES_DIR.rglob("*.png"):
        upscale(p)
        n += 1
    STAMP.write_text("v1 frames scaled x1.5 to the 48 px grid\n", encoding="utf-8")
    print(f"upscaled {n} legacy frames x1.5")


if __name__ == "__main__":
    main()
