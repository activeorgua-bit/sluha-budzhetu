# Level design

Levels are text files in `src/levels/ascii/`: a JSON header, `===map` (18 rows of 48 px cells),
`===decor` (same size, letters → props from the header's `decor` table). Level 1-1 is written by `tools/author_level1.py` (coordinate canvas); `tools/author_levels.py`
writes the others from fixed-width chunks so rows never misalign; `node tools/validate_levels.mjs` checks
that a **zero-pickup route** and a corrupt route both reach the goal and every checkpoint.

## Legend
| Char | Meaning | Char | Meaning |
|---|---|---|---|
| `.` empty · `P` spawn · `G` goal · `K` checkpoint | | `#` solid, level material · `@` solid, second material |
| `=` brick block · `[` metal block · `x` crate · `w` wood box | | `%` scaffold (walk-through decor) · `\|` ladder (decor) |
| `-` one-way platform · `_` weak one-way (crumbles at tier ≥ 2) | | `B` crumbling bridge segment (runs merge) |
| `c` coin · `t` trap coin · `$` money bag · `?` question block | | `~` water · `^` spikes (both deadly) |
| `H` crane hook, `,` cells below = drop depth | | `m…*` horizontal mover path · `n…:` vertical mover path |
| `J`/`j` journalist always / tier ≥ 1 · `D`/`d` detective / tier ≥ 2 | | `C` officer · `V`/`v` voter · `W` guest · `Q` border guard · `s` sting manhole |
| `1`–`9` sign N from the header (`sprite`, localised `caption`) | | |

Header keys: `id, world, label, material, material2, subsoil, oneway, tileset, timeLimit, party, bgColor,
parallax[{key, scroll, y | bottomRow, lift, zone}], backfill[], signs[], decor{}`.
`zone: [fromCol, toCol]` shows a parallax strip only while the camera is inside those columns (street →
park cross-fade). `backfill: [{tile, from, to, row, tint}]` draws a shaded wall of that tile below the
ground line so trenches and pits do not show the sky (leave it out where water under a bridge should).

Decor entries are a frame name or an object: `{frame, w, solid: 'full'|'top', top}` makes the prop a
collider `w` tiles wide and `top` tiles high (`top` = one-way). Shaped props use
`solids: [{dx, w, top, solid}]`, e.g. the Shevchenko monument = wide one-way steps + a tall pedestal.
The validator understands both, so pipes, bins, bus-stop roofs, kiosks, billboards, balconies and benches
are real routes. Materials map to tileset families
(`stone/steel/brick` in w1, `marble/wood/asphalt/dirt` in w2, `parquet/concrete/tarmac/terminal` in w3).
`subsoil` (e.g. `dirt_c`) replaces the fill two or more rows below the surface so deep ground is not a
wall of identical blocks. `oneway` names the family used for `-` platforms (`balcony_st` street balconies
with railings drawn in the row above, `balcony` marble ledges, `bench`, `glass_plat`); hazards, blocks and
generic wooden planks are shared into every tileset by the packer.

## Authoring rules
1. Ground line is row 14 (y = 672); the player stands on rows 12–13. Standing jump reach: 3 tiles up, ~7 across.
2. Money is never on the mandatory route. Put it on optional ledges, above obstacles you can walk under,
   or in the air over gaps that can be crossed with a low jump. The validator forbids coin cells and the
   two cells above them for the honest pass.
3. Every gap ≤ 7 tiles; pits are `~` (or `^` over `~`). Bridges (`B`) always span water.
4. One checkpoint (`K`) every ~40 columns; a sting manhole (`s`) near each detective marker.
5. Tier-gated enemies (lowercase) make the corrupt run harder without touching the honest run.
6. Signs and decor tell the joke: reform billboards, NABU boards, kiosks, garages, chandeliers.

## The six levels
| Level | Chunks (left → right) |
|---|---|
| **1-1 Kyiv street + Shevchenko park** (180 cols) | street (cols 0-87): REFORM sign → green pipes and ? blocks → bin, journalist → bus-stop and kiosk roofs → road-works trench with a slab ledge → officer → campaign billboard with a trap coin → flooded pit with a mover and two balconies → checkpoint + manhole. Park (88-179): tulips, globe lamps, benches, hedge, chess table → Shevchenko monument (money bag above the statue) → fountain, pigeons, gated detective → pond → granite steps with a money bag → tall pipe and ? blocks → FACTS HURT sign, exit |
| **1-2 Dnipro bridge** (150 cols, `tools/author_level12.py`, follows the bridge mockup) | dark pier with a brick row and ? block, BRIDGES sign, road-works sign, concrete pipes, green pipe → truss bridge on an X-braced tower with a crane hook → pier with barrel, crates (money bag above), journalist, ? blocks, bin → open water crossed on a scaffold hanging on cables → sandstone pier with checkpoint, site cabin (standable roof), gated detective, TV camera → long bridge on two towers under a second hook, coin arc with a marked bill → pier with a tall pipe, brick row, concrete barrier, campaign billboard → last bridge → sandstone pier with a fisherman, checkpoint, crates, TV camera, FACTS HURT, exit |
| **2-1 Parliament** (140 cols) | rostrum → seat-row stairs with coins → marble columns with a ? block → checkpoint + detective → lift to a gallery of coins → spiked pit → journalists + manhole → ? blocks and a high money bag → checkpoint + detective → exit |
| **2-2 Courtyard** (120 cols) | benches → two voters → garage roofs → carpet beater ledge with coins, checkpoint, voter → open sewer with a money bag in the air → voters (one gated) + journalist → trap coin cluster + manhole → checkpoint + garages → exit |
| **3-1 Party** (140 cols) | oligarch at the door → coin-lined dance floor (walk under) → stage with money bags → bar counter → checkpoint, guests, journalist → lift to the VIP balcony → pool gap with a moving platform → raid zone (gated detectives, manhole) → checkpoint + coin line with a trap → exit |
| **3-2 Airport** (118 cols) | departures board → conveyor over a baggage chute → checkpoint + detective + coin ledge → gate pillars with a ? block → gated journalist/detective + manhole → lift to the lounge (money bag) → spiked pit → checkpoint + border guard → boarding stairs and the jet |

The airport goal resolves the ending: clean run → vacation and re-election; paid guard and heat < 55 →
escape; otherwise arrest.


## World 2: the chestnut campaign (`tools/author_world2.py`)
New legend characters: `T` chestnut tree (E shakes 3-4 chestnuts, 3 times) · `o` chestnut on the ground ·
`b` "Kapital" book · `L` old lady · `k` kid · `r` rat · `A` assistant (harmless) · `O` opposition MP ·
`F` female journalist · `M` seated MP (spectator) · `X` boss (`meta.boss.type`) · `Z` secret hatch (`meta.secret`).
Chestnuts and books are free ammo, never corruption, so the validator ignores them. A boss level's goal stays
locked until the boss is beaten (chestnuts) or bribed (the corrupt way out). `LEVELS[].next` routes the park
and the bunker to the corridor. `sprite: "plaque"` draws a caption-only sign in code.

| Level | Chunks |
|---|---|
| **2-1 Mariinsky park** (180 cols) | chestnut alley (trees, chestnuts, old lady, kid, balustrade terrace) → fountain plaza (journalist, cop, gated detective) → granite steps with a money bag → thujas hiding the secret hatch → terraces, more old ladies and kids → the Rada plaza: boss (animator in a Patron costume: dashes, jumps with shockwaves, begs for tips) guards the parliament door |
| **2-1B Bunker** (bonus, 120 cols) | blast doors, Lenin busts, posters, a vintage desk and bookshelf (standable), phones, radio, CRT TV, bunk bed; rats in ushankas; "Kapital" books; a flooded passage under a catwalk; boss rat with a balalaika (music notes); exit to the corridor |
| **2-2 Rada corridor** (160 cols) | marble columns, curtained windows, chandeliers; journalists (m/f), opposition MPs throwing chocolate, harmless assistants, a security officer, gated detective, mezzanine balustrades with coins |
| **2-3 Session hall** (64 cols, boss arena) | seat-row tiers with MPs who lob chestnuts; the Speaker: gavel shockwaves (jump them), flying draft laws, belly charge; below half health he calls a vote and the whole hall throws |

## World 3: the fall (`tools/author_world3.py`)
New legend characters: `N` bandit · `R` party MP (harmless) · `h` gopnik (beer bottles) · `i` angry citizen (eggs,
only when the district is hostile) · `Y` dog · `I` dog walker · `!` falling balcony / panel (hostile only).
Meta keys: `goal: "taxi" | "train"` (the exit needs money / a ticket), `materialZones` (a different material for
a column range, e.g. the red sport court), `bridgeTile` (a tileset tile as the bridge deck) and `bridgeHostileOnly`,
parallax `zone` may list several ranges. Decor `shop: "ticket"` sells the train ticket.

| Level | Chunks |
|---|---|
| **3-1 The party** (150 cols) | villa gate, buffet, DJ table, sofa with whisky → pool with glass platforms → lion, piano with a bag, supercar roof, gifts, the open safe → second pool → palms, bandits, MPs, journalists → the mafia boss and his offer |
| **3-2 Block district** (230 cols) | yards (block entrances, falling balconies, sandbox, swings, garages, bins, a chestnut tree, liquor kiosk) → sport court with gopniks and workout bars → dog park → riverside lawn and the wave footbridge over the bay → street with cops and detectives → the gopnik gang → taxi |
| **3-3 Railway station** (120 cols) | ticket office (E) → departures board, seats, turnstiles, cops everywhere, detective, trolley with a bag, suitcases, news kiosk, footbridge over the tracks → train door |
