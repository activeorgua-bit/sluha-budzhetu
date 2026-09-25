# Generation prompts

Exported from `tools/manifest.yaml` by `python tools/export_prompts.py`. Reference paths are relative to
`assets_src/reference/`; the grid template named in *template* is always sent first.

## Batch calibration
### `calib_politician`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/politician_walk1.png`, `crops/politician_walk2.png`, `crops/politician_jump.png`, `crops/palette_strip.png`
- output: `sheet` -> politician_idle_c, politician_walk1_c, politician_walk2_c, politician_jump_c, politician_idle_c2, politician_walk1_c2, politician_walk2_c2, politician_jump_c2

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of the SAME character as the reference images (reference 2-5 show him), redrawn pixel-for-pixel in the same style. THE POLITICIAN (the player): chubby middle-aged man, brown side-parted hair, thick dark eyebrows, smug half-smile, small eyes, dark navy suit jacket, white shirt, red tie, dark trousers, black shoes. Cells row-major: 1 idle standing facing right, 2 walk frame A (left leg forward), 3 walk frame B (right leg forward), 4 jump with one fist raised, 5 idle standing, 6 walk frame A, 7 walk frame B, 8 jump. Feet on the baseline tick of every cell, same size in every cell (the character fills about 85% of the cell height).
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `calib_journalist`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/journalist_idle.png`, `crops/journalist_walk1.png`, `crops/journalist_mic.png`, `crops/journalist_camera.png`, `crops/palette_strip.png`
- output: `sheet` -> journalist_idle_c, journalist_walk1_c, journalist_walk2_c, journalist_mic_c, journalist_camera_c, journalist_idle_c2, journalist_walk1_c2, journalist_walk2_c2

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of the SAME character as the reference images, redrawn in the same style. THE JOURNALIST: slim man with black rectangular glasses, messy dark hair, black jacket with a white PRESS badge on the chest (a plain white rectangle, no readable letters), dark trousers, brown shoes. Cells row-major: 1 idle, 2 walk frame A, 3 walk frame B, 4 holding a microphone toward the right, 5 holding a camera at eye level, 6 idle, 7 walk A, 8 walk B. Feet on the baseline tick, same size in every cell.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

## Batch A
### `politician_extra`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/politician_walk1.png`, `crops/politician_jump.png`, `crops/palette_strip.png`
- output: `sheet` -> politician_fall, politician_throw1, politician_throw2, politician_hurt, politician_victory, politician_stunned, politician_walk3, politician_walk4

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. New poses of the SAME character as the reference images, identical design and style. THE POLITICIAN (the player): chubby middle-aged man, brown side-parted hair, thick dark eyebrows, smug half-smile, small eyes, dark navy suit jacket, white shirt, red tie, dark trousers, black shoes. Cells row-major: 1 falling with arms up and legs apart, 2 throwing a green banknote bundle (arm back, wind-up), 3 throwing (arm extended forward, banknote leaving the hand), 4 hurt: knocked back, eyes closed, mouth open, 5 victory: both arms raised, big grin, 6 stunned: dizzy, small stars over the head, 7 walk frame C (mid-step), 8 walk frame D (mid-step).
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `journalist_extra`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/journalist_idle.png`, `crops/journalist_camera.png`, `crops/journalist_walk1.png`, `crops/palette_strip.png`
- output: `sheet` -> journalist_flash1, journalist_flash2, journalist_bribed, journalist_flee1, journalist_flee2, journalist_stunned, journalist_walk3, journalist_walk4

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. New poses of the SAME character as the reference images, identical design and style. THE JOURNALIST: slim man with black rectangular glasses, messy dark hair, black jacket with a white PRESS badge on the chest (a plain white rectangle, no readable letters), dark trousers, brown shoes. Cells row-major: 1 raising the camera, flash bulb about to fire, 2 camera flash: white burst in front of the lens, 3 taking a money bag with a guilty smile (holding a small brown bag with a $), 4 running away scared, frame A, 5 running away scared, frame B, 6 stunned: dizzy with stars, 7 walk frame C, 8 walk frame D.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `detective_sheet`
- model `gpt-image-2-edit` · aspect `classic_4_3` · resolution `1k` · template `chars_4x3_256`
- references: `crops/detective_idle.png`, `crops/politician_idle.png`, `crops/journalist_idle.png`, `crops/palette_strip.png`
- output: `sheet` -> detective_idle_g, detective_walk1, detective_walk2, detective_throw1, detective_throw2, detective_emerge1, detective_emerge2, detective_bribed, detective_arrest, detective_search, detective_idle2, detective_walk3

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 3 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Full sprite sheet of the SAME character as reference image 2 (the detective in the trench coat), drawn in exactly the style and proportions of the other reference sprites. THE NABU DETECTIVE: man in a tan trench coat with a belt, brown fedora hat, white shirt, dark tie, dark trousers, brown shoes, serious face, carrying a small blue magnifying glass. Cells row-major: 1 idle standing, 2 walk frame A, 3 walk frame B, 4 throwing a white paper document (arm back), 5 throwing (arm extended, paper flying), 6 climbing out of a round manhole, only the upper body visible, 7 standing up next to the manhole, 8 taking a money bag, looking away guiltily, 9 holding up handcuffs, 10 looking through the magnifying glass, 11 idle variant (hands in pockets), 12 walk frame C.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `cop_sheet`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/journalist_walk1.png`, `crops/detective_idle.png`, `crops/palette_strip.png`
- output: `sheet` -> cop_idle, cop_walk1, cop_walk2, cop_bribed, cop_whistle, cop_idle2, cop_walk3, cop_walk4

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of a NEW character drawn in exactly the style and proportions of the reference sprites. THE PATROL OFFICER: stocky man in a dark navy police uniform with light-blue reflective bands on the chest and sleeves, black peaked cap with a small gold badge, black boots, friendly round face. Cells row-major: 1 idle standing, 2 walk frame A, 3 walk frame B, 4 saluting with a money bag under the other arm and a happy face, 5 blowing a whistle, 6 idle variant with hands on the belt, 7 walk frame C, 8 walk frame D.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `babusya_sheet`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/journalist_idle.png`, `crops/palette_strip.png`
- output: `sheet` -> babusya_idle, babusya_walk1, babusya_walk2, babusya_throw, babusya_wave, babusya_angry, babusya_walk3, babusya_bribed

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of a NEW character drawn in exactly the style and proportions of the reference sprites. THE GRANDMOTHER VOTER: short elderly woman, floral red-and-white headscarf, grey wool coat, long dark skirt, brown boots, round glasses, holding a glass jar of pickles. Cells row-major: 1 idle standing, 2 walk frame A, 3 walk frame B, 4 throwing the pickle jar (arm extended), 5 waving happily, 6 angry: shaking a fist, 7 walk frame C, 8 holding a bag of buckwheat and smiling.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `tracksuit_sheet`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/journalist_idle.png`, `crops/palette_strip.png`
- output: `sheet` -> tracksuit_idle, tracksuit_walk1, tracksuit_walk2, tracksuit_throw, tracksuit_wave, tracksuit_angry, tracksuit_walk3, tracksuit_bribed

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of a NEW character drawn in exactly the style and proportions of the reference sprites. THE COURTYARD GUY: young man in a black tracksuit with three white stripes down the sleeves and legs (no logo), black flat cap, white sneakers, squatting posture, holding a small paper cone of seeds. Cells row-major: 1 idle squatting, 2 walk frame A (standing), 3 walk frame B, 4 throwing a bottle (arm extended), 5 waving with a thumbs up, 6 angry: pointing forward, 7 walk frame C, 8 holding a money envelope and smirking.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `oligarch_sheet`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/journalist_idle.png`, `crops/palette_strip.png`
- output: `sheet` -> oligarch_idle, oligarch_dance1, oligarch_dance2, oligarch_offer, oligarch_laugh, oligarch_drink, oligarch_idle2, oligarch_dance3

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of a NEW character drawn in exactly the style and proportions of the reference sprites. THE OLIGARCH GUEST: heavy man in a white suit with a gold chain, black sunglasses, slicked black hair, holding a champagne glass, big grin. Cells row-major: 1 idle standing with the champagne glass, 2 dancing frame A (arms up), 3 dancing frame B (arms sideways), 4 offering a brown money bag forward, 5 laughing with the head back, 6 drinking, 7 idle variant, 8 dancing frame C.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `guard_sheet`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k` · template `chars_4x2_256`
- references: `crops/politician_idle.png`, `crops/detective_idle.png`, `crops/palette_strip.png`
- output: `sheet` -> guard_idle, guard_walk1, guard_walk2, guard_bribed, guard_block, guard_check, guard_call, guard_idle2

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 2 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sprite sheet of a NEW character drawn in exactly the style and proportions of the reference sprites. THE BORDER GUARD: tall man in an olive-green uniform with a peaked green cap, shoulder patches, black belt, dark trousers, holding a passport stamp. Cells row-major: 1 idle standing at attention, 2 walk frame A, 3 walk frame B, 4 pocketing an envelope with a wink, 5 blocking: arms crossed, stern face, 6 checking a passport, 7 talking into a radio, 8 idle variant, hands behind the back.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

## Batch C
### `tiles_w1`
- model `gpt-image-2-edit` · aspect `square_1_1` · resolution `2k` · template `tiles_8x8_128`
- references: `crops/tile_stone.png`, `crops/tile_brick.png`, `crops/tile_steel.png`, `crops/scaffold.png`, `crops/bridge_girder.png`, `crops/mockup_bridge_small.png`, `crops/palette_strip.png`
- output: `tiles` -> stone_tl, stone_t, stone_tr, stone_l, stone_c, stone_r, stone_bl, stone_b, stone_br, steel_tl, steel_t, steel_tr …

```text
Fill the attached magenta grid template EXACTLY: 8 columns x 8 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Tileset for a construction-site bridge level over a river, in exactly the style of the reference tiles (stone platform, brick platform, steel platform, scaffold). Each cell is ONE 32x32 tile drawn at 4x, filling its cell completely edge to edge, seamlessly tileable with its neighbours. Cells row-major. Row 1: stone top-left corner, stone top edge, stone top-right corner, stone left edge, stone centre fill, stone right edge, stone bottom-left, stone bottom edge. Row 2: stone bottom-right, steel top-left, steel top edge, steel top-right, steel left edge, steel centre, steel right edge, steel bottom-left. Row 3: steel bottom edge, steel bottom-right, brick top-left, brick top edge, brick top-right, brick left edge, brick centre, brick right edge. Row 4: brick bottom-left, brick bottom edge, brick bottom-right, rusty steel girder left end, girder middle, girder right end, cracked girder middle, river water surface with small waves. Row 5: water surface variant, deep water fill, grey metal spike cone on a base, wooden plank platform left half, wooden plank platform right half, rebar platform left half, rebar platform right half, scaffold top-left. Row 6: scaffold top-right, scaffold lower-left with X brace, scaffold lower-right with X brace, wooden ladder top, wooden ladder middle, brick block with rivets, riveted metal block, wooden crate. Row 7: wooden box with planks, striped hazard barrier, concrete block, dirt fill, empty, empty, empty, empty. Row 8: all empty (solid magenta).
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `tiles_w2`
- model `gpt-image-2-edit` · aspect `square_1_1` · resolution `2k` · template `tiles_8x8_128`
- references: `crops/tile_stone.png`, `crops/tile_brick.png`, `crops/tile_steel.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `tiles` -> marble_tl, marble_t, marble_tr, marble_l, marble_c, marble_r, marble_bl, marble_b, marble_br, carpet_l, carpet_m, carpet_r …

```text
Fill the attached magenta grid template EXACTLY: 8 columns x 8 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Tileset for two levels: the parliament interior (Verkhovna Rada: white marble, dark wood panels, red carpet, columns) and a Kyiv residential courtyard (asphalt, dirt, grass, concrete panels, playground). Exactly the style of the reference tiles. Each cell is ONE 32x32 tile at 4x, filling its cell edge to edge, seamlessly tileable. Cells row-major. Row 1: marble top-left, marble top edge, marble top-right, marble left edge, marble centre, marble right edge, marble bottom-left, marble bottom edge. Row 2: marble bottom-right, red carpet left end, red carpet middle, red carpet right end, dark wood panel top-left, wood panel top edge, wood panel top-right, wood panel left edge. Row 3: wood panel centre, wood panel right edge, wood panel bottom-left, wood panel bottom edge, wood panel bottom-right, white column capital, column shaft, column base. Row 4: marble balcony ledge left half, balcony ledge right half, asphalt top-left, asphalt top edge, asphalt top-right, asphalt left edge, asphalt centre, asphalt right edge. Row 5: asphalt bottom-left, asphalt bottom edge, asphalt bottom-right, dirt top-left, dirt top edge, dirt top-right, dirt left edge, dirt centre. Row 6: dirt right edge, dirt bottom-left, dirt bottom edge, dirt bottom-right, grass top edge with dirt below (variant A), grass top edge (variant B), grey concrete panel, green playground bar left half. Row 7: playground bar right half, wooden bench left half, wooden bench right half, parliament voting desk, empty, empty, empty, empty. Row 8: all empty.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `tiles_w3`
- model `gpt-image-2-edit` · aspect `square_1_1` · resolution `2k` · template `tiles_8x8_128`
- references: `crops/tile_steel.png`, `crops/tile_stone.png`, `crops/mockup_bridge_small.png`, `crops/palette_strip.png`
- output: `tiles` -> parquet_tl, parquet_t, parquet_tr, parquet_l, parquet_c, parquet_r, parquet_bl, parquet_b, parquet_br, bar_l, bar_m, bar_r …

```text
Fill the attached magenta grid template EXACTLY: 8 columns x 8 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Tileset for two levels: a luxurious night party in a mansion (dark parquet floor, bar counter, stage, glass ledges, neon strips) and an airport (terminal floor, concrete, tarmac runway, baggage conveyor, runway lights). Exactly the style of the reference tiles. Each cell is ONE 32x32 tile at 4x, filling its cell edge to edge, seamlessly tileable. Cells row-major. Row 1: parquet top-left, parquet top edge, parquet top-right, parquet left edge, parquet centre, parquet right edge, parquet bottom-left, parquet bottom edge. Row 2: parquet bottom-right, bar counter left end, bar counter middle, bar counter right end, stage edge left half, stage edge right half, glass ledge left half, glass ledge right half. Row 3: pink neon strip, cyan neon strip, tarmac top-left, tarmac top edge, tarmac top-right, tarmac left edge, tarmac centre, tarmac right edge. Row 4: tarmac bottom-left, tarmac bottom edge, tarmac bottom-right, terminal floor top-left, terminal floor top edge, terminal floor top-right, terminal floor left edge, terminal floor centre. Row 5: terminal floor right edge, terminal floor bottom-left, terminal floor bottom edge, terminal floor bottom-right, baggage conveyor belt frame A, conveyor belt frame B, runway light strip A (lights on), runway light strip B (lights off). Row 6: concrete top-left, concrete top edge, concrete top-right, concrete left edge, concrete centre, concrete right edge, concrete bottom-left, concrete bottom edge. Row 7: concrete bottom-right, velvet rope post, empty, empty, empty, empty, empty, empty. Row 8: all empty.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

## Batch B
### `props_common`
- model `gpt-image-2-edit` · aspect `square_1_1` · resolution `1k` · template `props_8x8_128`
- references: `crops/coin.png`, `crops/question_block.png`, `crops/crate.png`, `crops/money_bag.png`, `crops/warrant.png`, `crops/palette_strip.png`
- output: `sheet` -> coin_spin1, coin_spin2, coin_spin3, coin_spin4, cash, newspaper, jar, manhole, checkpoint_flag, siren, campaign_poster, trash_can …

```text
Fill the attached magenta grid template EXACTLY: 8 columns x 8 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sheet of small game props in exactly the style of the reference props (gold coin, question block, crate, money bag). Each cell holds ONE prop, centred, sized to fill about 80% of the cell. Cells row-major. Row 1: gold coin seen from the front, gold coin turned 30 degrees, gold coin edge-on (thin), gold coin turned 60 degrees, stack of green banknotes with a gold band, folded newspaper with a red headline bar, glass jar of pickles, round iron manhole cover. Row 2: small blue-and-yellow flag on a pole, red rotating police light, campaign poster on a board with a portrait silhouette (no letters), green trash can, small wooden bench, ballot box with a slot, wooden gavel, brown paper envelope. Row 3: white paper document with a red stamp, mobile phone, bottle of champagne, cocktail glass, suitcase, passport booklet, boarding pass card, small potted plant. Rows 4-8: all empty.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `props_big`
- model `gpt-image-2-edit` · aspect `square_1_1` · resolution `1k` · template `props_4x4_256`
- references: `crops/hook_block.png`, `crops/sign_reform.png`, `crops/tile_steel.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `sheet` -> kiosk, lamp_post, birch, rostrum, chandelier, seat_row, carpet_beater, garage_door, dj_table, disco_ball, champagne_tower, velvet_rope …

```text
Fill the attached magenta grid template EXACTLY: 4 columns x 4 rows of equal square cells, one item per cell, centred, nothing crossing cell borders, background solid magenta #FF00FF everywhere else. Sheet of larger scenery props (each 64x64 game pixels) in exactly the style of the reference props. Each cell holds ONE prop centred, filling about 85% of the cell, bottom of the prop on the baseline tick. Cells row-major. Row 1: Kyiv street kiosk with a small awning, cast-iron street lamp post, white birch tree, parliament speaker rostrum with a microphone. Row 2: crystal chandelier, row of red parliament seats, carpet beating rack (metal frame), rusty garage door. Row 3: DJ table with turntables, mirror disco ball hanging on a chain, champagne glass tower, red velvet rope on two gold posts. Row 4: airport luggage cart with bags, walk-through metal detector gate, airport departures board (blank screen, no letters), small yellow airport tug vehicle.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `prop_boarding_stairs`
- model `gpt-image-2-edit` · aspect `square_1_1` · resolution `1k`
- references: `crops/hook_block.png`, `crops/tile_steel.png`, `crops/palette_strip.png`
- output: `single` -> boarding_stairs

```text
A single game prop on a solid magenta #FF00FF background: mobile airplane boarding stairs with a white railing and a small platform at the top, side view facing left, in exactly the style of the reference props. Centred, filling about 80% of the image, no other objects.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `prop_private_jet`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k`
- references: `crops/hook_block.png`, `crops/tile_steel.png`, `crops/palette_strip.png`
- output: `single` -> private_jet

```text
A single game prop on a solid magenta #FF00FF background: small white private jet with a blue stripe, side view facing right, door open with the stairs down, in exactly the style of the reference props. Centred, filling about 85% of the image width, no other objects.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `prop_billboard_campaign`
- model `gpt-image-2-edit` · aspect `standard_3_2` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/sign_reform.png`, `crops/palette_strip.png`
- output: `single` -> billboard_campaign

```text
A single game prop on a solid magenta #FF00FF background: a large street campaign billboard on two metal posts showing a big portrait of THE POLITICIAN (reference 1) smiling and pointing, with a blue-and-yellow banner stripe, no readable letters. Exactly the style of the reference sprites.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

### `prop_balcony`
- model `gpt-image-2-edit` · aspect `horizontal_2_1` · resolution `1k`
- references: `crops/tile_steel.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `single` -> balcony

```text
A single game prop on a solid magenta #FF00FF background: a Kyiv apartment balcony platform seen from the side, flat on top so a character can stand on it, concrete slab with a rusty ornate railing, a potted plant and a hanging towel. Exactly the style of the reference tiles.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
Use only these colours: #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C.
```

## Batch E
### `title_screen`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/journalist_camera.png`, `crops/detective_idle.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `card`

```text
Title screen illustration: THE POLITICIAN on a Kyiv rooftop at golden hour hiding a money bag behind his back and waving; THE JOURNALIST aiming a camera and THE NABU DETECTIVE peeking from behind a chimney; Kyiv skyline with golden domes below; the lower third calm and darker for the title. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_intro`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference: THE POLITICIAN (reference 2: chubby man, brown hair, navy suit, red tie) stands at a podium with microphones in front of the Kyiv skyline with golden domes, confetti in the air, a crowd silhouette at the bottom. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_world2`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprite: THE POLITICIAN walks up the marble steps of the parliament building with columns, a blue-and-yellow flag on top, pigeons. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_world3`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprite: THE POLITICIAN at night in front of a lit mansion gate with a black limousine, a party glow in the windows, a distant airplane in the sky. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_honest_beach`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprite: THE POLITICIAN relaxing on a sunny beach in a deck chair, sunglasses, a book, a cocktail, calm sea, palm tree. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_honest_election`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/journalist_camera.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprites: election night, THE POLITICIAN on a stage raising both arms, cheering crowd with blue-and-yellow flags, journalists with cameras flashing, confetti, a big blank scoreboard (no letters). No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_escape_jet`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/money_bag.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprites: THE POLITICIAN sneaking up the stairs of a small private jet at dusk carrying two overstuffed brown money bags with $ signs, runway lights, a nervous glance over the shoulder. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_escape_villa`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/detective_idle.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprites: THE POLITICIAN on the terrace of a seaside villa with a cocktail, sweating, while at the garden gate two men in tan trench coats and fedoras (like reference 2) are peeking in. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_arrest_tarmac`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/detective_idle.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprites: on the airport tarmac at the foot of airplane stairs, two NABU detectives in tan trench coats and fedoras (reference 2) handcuff THE POLITICIAN (reference 1), a money bag spilling coins on the ground, a white van with a blue stripe behind. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_arrest_court`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/journalist_camera.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprites: courtroom, THE POLITICIAN inside a glass defendant box looking sad, a judge with a gavel, a crowd of journalists (reference 2) with flashing cameras. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `story_gameover`
- model `gpt-image-2-edit` · aspect `widescreen_16_9` · resolution `1k`
- references: `crops/politician_idle.png`, `crops/palette_strip.png`
- output: `card`

```text
Pixel-art story illustration in exactly the style of the reference sprite: THE POLITICIAN sitting on the curb of a rainy Kyiv street at night under a broken street lamp, torn campaign posters on the wall, a collapsed bridge in the distance. No text.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

## Batch D
### `bg_l11_sky`
- model `gpt-image-2` · aspect `widescreen_16_9` · resolution `1k`
- output: `bg`

```text
Pixel-art daytime sky for a retro platformer: soft blue gradient, a few chunky white pixel clouds, no ground, no buildings, no characters, no text. Seamlessly tileable horizontally. 16-bit style, crisp pixels, no gradients other than banded sky tones. #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l11_far`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Distant Kyiv skyline strip for a side-scrolling platformer in exactly the style of the reference mockup: golden domes of St Sophia, the Motherland monument silhouette, TV tower, hills, apartment blocks, all in muted blue-grey distance tones on a transparent-looking plain light-blue sky band. No characters, no text, seamlessly tileable horizontally, flat horizon at the bottom.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l11_mid`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Mid-distance Kyiv street facades strip for a side-scrolling platformer in exactly the style of the reference mockup: 5-storey Khrushchyovka apartment blocks and old Podil houses with balconies, shop awnings, trolleybus wires, chestnut trees, in slightly muted tones. No characters, no text, seamlessly tileable horizontally, flat bottom edge at street level.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l12_sky`
- model `gpt-image-2` · aspect `widescreen_16_9` · resolution `1k`
- output: `bg`

```text
Pixel-art bright daytime sky with chunky white pixel clouds for a retro platformer, no ground, no buildings, no characters, no text, seamlessly tileable horizontally, 16-bit banded tones. #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l12_far`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_bridge_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Distant right-bank Kyiv skyline seen across the Dnipro for a side-scroller, exactly the style of the reference mockup: green hills, golden church domes, the Motherland monument, apartment towers, muted distance tones. No characters, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l12_mid`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_bridge_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Mid-distance strip of construction cranes, bridge piers, concrete pylons and rusty scaffolding along the Dnipro river bank for a side-scroller, exactly the style of the reference mockup. No characters, no text, seamlessly tileable horizontally, flat bottom edge at water level.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l21_sky`
- model `gpt-image-2` · aspect `widescreen_16_9` · resolution `1k`
- output: `bg`

```text
Pixel-art interior back wall of a grand parliament hall: cream marble wall with tall windows, a wide blue-and-yellow flag banner, gold trim, chandeliers hanging from a coffered ceiling. No people, no text, seamlessly tileable horizontally, 16-bit retro platformer style, crisp pixels. #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l21_far`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/tile_stone.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of parliament hall columns and a balcony gallery with rows of empty red seats, in exactly the pixel-art style of the reference. No people, no text, seamlessly tileable, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l21_mid`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/tile_stone.png`, `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of parliament benches with voting button panels, microphones and scattered papers, in exactly the pixel-art style of the reference. No people, no text, seamlessly tileable, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l22_sky`
- model `gpt-image-2` · aspect `widescreen_16_9` · resolution `1k`
- output: `bg`

```text
Pixel-art warm evening sky with orange and pink bands and small clouds for a retro platformer, no ground, no characters, no text, seamlessly tileable horizontally. #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l22_far`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of 9-storey panel apartment blocks with satellite dishes and glazed balconies, typical Kyiv residential district, in exactly the pixel-art style of the reference mockup, muted distance tones. No people, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l22_mid`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of a Kyiv courtyard: 5-storey Khrushchyovka facade with an entrance door and a bench, metal garages, a carpet beating rack, poplar trees, clotheslines, in exactly the pixel-art style of the reference mockup. No people, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l31_sky`
- model `gpt-image-2` · aspect `widescreen_16_9` · resolution `1k`
- output: `bg`

```text
Pixel-art night sky over Kyiv seen through tall mansion windows: deep blue, stars, a moon, city lights far below; dark interior wall with gold frames around the windows. No people, no text, seamlessly tileable horizontally, 16-bit retro platformer style. #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l31_far`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of a luxurious party interior: red velvet curtains, gold-framed paintings, wall sconces, a long bar with bottles, in exactly the pixel-art style of the reference. No people, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l31_mid`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_skyline_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of party furniture: leather sofas, tables with champagne glasses, speakers with neon light strips, balloons, in exactly the pixel-art style of the reference. No people, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l32_sky`
- model `gpt-image-2` · aspect `widescreen_16_9` · resolution `1k`
- output: `bg`

```text
Pixel-art sunset sky over an airport: orange to purple bands, a few thin clouds, a distant control tower silhouette and a landing airplane far away. No text, seamlessly tileable horizontally, 16-bit retro platformer style. #CAEAF8, #4AA5D9, #177199, #176E97, #126A94, #075D86, #074B6D, #093F5B, #C4803D, #B06C2E, #93541D, #774213, #6E3C0F, #572E09, #A53A12, #9B3A13, #8E4813, #734215, #5A3816, #482D12, #2E2F2E, #343434, #535352, #504F4D, #7E7C77, #74736E, #EDB137, #DD9111, #10100F, #1D1D1C, #52A231, #46982E, #2D8127, #175B1E, #0E3B1A, #E4A56C, #CA8551, #A26231, #7D471C, #5B3313, #AB682C, #623818, #402A1A, #321E0F, #293941, #8C8A88, #AF2E27, #7A461F, #000000, #FFFFFF, #1C1C1C
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l32_far`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_bridge_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of an airport terminal glass facade with a control tower, parked airliners and jet bridges, in exactly the pixel-art style of the reference mockup, muted distance tones. No people, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```

### `bg_l32_mid`
- model `gpt-image-2-edit` · aspect `banner_3_1` · resolution `1k`
- references: `crops/mockup_bridge_small.png`, `crops/palette_strip.png`
- output: `bg`

```text
Strip of the airport apron: fuel trucks, luggage carts, cones, runway lights and a fence, in exactly the pixel-art style of the reference mockup. No people, no text, seamlessly tileable horizontally, flat bottom edge.
STYLE LOCK: 16-bit retro platformer pixel art exactly like the reference sprites: crisp square pixels (each art pixel is a clean 4x4 block at this size), no anti-aliasing, no blur, no gradients, 1-pixel dark outline around every shape, flat cel shading with 2-3 tones per colour and light from the top-left, chibi proportions (big head, short body). No text, no letters, no labels, no captions, no watermark, no drop shadows, no ground plane, no background scenery.
```
