// ASCII level legend. Each level is 18 rows of 48px cells. See docs/LEVEL_DESIGN.md.
//
// Tiles (map layer)                       Entities (map layer)
//   .  empty                                P  player spawn        G  goal / exit
//   #  solid ground, level material         K  checkpoint          s  sting point (manhole)
//   @  solid ground, second material        J/j journalist (always / tier-gated)
//   =  brick block   [  metal block         D/d detective   (always / tier-gated)
//   x  crate (solid) w  wood box (solid)    C  cop          V/v voter (always / gated)
//   g  granite block (solid) e  hedge (solid)
//   %  scaffold (decor, walk-through)       W  party guest  Q  border guard
//   -  one-way wood platform                c  coin  t  trap coin  $  money bag  ?  question block
//   _  weak one-way platform (crumbles)     H  hanging hook; ',' cells below = drop depth
//   B  crumbling bridge segment             m…* horizontal mover path   n…: vertical mover path
//   ~  water (deadly)  ^  spikes (deadly)   1-9 sign N from frontmatter "signs"
//   |  ladder (decor)
// Chestnut campaign (world 2):
//   T  chestnut tree (E / bump to shake: chestnuts fall)   o  chestnut on the ground   b  'Kapital' book
//   L  old lady (walking stick)   k  kid (picks up + throws chestnuts)   r  bunker rat
//   A  assistant (harmless)       O  opposition MP (throws chocolate)    F  female journalist
//   M  seated MP (spectator, throws chestnuts)   X  level boss (meta.boss)   Z  secret hatch (meta.secret)
//   y  whiskey bottle   u  vodka bottle (drink on pickup: conscience -, drunk +)
//   +  hidden stash: E to search -> first-aid kit (+1 life, full reputation); '?' blocks may hold one too
//   N bandit (friendly if you are corrupt enough)  R MP at the party (harmless)  h gopnik (beer bottles)
//   i angry citizen (eggs, only if corrupt)  Y dog  I dog walker  ! falling debris (only if corrupt)
// Decor with "shop": "whiskey" sells a bottle for BALANCE.alcohol.whiskey.price bribes (E next to it).
// Decor layer: letters A-Z mapped by the frontmatter "decor" table to prop frame names.

export const SOLID = new Set(['#', '@', '=', '[', 'x', 'w', 'g', 'e']);
export const ONE_WAY = new Set(['-', '_']);
export const HAZARD = new Set(['~', '^']);
export const DECOR_TILES = new Set(['%', '|']);
export const TILE_CHARS = new Set([...SOLID, ...ONE_WAY, ...HAZARD, ...DECOR_TILES]);

export const ENTITY_CHARS = {
  P: 'player', G: 'goal', K: 'checkpoint', s: 'sting',
  J: 'journalist', j: 'journalist', D: 'detective', d: 'detective',
  C: 'cop', V: 'voter', v: 'voter', W: 'guest', Q: 'guard',
  c: 'coin', t: 'trap', $: 'money_bag', '?': 'question_block',
  H: 'hook', B: 'bridge', m: 'mover_h', n: 'mover_v',
  T: 'tree', o: 'chestnut', b: 'book',
  L: 'oldlady', k: 'kid', r: 'rat', A: 'assistant', O: 'oppmp', F: 'journalist_f', M: 'seatedmp',
  X: 'boss', Z: 'secret',
  y: 'whiskey', u: 'vodka',
  // world 3: party and block district
  N: 'bandit', R: 'mp', h: 'gopnik', i: 'citizen', Y: 'dog', I: 'dogwalker', '!': 'debris',
  // Kyiv metro (m11): p passenger (random look), a duty officer, f escalator attendant, q metro policeman
  p: 'passenger', a: 'mworker', f: 'wworker', q: 'mcop',
  '+': 'stash',         // hidden stash (a cardboard box): E to search, a first-aid kit inside (+1 life)
};

// free ammo pickups: never corruption, never forbidden for the honest route
export const AMMO_TYPES = new Set(['chestnut', 'book']);
// bottles: found alcohol (free, silences conscience, makes you drunk)
export const BOTTLE_TYPES = new Set(['whiskey', 'vodka']);

// lowercase markers only spawn once the run reaches this heat tier
export const GATED_TIER = { j: 1, d: 2, v: 2 };

export const SIGN_CHARS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']);

// Tile name resolution: material autotile names tried in order.
export const AUTOTILE_BLOB = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];
