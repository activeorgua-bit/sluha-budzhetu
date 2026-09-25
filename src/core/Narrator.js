import { NARRATION } from '../config/narration.js';
import { GameState } from './GameState.js';
import { getLang } from './i18n.js';

/**
 * The inner voice. Resolves a narration key to a line for the current state and hands it to the
 * UI's book panel. Keys play once per level unless `repeat` is set; generic event keys (coin, bag,
 * bribe_ok...) repeat with a cooldown so the voice comments without chattering.
 *
 * Level zones: meta.narration = [{ col, key, if?: 'clean'|'corrupt'|'bag_here' }]
 * fire when the player walks past `col`.
 */
const REPEATABLE = {
  coin: 9000, bag: 6000, bribe_ok: 8000, bribe_fail: 8000, flash: 12000, hurt_oldlady: 15000,
  hit_chestnut: 15000, stun_civilian: 12000, stun_journalist: 15000, conscience_freeze: 0,
  drink_whiskey: 0, drink_vodka: 0, drunk_walk: 20000, shop_no_money: 8000, conscience_warn: 30000,
};

export class Narrator {
  constructor(scene) {
    this.scene = scene;
    this.played = new Set();
    this.lastAt = {};
    this.zones = (scene.meta.narration || []).filter((z) => !z.on).map((z) => ({ ...z, done: false }));
  }

  bucket() {
    const s = GameState;
    if (s.cleanRun) return 'clean';
    return s.tier.id >= 3 ? 'wanted' : 'corrupt';
  }

  resolve(key) {
    const bank = NARRATION[getLang()] || NARRATION.uk;
    let e = bank[key] ?? NARRATION.en[key];
    if (e === undefined) return null;
    if (e && typeof e === 'object' && !Array.isArray(e)) {
      const drunk = GameState.drunk && e.drunk;
      const b = this.bucket();
      e = drunk ? e.drunk : (e[b] ?? (b === 'wanted' ? e.corrupt : undefined) ?? e.any ?? e.clean ?? e.corrupt);
    }
    if (Array.isArray(e)) e = e[Math.floor(Math.random() * e.length)];
    if (typeof e !== 'string') return null;
    return e.replace('{wallet}', GameState.wallet).replace('{heat}', GameState.heat)
      .replace('{conscience}', Math.round(GameState.conscience));
  }

  /** priority: 0 ambient, 1 event, 2 important (remorse, boss, level start). */
  say(key, { priority = 1, force = false } = {}) {
    const now = this.scene.time.now;
    const cd = REPEATABLE[key];
    if (cd === undefined) {
      if (this.played.has(key) && !force) return false;
    } else if (now - (this.lastAt[key] ?? -1e9) < cd) {
      return false;
    }
    const text = this.resolve(key);
    if (!text) return false;
    const ui = this.scene.ui;
    if (!ui || !ui.narrate) return false;
    if (!ui.narrate(text, priority)) return false;
    this.played.add(key);
    this.lastAt[key] = now;
    return true;
  }

  /** Walk-in zones from the level file. */
  update() {
    const P = this.scene.player;
    if (!P || P.dead) return;
    const col = P.x / 48;
    for (const z of this.zones) {
      if (z.done || col < z.col) continue;
      z.done = true;
      if (z.if === 'clean' && !GameState.cleanRun) continue;
      if (z.if === 'corrupt' && GameState.cleanRun) continue;
      if (z.if === 'bag_here' && !this.scene.pickups.getChildren().some((p) => p.active && !p.collected
        && p.kind === 'money_bag' && Math.abs(p.x / 48 - z.col) < 8)) continue;
      this.say(z.key, { priority: z.priority ?? 1 });
    }
  }
}
