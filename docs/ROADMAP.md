# The story after the Rada (built, September 2026)

Status: built and playable as 3-1 `e31_party`, 3-2 `e32_district`, 3-3 `e33_station` (authored by
`tools/author_world3.py`), with the cut scenes in `STORY` (levels.js), the country choice in `Finale.js` and the
Yes / No choice overlay in `scenes/Choice.js`. The old 3-1 party and 3-2 airport are in `src/levels/retired`.

How it works in code:
- The party bandits are friendly when heat >= 25 or the wallet >= 15 (`BALANCE.enemies.bandit`).
- Yes: +60 corruption (`pickups.mafia_bribe`), robbery cut scene, you wake up `jacketless` with an empty wallet.
- No: the boss and three mafiosi attack; three hits knock you out (a cut scene), beating the boss (18 HP) also
  ends in the district. Either way the player sprite switches to the torn-shirt `mpshirt_*` set.
- The district is hostile (eggs, dogs, falling balconies `!`, a collapsing wave bridge) when you took the deal
  or heat tier >= 2; otherwise citizens wave and the bridge holds.
- Taxi: 5 bribes, free for a clean run. Ticket: 5 bribes, paid by the MP salary for a clean run.
- Finale: heat >= 55 -> train breakdown -> 50/50 NABU or Shahed; else Europe -> country choice (clean: re-election;
  Austria 85% happy / 15% mafia; elsewhere 65% extradition / 35% happy). Every result screen ends with the moral.

## Level 6: the party (replaces 3-1)
- Cast: the same MPs as in the Rada, bandits, journalists (m/f).
- Bandits ignore a politician who is "well corrupt" (heat tier 2+ or wallet above a threshold) and attack an
  honest one. Honest runs play it as a stealth/combat level; corrupt runs as a social one.
- Finale: the mafia boss offers a huge bribe. An interactive choice: **Yes / No**.
  - **Yes** → cut scene: you get drunk and are robbed by escorts. You wake up in a poor Kyiv block district
    without your jacket, in a slightly torn shirt, with no money. (Heat stays high: the neighbourhood is hostile.)
  - **No** → boss fight against the mafia boss and several mafiosi, tuned to be lost ~90% of the time. Either
    way you end up in the same district, jacketless and broke, but the citizens are mostly neutral.
- New art: bandits (2 variants), mafia boss (144 px), escorts for the cut scene (story card only), party props.

## Level 7: the block district at golden hour (replaces 3-2)
- Long level, evening light, versatile zones (references in `assets_src/reference/photos/future_*`):
  block-building yards with arches (future_yard_arch, future_block_balconies, future_block_district), a sport
  court behind a green mesh fence with gopnik kids (future_sport_court, future_workout_area), a dog-walking
  court with citizens and dogs, a park with the "wave" footbridge (future_wave_bridge, future_riverside_water_stadium),
  a riverside park (future_riverside_park), a plain street with trolleybus wires (future_street_trolley — here
  the wires are wanted, as props, not painted across facades).
- Enemies: the old ladies with sticks, gopnik kids in tracksuits throwing empty beer bottles, angry citizens
  throwing eggs (same stun effect as chestnuts; only hostile when you are corrupt), plus cops, detectives and
  journalists.
- Corrupt runs: construction parts and balconies fall on you; the wave bridge may collapse (collapse timer as
  on the Dnipro bridge).
- Boss: a gang of 3 gopnik kids.
- Exit: with some money you catch a taxi to the railway station (cut scene). Items already generated for this
  level: `beer_bottle`, `egg`, `bottle_bag`.

## Level 8: the railway station (short)
- You need money for a ticket; lots of cops.
- Too corrupt → the train breaks down in the fields (cut scene: "you stole too much"), then one of two random
  endings: NABU catches you, or a Russian Shahed hits the train — only your compartment. Karma.
- Not too corrupt → you reach Europe and choose a country (interactive cut scene):
  - anything but Austria → a big chance of extradition to a Ukrainian jail, otherwise a happy end;
  - Austria → a happy end, or a small chance of being murdered by the mafia.
- Final title for every ending: an ironic line that corruption always has consequences — NABU or karma.

## Endings table (to implement in Finale.js)
| Route | Condition | Result |
|---|---|---|
| Honest | cleanRun through level 8 | re-election card (existing honest ending) |
| Train breakdown | heat ≥ 55 at level 8 | 50% NABU arrest / 50% Shahed "karma" |
| Europe, not Austria | heat < 55 | 65% extradition / 35% happy |
| Europe, Austria | heat < 55 | 85% happy / 15% mafia |
| Every ending | — | closing title: consequences always come |

## Inner voice to write for the new levels
Keys to add to `narration.js` (both languages): `start_l6` … `start_l8`, the mafia offer (yes/no lines),
waking up in the district, the sport court, the dog court, the wave bridge, the riverside, the taxi, the ticket
office, the train, each country choice and each ending.
