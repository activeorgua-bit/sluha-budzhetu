# Magnific: connector and REST notes

Two ways to reach the same models. The project's art was generated through the **connector**;
the REST client is kept for unattended batch runs.

## Connector (Claude ↔ Magnific, browser login)

Tools used, in order:

| Tool | Purpose | Notes |
|---|---|---|
| `images_models_list` | pick the model | `gpt-2` = GPT Image 2 (references, transparentBackground, 1k/2k/4k, low/medium/high) |
| `creations_request_upload` → HTTP PUT → `creations_finalize_upload` | upload local references | PUT raw PNG bytes with `Content-Type: image/png`; finalize with the returned paths; identifiers are recorded in `tools/connector_uploads.json` |
| `simulate_cost` | exact credit cost before a run | 325 credits per 1k/high image, 600 per 2k/high (Sept 2026) |
| `images_generate` | generate | `references[]` = `{type:"image", identifier}` (max 12), `aspectRatio` ∈ 1:1, 2:1, 4:3, 16:9, 21:9 … (no 3:1), `count` 1–8 |
| `creations_wait` | block until done | up to 8 ids per call, 25 s per call; poll again while `processing` |
| `creations_get` | full-res URL | result URLs are temporary — `tools/import_candidate.py` downloads them immediately |

The account reported "unlimited" on the plan but not in this session, so each generation deducted
credits. This project's full run (calibration + 8 character sheets + 3 tilesets + 2 prop sheets +
2 single props + 18 parallax layers + 10 story cards, mostly 2 candidates per sheet) cost roughly
**23 000 credits**.

## REST API (`tools/magnific_client.py`)

- Base `https://api.magnific.com/v1`, header `x-magnific-api-key`.
- All generation endpoints are async: `POST` → `{data:{task_id,status,generated[]}}`, then
  `GET <same path>/<task_id>` until `COMPLETED` / `FAILED`.
- `POST /ai/text-to-image/gpt-image-2-edit`: `prompt`, `reference_images` (1–16, base64 or https),
  `num_images` 1–10, `resolution` 1k|2k|4k, `aspect_ratio` (square_1_1, classic_4_3, widescreen_16_9,
  horizontal_2_1, banner_3_1, film_horizontal_21_9 …), `quality` low|medium|high (×1/×4/×6 credits),
  `output_format` png, `background` opaque|auto, `moderation` auto|low.
- Alternatives wired in the client: `seedream-v5-pro-edit` (1–10 refs, seed), `seedream-v4-5-edit`,
  `mystic` (style/structure reference), `flux-2-pro`, `image-style-transfer`.
- Rate limits: 30 000 req/min per key, 50 hits/s per IP. The client retries 429/5xx with backoff,
  downloads results as soon as a task completes and logs every call to `assets_src/cost_log.csv`.

```bash
python tools/magnific_client.py --probe                     # validates the key, no credits
python tools/magnific_client.py --dry-run --model gpt-image-2-edit --prompt "..." --ref a.png
```

## Prompting rules that worked

1. Send the magenta grid template as reference 1 and say "fill the attached grid EXACTLY: N columns × M rows".
   GPT Image 2 keeps the geometry, removes the grid lines and centres one pose per cell.
2. Send the canonical crops of the character (2–4 poses) and the palette strip; describe the character
   in one fixed sentence (the design sheets in `tools/manifest.yaml`).
3. Ask for "each art pixel a clean 4×4 block" at 1k so a 256 px cell downsamples to a 64 px frame.
4. "Feet on the baseline tick of every cell, same size in every cell" gives consistent heights (56 px).
5. Use neutral wording ("money bag", "officer", "envelope") — no refusals occurred in 30 calls.
6. Tilesets: the model may merge 9-slice families into fewer cells; map them with `cells:` instead of
   regenerating. Tiles of 32 px come from 2k sheets (256 px cells, pitch 8).
7. Far/mid parallax strips: ask for a flat sky above and a flat bottom edge; the pipeline keys the sky out
   and anchors the strip's bottom to the ground line.
