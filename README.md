# Слуга Бюджету / Servant of the Budget

A satirical pixel-art platformer about the price of corruption in Ukrainian politics.
You play a member of parliament. Every coin you pick up is a "thank-you" — and every thank-you
brings an anti-corruption journalist behind you and a NABU detective ahead. Collect nothing, reach
the airport clean, and the voters re-elect you. Collect everything and see how fast the bridges fall.

Built with **Phaser 3.90 + Vite** (plain ES modules). All art is generated through **Magnific**
(GPT Image 2) from three canonical sprite sheets and processed by a Python pipeline that slices,
palette-locks and packs everything into atlases.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # static site in dist/ (runs asset + level validation first)
```

The campaign has **eight levels plus a secret bonus level**:

| World | Levels |
|---|---|
| 1 Kyiv | 1-1 street + Shevchenko University park · 1-2 Dnipro bridge |
| 2 Parliament | 2-1 Mariinsky park (boss: animator in a Patron costume) · 2-1B secret Stalin-era bunker (bonus, boss rat with a balalaika) · 2-2 Rada corridors · 2-3 session hall (boss: the Speaker) |
| 3 The fall | 3-1 the oligarch’s party (the mafia boss’s offer: Yes / No) · 3-2 block district at golden hour (boss: the gopnik gang, exit by taxi) · 3-3 central railway station (ticket, train) → finale |

**Chestnuts** are the honest weapon: shake chestnut trees (E), pick them up in parks, throw them with L / C.
They stun enemies and hurt bosses, and never add corruption. In the bunker, "Kapital" books hit harder.
The park hides a hatch into the bunker, and both the Rada door and the bunker exit lead to the corridors.

**Conscience and alcohol.** Bribes, money bags and bad deeds (stunning grannies and kids) fill the purple
conscience bar under the heat bar. At 100, remorse paralyses you for a few seconds. Whisky (street kiosks, E, 3
bribes; hidden in a Rada office) or Soviet vodka (the bunker) silences it, but you walk slower, stagger and throw
crooked. An honest politician never needs a drink.

**The inner voice** comments on the level and on what you do, like a book narrator, and gets more cynical the
more you steal (`src/config/narration.js`, Ukrainian and English). The endings (train breakdown with NABU or karma; Europe with a country choice; re-election for an honest run)
are described in [docs/ROADMAP.md](docs/ROADMAP.md).

Open `http://localhost:5173/?dev=1` for the dev menu (dev mode starts muted; add `&sound=1` to hear it): keys `1`–`6` jump to a level, `H` raises heat,
`N` finishes the level, `G` toggles invulnerability, `F` forces a finale. `?debug=1` shows physics bodies.

## Controls

| Key | Action |
|---|---|
| ← → / A D | move |
| Space / W / ↑ | jump (hold for height) |
| J / Z | throw cash (bribe attempt) |
| K / X | black PR (scares journalists) |
| L / C | throw a chestnut (or a "Kapital" book) |
| E | interact: shake a chestnut tree, buy whisky at a kiosk, open the secret hatch, party guests |
| P / Esc | pause menu: resume, save, load, help, main menu |
| F1 / H | help: controls, rules and a sprite legend (← → switch pages) |
| R · M · L | restart from checkpoint · mute · language (menu) |

## Saving

An autosave is written at the start of every level; the pause menu saves into three manual slots.
A save stores the state at the *start* of the current level (score, bribes, heat, lives), so reloading
never lets you collect the same coins twice. **Continue** on the title screen loads the newest save.
Saves live in `localStorage['sluha.v1']`.

## Folder map

```
src/            game code (scenes, entities, systems, config, ASCII levels)
public/assets/  atlases, tilesets, parallax layers, story cards, font — generated, do not hand-edit
assets_src/     reference sheets, raw generated candidates, review pages, sliced frames
tools/          Python asset pipeline + Node level validator (see docs/ASSET_PIPELINE.md)
docs/           design, art bible, pipeline, API notes, level design, prompts
```

## Documentation

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — mechanics, balance tables, endings, story text
- [docs/ART_BIBLE.md](docs/ART_BIBLE.md) — palette, frame specs, style-match contract
- [docs/ASSET_PIPELINE.md](docs/ASSET_PIPELINE.md) — how to generate, review and pack graphics
- [docs/MAGNIFIC_API.md](docs/MAGNIFIC_API.md) — connector and REST notes, costs
- [docs/LEVEL_DESIGN.md](docs/LEVEL_DESIGN.md) — ASCII legend and the six levels
- [docs/PROMPTS.md](docs/PROMPTS.md) — every generation prompt (exported from `tools/manifest.yaml`)
