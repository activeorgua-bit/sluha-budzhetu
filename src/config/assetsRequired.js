// Names the game code references. tools/verify_assets.py reads this file.
// CRITICAL frames must exist for the game to run; the rest fall back to placeholders until the
// corresponding Magnific batch is approved (see docs/ASSET_PIPELINE.md).
export const CRITICAL = [
  'politician_idle', 'politician_walk1', 'politician_walk2', 'politician_jump',
  'journalist_idle', 'journalist_walk1', 'journalist_walk2', 'journalist_mic', 'journalist_camera',
  'detective_idle',
  'coin', 'money_bag', 'question_block', 'metal_block', 'bridge_girder', 'suspended_platform',
  'hanging_rebar', 'crane_hook', 'caution_sign', 'traffic_cone', 'sign_facts',
];

export const CHAR_FRAMES = [
  'politician_idle', 'politician_walk1', 'politician_walk2', 'politician_jump',
  'politician_fall', 'politician_throw1', 'politician_throw2', 'politician_hurt', 'politician_victory',
  'journalist_idle', 'journalist_walk1', 'journalist_walk2', 'journalist_mic', 'journalist_camera',
  'journalist_flash1', 'journalist_flash2', 'journalist_bribed', 'journalist_flee1', 'journalist_flee2',
  'detective_idle', 'detective_walk1', 'detective_walk2', 'detective_throw1', 'detective_throw2',
  'detective_emerge1', 'detective_emerge2', 'detective_bribed', 'detective_arrest',
  'cop_idle', 'cop_walk1', 'cop_walk2', 'cop_bribed',
  'babusya_idle', 'babusya_walk1', 'babusya_walk2', 'babusya_throw', 'babusya_wave',
  'tracksuit_idle', 'tracksuit_walk1', 'tracksuit_walk2', 'tracksuit_throw', 'tracksuit_wave',
  'oligarch_idle', 'oligarch_dance1', 'oligarch_dance2', 'oligarch_offer',
  'guard_idle', 'guard_walk1', 'guard_walk2', 'guard_bribed', 'guard_block',
];

export const PROP_FRAMES = [
  'coin', 'coin_spin1', 'coin_spin2', 'coin_spin3', 'coin_spin4', 'money_bag', 'question_block',
  'brick_block', 'metal_block', 'crate', 'wood_box', 'barrel', 'pipe', 'pipe_stack', 'caution_sign',
  'traffic_cone', 'rebar_platform', 'wood_platform', 'hook_block', 'crane_hook', 'hanging_rebar',
  'bridge_girder', 'suspended_platform', 'spike', 'warrant', 'cash', 'newspaper', 'jar',
  'manhole', 'checkpoint_flag', 'sign_bridges', 'sign_facts', 'sign_reform', 'sign_nabu',
];

export const UI_FRAMES = ['hud_portrait', 'hud_bag'];

export const CLIPS = [
  'politician_idle', 'politician_walk', 'politician_jump', 'journalist_idle', 'journalist_walk',
  'journalist_camera', 'detective_idle', 'detective_walk', 'cop_idle', 'cop_walk', 'coin_spin',
];
