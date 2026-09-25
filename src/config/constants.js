export const GAME_W = 960;
export const GAME_H = 540;
export const TILE = 48;
export const S = TILE / 32;     // world scale relative to the original 32 px grid
export const FRAME = 96;        // character frame height
export const BASELINE = 90;     // feet row inside a character frame (origin y = 90/96)
export const MAP_ROWS = 18;     // 864 px tall maps; the camera hides the last row

export const DEPTH = {
  parallaxSky: -30,
  parallaxFar: -20,
  parallaxMid: -10,
  decorBack: -5,
  tiles: 0,
  signs: 2,
  props: 5,
  pickups: 8,
  enemies: 10,
  player: 12,
  projectiles: 14,
  fx: 20,
  ui: 100,
};

export const KEYS = {
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  jump: ['SPACE', 'W', 'UP'],
  bribe: ['J', 'Z'],
  blackPR: ['K', 'X'],
  nut: ['L', 'C'],          // throw a chestnut (or a 'Kapital' book when you carry one)
  interact: ['E', 'ENTER'],
  restart: ['R'],
  pause: ['P', 'ESC'],
  mute: ['M'],
};
