# Game design — «Слуга Бюджету» / Servant of the Budget

## Concept
A side-scrolling platformer where the temptation is the enemy. You are a Ukrainian MP running for
re-election. Coins, money bags and "question" blocks are bribes: every one you take raises your
**corruption** (permanent) and your **wallet** (spendable), and the world reacts. Take nothing and the
same levels are a fair, honest platformer that ends with re-election.

## Core loop
1. Run, jump, avoid hazards (spikes, water, crane hooks, collapsing bridges, timer).
2. Decide whether to grab money. It is never on the mandatory route (`tools/validate_levels.mjs`
   proves a coin-free path exists in every level).
3. If you took money: bribe (`J` throws cash), smear journalists (`K` black PR), outrun detectives.
4. Reach the exit. Level 3-2 (airport) branches into the ending.

## State (`src/core/GameState.js`)
| Field | Meaning |
|---|---|
| `corruption` | sum of pickup values ever collected; never decreases |
| `wallet` | spendable bribes (= corruption − spent) |
| `cleanRun` | true until the first pickup of any value |
| `heat` | `clamp(0.6·corruption + 3·failedBribes + 8·trapsTriggered, 0, 100)` |
| `tier` | 0 clean · 1 suspicious (1–24) · 2 investigated (25–54) · 3 wanted (55–79) · 4 raid (80–100) |

## Actors
| Actor | Behaviour | Bribe | Notes |
|---|---|---|---|
| Politician (player) | speed 260, jump −490, gravity 980, coyote/jump-buffer, variable jump; greed penalty: −22 % speed / −11 % jump at wallet ≥ 50 | — | hitbox 28×52 inside the 64×64 frame, feet at y=60 |
| Journalist | patrols; in line of sight (220 px, 260 at tier ≥ 1) raises the camera, flashes after 0.45 s and stuns you 1.2 s; contact hurts | 22 % / 3 | black PR makes him flee 4 s |
| NABU detective | chases within 560 px at 110 + 0.6·heat px/s, jumps walls, throws warrants every 3.2 − 0.012·heat s; emerges from manholes on stings | 14 % / 5 | immune to black PR |
| Patrol officer | patrols; hurts on contact | 100 % / 1 | |
| Voters (grandmother, tracksuit guy) | wave while tier < 2; from tier 2 chase and throw jars/bottles | 18 % / 2 | level 2-2 |
| Party guest (oligarch) | never hurts; drops money bags near you every 6 s; blocks the path until you "drink" (`E`, −10 s) | — | level 3-1 |
| Border guard | opens for a clean run; otherwise demands `5 + ceil(heat/4)` in one payment; pushing through unpaid = arrest | 100 % | level 3-2 |

Bribe resolution: throwing costs 1; on hit the wallet must cover the rest of the target's cost, then a
seeded roll against `odds × 0.75^(failed attempts on that enemy)`. Failure enrages the enemy (+30 % speed,
3 s) and adds heat. Every number is in `src/config/balance.js`.

## Pressure (SpawnDirector)
- Lowercase level markers (`j`, `d`, `v`) only spawn once the run reaches their tier.
- Crossing a tier spawns an off-screen ambush (journalist at tier ≥ 2, detective sting at tier ≥ 3).
- Pressure timers: journalists every 25/18/14 s at tiers 2/3/4 (caps 2/3/4); detectives every 30/22 s at tiers 3/4 (caps 2/3).
- Trap coins look identical to coins (designer `t` + seeded 5 % of `c`, max 3 per level): a detective climbs out of the nearest manhole 1.5 s later.
- Party level: a raid 20 s after entering at tier ≥ 3. Checkpoints at tier 4 spawn a detective.
- Crumbling bridges: `max(0.32, 2.6 − corruption × 0.095)` seconds after the first step.

## Levels
| Id | Label | Place | Time | Baseline enemies | Pickups |
|---|---|---|---|---|---|
| l11 | 1-1 | Kyiv street | 200 s | 1 journalist, 1 officer | 6 |
| l12 | 1-2 | Dnipro bridge | 180 s | 1 journalist (+gated) | 11 |
| l21 | 2-1 | Verkhovna Rada | 200 s | 2 journalists, 2 detectives | 18 |
| l22 | 2-2 | Courtyard, meeting the voters | 180 s | 5 voters, 1 journalist | 7 |
| l31 | 3-1 | Private party | 210 s | 2 journalists, 4 guests (+gated detectives) | 19 |
| l32 | 3-2 | Boryspil airport | 240 s | 1 detective, border guard | 4 |

## Endings
- **Re-elected** (clean run, zero pickups): vacation → return → election night. The only true win.
- **Escaped (for now)**: corrupt, heat < 55 and the guard was paid: private jet → villa, sentenced in absentia.
- **Arrested by NABU**: corrupt with heat ≥ 55, an unpaid guard, or pushing past him: tarmac → courtroom.
- **Game over**: out of lives or time.

The best result is kept in `localStorage` (honest > escape > arrest > game over, then score).

## Story text
All cards are in `src/config/strings.js` (`story_*`), in Ukrainian and English, shown by `StoryScene`
over the generated cards in `public/assets/story/`.

## Scoring
coin 100 · bag 1000 · question block 300 · level clear 1000 · +10 per second left · +5000 "clean hands"
per level finished with no pickups on a clean run · extra life every 20 000.
