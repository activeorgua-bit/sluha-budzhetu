// Dev helpers exposed on window.__dev when the page is opened with ?dev=1.
// Used by automated browser tests and handy in the console:
//   __dev.start(1)                 jump to level index 1 (1-2)
//   __dev.hold('ArrowRight', 39, 800); __dev.tap('Space', 32)
//   __dev.state()                  snapshot of GameState + level entities
import { GameState } from './GameState.js';
import { audio } from './Audio.js';
import * as Reach from '../levels/Reach.js';

function synth(type, code, keyCode) {
  const ev = new KeyboardEvent(type, { key: code, code, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => keyCode });
  Object.defineProperty(ev, 'which', { get: () => keyCode });
  window.dispatchEvent(ev);
}

export function installDevTools(game) {
  const dev = {
    key: (code, keyCode, down) => synth(down ? 'keydown' : 'keyup', code, keyCode),
    hold(code, keyCode, ms) { synth('keydown', code, keyCode); setTimeout(() => synth('keyup', code, keyCode), ms); },
    tap(code, keyCode) { dev.hold(code, keyCode, 120); },
    async start(levelIndex) {
      // wait for Preload to finish (atlases, tilesets, parallax, story cards)
      const t0 = Date.now();
      // Preload's status is LOADING (not "active") while files stream in, so wait for the Menu
      // (or a running gameplay scene) instead — that only happens after every file has landed.
      const loaded = () => ['Menu', 'Level', 'Story', 'Finale', 'GameOver'].some((k) => game.scene.isActive(k))
        && game.cache.json.has('tiles_w1_index');
      while (Date.now() - t0 < 30000 && !loaded()) {
        await new Promise((r) => setTimeout(r, 100));
      }
      const menu = game.scene.getScene('Menu');
      if (game.scene.isActive('Level')) game.scene.getScene('Level').scene.stop('UI');
      for (const key of ['Level', 'Story', 'Finale', 'GameOver', 'Pause', 'Help', 'SaveLoad', 'Menu']) if (game.scene.isActive(key) || game.scene.isPaused(key)) game.scene.stop(key);
      GameState.reset();
      GameState.levelIndex = levelIndex;
      game.scene.start('Level', { levelIndex });
      return menu ? 'started' : 'no menu';
    },
    level: () => game.scene.getScene('Level'),
    async ready(timeoutMs = 6000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeoutMs) {
        const lv = game.scene.getScene('Level');
        if (lv && lv.enemies && lv.player) return lv;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error('Level scene did not create (is the tab visible? requestAnimationFrame is paused when hidden)');
    },
    state() {
      const lv = game.scene.getScene('Level');
      const s = GameState;
      const out = { corruption: s.corruption, wallet: s.wallet, heat: s.heat, tier: s.tier.key, lives: s.lives,
        cleanRun: s.cleanRun, failedBribes: s.failedBribes, traps: s.trapsTriggered, ending: s.ending };
      if (lv && lv.player) {
        out.player = { x: Math.round(lv.player.x), y: Math.round(lv.player.y), dead: lv.player.dead };
        out.enemies = lv.enemies.getChildren().filter((e) => e.active).map((e) => ({ type: e.type, x: Math.round(e.x), state: e.stateName, bribed: e.bribed }));
        out.timeLeft = lv.timeLeft;
        out.finished = lv.finished;
      }
      return out;
    },
    GameState,
    audio,
    reach: Reach,          // route search (used by the play-test bot)
  };
  window.__dev = dev;
  return dev;
}
