# Asset pipeline

Everything the game draws comes from two sources:

1. **Canonical art** — your three ChatGPT Image 2 sheets in `assets_src/reference/`
   (`sheet_sprites.png`, `mockup_level_1-2_skyline.png`, `mockup_level_1-3_bridge.png`).
   These are sliced, never redrawn: the politician, the journalist, the detective's base pose,
   14 props, the tile samples, the HUD icons and the 51-colour palette.
2. **Generated art** — every missing character pose, tileset, prop, parallax layer and story
   card, produced by Magnific's GPT Image 2 with the canonical crops as references, then pushed
   through the same slicer so it lands on the same grid, palette and baseline.

```
reference sheets ──slice_reference.py──▶ assets_src/frames/* + palette.json + crops/
                                                     │
manifest.yaml ──generate (connector or API)──▶ assets_src/raw/<id>/vNNN.png
                                                     │  review/<batch>.html  (side-by-side + gates)
                                          approve.py │
                                                     ▼
                                  pixelize.py ──▶ assets_src/frames/*  (chars 64px, props, tiles 32px)
                                                  public/assets/parallax/*, public/assets/story/*
                                                     │
                                  pack_atlas.py ──▶ public/assets/atlases/*.png+json, tilesets/*.png+json,
                                                    anims.json, manifest.json
                                                     │
                                  verify_assets.py, validate_levels.mjs  (run by npm run build)
```

## World scale v2 (level 1 regenerated, September 2026)

| Setting | v1 | v2 |
|---|---|---|
| Tile / character frame / baseline | 32 / 64 / 60 | 48 / 96 (wide 128) / 90 |
| Palette | 51 colours from the swatch strip | 120 colours (`tools/palette_seed.yaml` + `make_palette.py`) |
| Key colour | cream (it ate the white shirt) | magenta `#FF00FF` only |
| Sheet resolution | 1k | 2k for 4×4 / 8×8 sheets, 1k for backgrounds |

Manifest recipe fields added for v2:

- `slice: components` cuts a sheet by connected components (ordered into rows) instead of the grid ruler. Use it when the model drifts off the template, which item and prop sheets usually do.
- `sizes: {name: [w, h, fit|exact]}` gives a per-prop target box. `fit` keeps the aspect ratio and anchors the feet; `exact` fills the box, for pipes and blocks that must match the 48 px grid.
- Names prefixed `ui/` go to the `ui` atlas (HUD icons).
- `frame`, `frame_h` and `baseline` override the character frame per sheet. The `cells` override on a tileset recipe maps a tile name to a different source cell.

More recipe options added while fixing levels 1-1 and 1-2:

- `degrid: [names]` (tiles) removes template grid lines painted along tile edges. It handles near-black lines and tinted ones, such as dark teal on water. Use it only on tiles that must flow together: platforms over sky, spikes, water and ladders.
- `align_top: [names]` (tiles) moves one-way platform art to the tile's top edge, where it collides.
- `quantize: <int>` (bg) uses an adaptive palette of that many colours from the image itself. Vivid backgrounds keep their greens and blues, where the global palette would dull them.
- `crop_bottom: false` (bg) keeps bluish bottom rows, which river layers need.
- `fixup: <script>` runs `tools/<script>.py main()` after the asset is written. Two scripts use it: `fix_far_l11` keeps one landmark set and widens the strip so it never repeats, and `fix_b1_water` makes the bridge-level water tiles transparent because the river layer paints the water.
- Every non-sky layer gets `remove_wires`, which erases thin dark lines running across it. The model paints trolleybus wires that read as a rendering bug, so never ask for "wires" in a prompt.

Cables for crane hooks and hanging platforms are drawn in code (`Platforms.js`) from the top of the map. They continue the cable stubs painted on the sprite, and platform collision starts at the widest opaque row of the art, so rods and railings above the deck are decoration.

`clean_cell` keeps components ≥ 3 % of the largest body and drops detached bits under the feet (dust puffs). `defringe` (radius 2) and `clean_edge_specks` remove the magenta/white halo.

Sheets from v1 that are not regenerated yet are upscaled 1.5× once by `tools/legacy_upscale.py` (stamp: `assets_src/frames/.legacy_upscaled`). This covers the voters, oligarch, border guard, the w1-w3 tilesets and the props of levels 2-6. `pack_atlas.py` copies the shared hazard tiles (spikes, water, ladder, planks, blocks, scaffold) from w1 into every tileset.

## One-time setup

```bash
pip install -r tools/requirements.txt      # Pillow, numpy, requests, PyYAML, scipy (OpenCV optional)
npm install
```

## Step by step

### 1. Slice the canonical sheets
```bash
npm run assets:slice        # python tools/slice_reference.py
```
Writes `assets_src/frames/{chars,props,ui}`, `frames/tilesets/w1` (tiles derived from the samples),
`assets_src/reference/palette.json|.gpl`, `reference/crops/*` (full-resolution crops used as
generation references) and a review sheet `assets_src/review/canonical.png`. Look at that sheet:
every character must have its feet on the baseline and no caption fragments.

### 2. Generate candidates
Prompts, references and post-processing recipes for every asset live in `tools/manifest.yaml`
(batches: `calibration`, `A` characters, `C` tilesets, `B` props, `D` parallax, `E` story).
Two ways to run them:

**a) Magnific connector (what was used for this project).** Claude uploads the reference crops and the
magenta grid template, calls `images_generate` with `mode: gpt-2`, `quality: high`, `resolution: 1k`
(`2k` for tilesets) and the aspect ratio of the template (`2:1` for 4×2 sheets, `4:3` for 4×3,
`1:1` for 8×8 tile sheets, `16:9` skies and story cards, `21:9` far/mid strips), then saves the result:

```bash
python tools/import_candidate.py <asset_id> <result-url-or-file> [--note "..."]
```

**b) REST API** (`MAGNIFIC_API_KEY` in the environment or `.env`):
```bash
python tools/generate_assets.py --dry-run --batch all      # prints payloads, spends nothing
python tools/generate_assets.py --batch calibration --n 2
python tools/generate_assets.py --ids detective_sheet --quality high --n 2
python tools/generate_assets.py --retry babusya_sheet --note "feet must touch the baseline tick"
```

Either way candidates land in `assets_src/raw/<id>/vNNN.png` with a `meta.json` log, and
`assets_src/review/<batch>.html` shows each candidate next to its canonical references, the sliced
frames at 3× and the style-gate metrics.

### 3. Review and approve
Open the review page (or `python tools/cell_sheet.py raw.png 8 8 out.png` for an indexed cell sheet)
and pick a version:
```bash
python tools/approve.py detective_sheet v001
python tools/approve.py --list
```
If a single frame is wrong, fix it in Aseprite/Piskel and save the whole sheet as
`assets_src/raw/<id>/manual.png`, then approve `manual`. If the model shifted the grid (it merged
9-slice tiles into 7 cells on the W1 tileset), give the tile recipe an explicit `cells:` map in the
manifest (see `tiles_w1`): `name: index` or `name: [index, top|bottom|left|right]` (a half-cell
repeated, used to derive centre/edge tiles).

### 4. Pixelize, pack, verify
```bash
npm run assets:pixelize     # approved candidates -> frames / parallax / story
npm run assets:pack         # atlases, tilesets, anims.json, manifest.json
npm run assets:verify       # every frame/tile/layer the game references exists
npm run levels:validate     # honest route exists in every level
```

`pixelize.py` applies the style gates from `docs/ART_BIBLE.md`: palette compliance before quantize
(warn under 0.80), pixel pitch, 56 px character height, outline share. Gates are advisory —
a `GATE FAIL` on a white suit or police-blue band only means the colour was not in the 51-colour
palette and got snapped to the nearest one; look at the frame in the review page before rejecting.

### 5. Play-test
`npm run dev`, open `?dev=1`, press the level number. Enemies whose sheets are not approved yet fall
back to tinted canonical sprites with a label, so the game always runs.

## Naming rules

- Character frames: `<character>_<pose>[N]` (`detective_walk1`), 64 px tall, feet at y = 60, width 64 or 80.
- Props: `<name>` 32×32 (bottom-anchored) or 64×64; multi-tile props 96×32 / 96×48 / 128×128 / 320×128.
- Tiles: `<material>_{tl,t,tr,l,c,r,bl,b,br}` for autotiled ground, `<x>_plat_{l,r}` one-way, singles by name.
- Parallax: `public/assets/parallax/<levelId>/{sky,far,mid}.png` (960 wide; far/mid have the sky keyed out).
- Story cards: `public/assets/story/<name>.png`, 960×540.
- Animation clips: `tools/anims.json` (`clip -> {atlas, frames[], fps, repeat}`); missing frames are dropped with a warning.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing critical assets` on boot | run steps 1 and 4 |
| enemy shows a coloured politician with a label | its sheet is not approved/pixelized yet |
| tile looks stretched or half magenta | the cell was partially empty: point it to another cell with `cells:` |
| seam visible in a parallax layer | `python tools/make_parallax.py --check <png>`; regenerate with "seamlessly tileable" or blend manually |
| story card too dark after quantize | set `quantize: false` on that card in the manifest |
