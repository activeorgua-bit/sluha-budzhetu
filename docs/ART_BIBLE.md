# Art bible

The look is fixed by three canonical ChatGPT Image 2 sheets in `assets_src/reference/`. Everything
else is generated *from* them and measured *against* them.

## Style
16-bit retro platformer pixel art, bright and saturated like the mockups. Chibi proportions (big head,
short body, ~84 px tall in a 96 px frame — world scale v2, 1.5× the original 64 px sheets). Crisp square pixels, no anti-aliasing, no gradients. 1-pixel dark outline around every
shape. Flat cel shading, 2–3 tones per colour, light from the top-left. No text inside sprites
(captions are rendered in-game so they can be localised).

## Palette (v2, 120 colours)
`tools/palette_seed.yaml` → `python tools/make_palette.py` → `assets_src/reference/palette.json` / `.gpl`:
authored bright ramps (sky, suit navy, shirt, tie red, skin, hair, coat tan, gold, money green, pipe green,
park green, autumn, tulip, university red, brick, wood, steel, paving, facades, roof, water, hazard, flag,
purple) plus 24 k-means colours sampled from the mockups. `palette_v1.json` keeps the old 51-colour set,
which was sampled from the sheet's swatch strip:
sky (2), water (6), warm browns (6), brick/wood (6), dark steel/greys (6), hazard yellow/black (4),
pipe greens (5), skin (5), hair (4), clothing (4) + black, white, outline `#1C1C1C`.
Every generated frame, tile and card is quantized to this palette (no dithering). New materials that
sit outside it (police blue bands, olive uniform, white suit) snap to the nearest entry — accept this
unless the result reads wrong; the gate only warns.

## Frame specifications
| Kind | Size | Anchor | Notes |
|---|---|---|---|
| Character | 96 px tall, 96 or 128 wide | feet at y = 90, centred | sprite height 84 px; origin (0.5, 90/96) |
| Player hitbox | 42 × 78, 12 px from the top | | recentred per frame width every frame |
| Prop | 48 × 48 items; big props from the `sizes` table (pipes 96×96/96×144, bus stop 192×144, monument 216×336) | bottom-centre (coins: centre) | `fit` keeps aspect, `exact` fills the box |
| Tile | 48 × 48 | grid | autotile families `_tl _t _tr _l _c _c2 _c3 _c4 _r …`; one-way `*_plat_l/r` |
| Parallax | 960 wide | sky 960×540 top-left; far/mid bottom-anchored to the ground line | far/mid have their sky keyed out |
| Story card | 960 × 540 | | quantized to the palette |
| HUD | 48 × 48 icons (`ui` atlas: portrait, bag, clock, thermometer, heart) | | 66 px opaque black bar |

Animation clips: `tools/anims.json` — walk 2–4 frames at 8–10 fps, camera flash 10 fps, coin spin 8 fps.

## Style-match contract (measured by `tools/pixelize.py`)
| Property | Ground truth (canonical) | Gate |
|---|---|---|
| Palette compliance before quantize | 0.89–0.94 | ≥ 0.80 (warn) |
| Height in frame | 56 px | 48–60 |
| Outline share of silhouette edge | 0.47–0.79 | ≥ 0.40 |
| Pixel pitch | 4 px per art pixel at 1k (cells of 256 px → 64 px frames) | detected and resampled |
| Baseline | feet at y = 60 | enforced by the anchor step |
| Tiles | seamless left↔right / top↔bottom | seam score printed |

Calibration result (September 2026): regenerating the politician's own four poses from the prompt and
references produced frames indistinguishable from the originals (palette 0.89–0.93, height 56,
outline ≥ 0.85), which unlocked the generation of the other characters with the same settings.

## v2 regeneration (September 2026)
The v1 in-game art was keyed off a cream background, which also keyed the politician's white shirt
(it rendered transparent). v2 regenerates every level-1 sheet on **magenta**, which never occurs in a
sprite, at 2k (512 px cells for 4×4 sheets). Sheets that drift off the grid are cut with the component
slicer (`slice: components`) instead of the ruler. Levels 2-6 still use 1.5×-upscaled v1 art until
they are regenerated the same way.

## Edge cleanup (no white fringe)
Keyed backgrounds (cream on the canonical sheets, magenta on generated ones) leave a light blended
ring around every sprite. `pixart.defringe` erodes the opaque mask by 1 px (canonical) or 2 px
(generated, pitch 4) at source resolution and hands back only edge pixels that are genuinely dark
(the outline); `pixart.clean_edge_specks` then drops isolated bright edge pixels at frame resolution
while keeping contiguous light areas such as cuffs. Both run automatically in the slicer and pixelizer.

## Generation recipe (see `tools/manifest.yaml`)
References, in order: magenta grid template → canonical crops of the character (2–4) → palette strip →
(tiles/backgrounds) the level mockup. Prompt = grid instruction + design sheet + pose list + style lock +
"use only the colours of the palette strip". Model `gpt-2`, quality high, 1k (2k for tile sheets),
opaque magenta background keyed locally.

## What must never change
- The politician: chubby, brown side-parted hair, thick eyebrows, smug half-smile, navy suit, white shirt, red tie, black shoes.
- The journalist: black rectangular glasses, messy dark hair, black jacket, white PRESS badge, brown shoes.
- The detective: tan belted trench coat, brown fedora, white shirt, dark tie, blue magnifying glass.
- HUD layout: SCORE · LIVES (portrait) · BRIBES (bag) · LEVEL · TIME on a black bar, as in the mockups.
