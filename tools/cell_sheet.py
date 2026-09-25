"""Indexed cell contact sheet for a generated grid image: python tools/cell_sheet.py raw.png cols rows out.png"""
import sys
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, 'tools'); import pixelize
src, cols, rows, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
img = Image.open(src).convert('RGBA'); cell = 128 if cols >= 8 else 192; pad = 6
sheet = Image.new('RGBA', (cols*(cell+pad), rows*(cell+pad)), (40,40,48,255))
d = ImageDraw.Draw(sheet); font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 16)
for i, c in pixelize.grid_cells(img, cols, rows):
    x, y = (i % cols)*(cell+pad), (i // cols)*(cell+pad)
    sheet.paste(c.resize((cell, cell), Image.NEAREST), (x+3, y+3))
    d.rectangle([x+3, y+3, x+40, y+22], fill=(0,0,0,200)); d.text((x+6, y+5), str(i), fill=(255,255,0,255), font=font)
sheet.save(out); print(out)
