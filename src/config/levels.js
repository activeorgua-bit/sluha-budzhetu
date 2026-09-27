// Level registry. The ASCII files live in src/levels/ascii and carry their own frontmatter
// (material, parallax, signs, decor legend). This list defines order and world grouping.
export const LEVELS = [
  { id: 'l11', world: 1, label: '1-1', file: 'l11_street', nameKey: 'level_l11' },
  { id: 'l12', world: 1, label: '1-2', file: 'l12_bridge', nameKey: 'level_l12', cardsBefore: 'bridge' },
  // World 2: parliament. The park has a secret hatch into the Stalin-era bunker (bonus level);
  // both the park's front door and the bunker exit lead to the corridor.
  { id: 'p21', world: 2, label: '2-1', file: 'p21_mariinsky', nameKey: 'level_p21', next: 'p22' },
  { id: 'p21b', world: 2, label: '2-1B', file: 'p21b_bunker', nameKey: 'level_p21b', next: 'p22', bonus: true, cardsBefore: 'bunker' },
  { id: 'p22', world: 2, label: '2-2', file: 'p22_corridor', nameKey: 'level_p22', cardsBefore: 'corridor' },
  { id: 'p23', world: 2, label: '2-3', file: 'p23_hall', nameKey: 'level_p23', cardsBefore: 'hall' },
  // World 3: the fall. The party ends in a cut scene either way (the mafia's offer); the district
  // exit is a taxi; the station's train leads to the finale (breakdown or Europe).
  { id: 'e31', world: 3, label: '3-1', file: 'e31_party', nameKey: 'level_e31' },
  { id: 'e32', world: 3, label: '3-2', file: 'e32_district', nameKey: 'level_e32', cardsAfter: 'taxi' },
  { id: 'e33', world: 3, label: '3-3', file: 'e33_station', nameKey: 'level_e33', finale: true },
  // sub-levels reached from inside another level (not part of the level-to-level order)
  { id: 'm11', world: 1, label: '1-1M', file: 'm11_metro', nameKey: 'level_m11', bonus: true, subway: true },
];

export function levelByIndex(i) { return LEVELS[i]; }
export function levelIndexById(id) { return LEVELS.findIndex((l) => l.id === id); }

// Story cards shown before a level (first level of each world) and for endings.
export const STORY = {
  // `alt`: the older illustration, shown 30 % of the time instead of `image`
  intro: [
    { image: 'story_intro_wake', alt: 'story_intro', textKey: 'story_intro_1' },
    { image: 'story_intro_street', alt: 'story_intro', textKey: 'story_intro_2' },
    { image: 'story_intro_crossroads', alt: 'story_intro', textKey: 'story_intro_3' },
  ],
  world2: [{ image: 'story_world2_v2', alt: 'story_world2', textKey: 'story_w2' }],
  world3: [{ image: 'story_world3_v2', alt: 'story_world3', textKey: 'story_w3' }],
  honest: [
    { image: 'story_honest_lake', alt: 'story_honest_beach', textKey: 'story_honest_1' },
    { image: 'story_honest_return', textKey: 'story_honest_2' },
    { image: 'story_honest_election_v2', alt: 'story_honest_election', textKey: 'story_honest_3' },
  ],
  epilogue: [{ image: 'story_epilogue', textKey: 'end_epilogue' }],
  // shown before a level (LEVELS[].cardsBefore)
  bridge: [{ image: 'story_bridge', textKey: 'cut_bridge' }],
  subway: [{ image: 'story_subway', textKey: 'cut_subway' }],
  bunker: [{ image: 'story_bunker', textKey: 'cut_bunker' }],
  corridor: [{ image: 'story_corridor', textKey: 'cut_corridor' }],
  hall: [{ image: 'story_hall', textKey: 'cut_hall' }],
  escape: [
    { image: 'story_escape_jet', textKey: 'story_escape_1' },
    { image: 'story_escape_villa', textKey: 'story_escape_2' },
    { image: 'story_escape_villa', textKey: 'story_escape_3' },
  ],
  arrest: [
    { image: 'story_arrest_tarmac', textKey: 'story_arrest_1' },
    { image: 'story_arrest_court', textKey: 'story_arrest_2' },
  ],
  gameover: [{ image: 'story_gameover_v2', alt: 'story_gameover', textKey: 'story_gameover' }],
  // world 3 cut scenes
  mafia_yes: [
    { image: 'story_mafia_offer', textKey: 'cut_yes_1' },
    { image: 'story_mafia_robbed', textKey: 'cut_yes_2' },
    { image: 'story_wake_district', textKey: 'cut_wake_yes' },
  ],
  mafia_lost: [
    { image: 'story_mafia_beaten', textKey: 'cut_lost_1' },
    { image: 'story_wake_district', textKey: 'cut_wake_no' },
  ],
  mafia_won: [
    { image: 'story_mafia_offer', textKey: 'cut_won_1' },
    { image: 'story_wake_district', textKey: 'cut_wake_no' },
  ],
  taxi: [{ image: 'story_taxi', textKey: 'cut_taxi' }],
  // endings
  train_nabu: [
    { image: 'story_train_broken', textKey: 'end_train_1' },
    { image: 'story_nabu_field', textKey: 'end_nabu' },
  ],
  train_karma: [
    { image: 'story_train_broken', textKey: 'end_train_1' },
    { image: 'story_shahed', textKey: 'end_karma' },
  ],
  europe: [{ image: 'story_europe', textKey: 'end_europe' }],
  austria_happy: [{ image: 'story_austria_happy', textKey: 'end_austria_happy' }],
  austria_mafia: [{ image: 'story_austria_mafia', textKey: 'end_austria_mafia' }],
  extradited: [{ image: 'story_extradition', textKey: 'end_extradited' }],
  abroad_happy: [{ image: 'story_escape_villa_v2', alt: 'story_escape_villa', textKey: 'end_abroad_happy' }],
  front_serve: [
    { image: 'story_front_enlist', textKey: 'end_front_1' },
    { image: 'story_front_dugout', textKey: 'end_front_serve' },
  ],
  front_case: [
    { image: 'story_front_enlist', textKey: 'end_front_1' },
    { image: 'story_front_nabu', textKey: 'end_front_nabu' },
    { image: 'story_front_court', textKey: 'end_front_court' },
  ],
};
