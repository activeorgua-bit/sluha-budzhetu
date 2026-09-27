"""Favicon and home-screen icons from the politician's HUD portrait (pixel art, nearest-neighbour).

  python tools/make_favicon.py   -> public/favicon.ico (16/32/48), favicon-32.png, apple-touch-icon.png (180)

The face sits on the game's dark HUD colour with a thin gold ring, so it reads on light and dark tabs.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets_src" / "frames" / "ui" / "hud_portrait.png"
OUT = ROOT / "public"
BG = (11, 13, 18, 255)       # the page / HUD background
GOLD = (232, 182, 42, 255)   # the UI accent


def icon(size: int, face_scale: float = 0.86, ring: bool = True) -> Image.Image:
    face = Image.open(SRC).convert("RGBA")
    face = face.crop(face.getbbox())
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    r = max(1, size // 10)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG, outline=GOLD if ring else None,
                        width=max(1, size // 24))
    # integer (nearest-neighbour) scale when possible keeps the pixels crisp
    target = int(size * face_scale)
    k = target / max(face.size)
    fw, fh = max(1, round(face.width * k)), max(1, round(face.height * k))
    face = face.resize((fw, fh), Image.NEAREST)
    canvas.alpha_composite(face, ((size - fw) // 2, size - fh - max(1, size // 16)))
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sizes = {16: icon(16, 0.94, ring=False), 32: icon(32, 0.9), 48: icon(48)}
    sizes[48].save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
                   append_images=[sizes[16], sizes[32]])
    sizes[32].save(OUT / "favicon-32.png")
    icon(180, 0.8).save(OUT / "apple-touch-icon.png")
    print("favicon.ico, favicon-32.png, apple-touch-icon.png ->", OUT)


if __name__ == "__main__":
    main()
