import { BALANCE } from '../config/balance.js';
import { GameState } from './GameState.js';
import { TILE } from '../config/constants.js';

/**
 * Turns heat into pressure. Owns the tier-gated markers of a level, spawns off-screen
 * ambushes when a tier is crossed, runs the per-tier pressure timers and answers trap coins.
 */
export class SpawnDirector {
  constructor(scene, level) {
    this.scene = scene;
    this.level = level;
    this.gated = level.objects.filter((o) => o.gateTier !== undefined);
    this.stingPoints = level.objects.filter((o) => o.type === 'sting');
    this.spawnedGated = new Set();
    this.nextJournalistAt = Infinity;
    this.nextDetectiveAt = Infinity;
    this.raidDone = false;
    this.onHeat = (e) => this.tierCrossed(e.tier, e.prevTier);
    GameState.events.on('heat', this.onHeat);
    this.activateGated(GameState.tier.id, false);
    this.scheduleTimers(GameState.tier.id);
  }

  destroy() {
    GameState.events.off('heat', this.onHeat);
  }

  count(type) {
    return this.scene.enemies.getChildren().filter((e) => e.active && e.type === type && !e.bribed).length;
  }

  activateGated(tier, aheadOnly) {
    for (const o of this.gated) {
      const key = `${o.col},${o.row}`;
      if (this.spawnedGated.has(key) || tier < o.gateTier) continue;
      if (aheadOnly && o.col * TILE < this.scene.player.x + 200) continue;
      this.spawnedGated.add(key);
      this.scene.spawnEnemy(o.type, o.col * TILE + TILE / 2, (o.row + 1) * TILE, o);
    }
  }

  tierCrossed(tier, prev) {
    if (tier <= prev) return;
    this.activateGated(tier, true);
    this.scheduleTimers(tier);
    const msg = this.scene.tt(`tier_${GameState.tier.key}`);
    this.scene.ui.flash(msg, tier >= 3 ? '#ff6b6b' : '#f2c14e', 1400);
    if (tier >= 2) this.ambush('journalist');
    if (tier >= 3) this.sting(this.scene.player.x, this.scene.player.y, true);
  }

  scheduleTimers(tier) {
    const s = BALANCE.spawn;
    const now = this.scene.time.now;
    this.nextJournalistAt = s.journalistPressureSec[tier] ? now + s.journalistPressureSec[tier] * 1000 : Infinity;
    this.nextDetectiveAt = s.detectivePressureSec[tier] ? now + this.detectiveEvery(tier) : Infinity;
  }

  /** ms between pressure detectives; meta.detectivePressure > 1 spaces them out (the Speaker's hall, the district). */
  detectiveEvery(tier) {
    return BALANCE.spawn.detectivePressureSec[tier] * 1000 * (this.level.meta.detectivePressure || 1);
  }

  update(now) {
    const s = BALANCE.spawn;
    if (this.quietUntil && now < this.quietUntil) return;   // lost in the metro: no pressure for a while
    const tier = GameState.tier.id;
    if (now >= this.nextJournalistAt) {
      this.nextJournalistAt = now + s.journalistPressureSec[tier] * 1000;
      if (this.count('journalist') < (s.journalistCap[tier] || 0)) this.ambush('journalist');
    }
    if (now >= this.nextDetectiveAt) {
      this.nextDetectiveAt = now + this.detectiveEvery(tier);
      if (this.count('detective') < (s.detectiveCap[tier] || 0)) this.sting(this.scene.player.x, this.scene.player.y, true);
    }
    if (this.level.meta.party && !this.raidDone && tier >= s.partyRaidTier && now > this.scene.levelStartMs + s.partyRaidSec * 1000) {
      this.raidDone = true;
      this.scene.ui.flash(this.scene.tt('raid'), '#ff6b6b', 1600);
      this.sting(this.scene.player.x, this.scene.player.y, true);
      this.sting(this.scene.player.x + 300, this.scene.player.y, true);
    }
  }

  /** Spawn an enemy just outside the camera, ahead of the player, standing on ground. */
  ambush(type) {
    const cam = this.scene.cameras.main;
    const player = this.scene.player;
    const x = Math.min(this.scene.widthPx - 96, cam.worldView.right + BALANCE.spawn.offscreenMargin);
    const y = this.groundBelow(x, player.y - 300) ?? player.y;
    this.scene.spawnEnemy(type, x, y, { dir: -1 });
  }

  /** Detective emerges from the nearest sting point (manhole/door), or from the ground nearby. */
  sting(x, y, ahead = false) {
    let best = null;
    let bestD = Infinity;
    for (const p of this.stingPoints) {
      const px = p.col * TILE + TILE / 2;
      const d = Math.abs(px - x);
      if (d < bestD && d < 1350) { bestD = d; best = p; }
    }
    const sx = best ? best.col * TILE + TILE / 2 : Math.min(this.scene.widthPx - 96, x + (ahead ? 390 : 180));
    const sy = best ? (best.row + 1) * TILE : (this.groundBelow(sx, y - 300) ?? y);
    this.scene.time.delayedCall(BALANCE.spawn.trapEmergeDelaySec * 1000 * (best ? 1 : 0.5), () => {
      if (!this.scene.scene.isActive()) return;
      this.scene.spawnEnemy('detective', sx, sy, { emerge: true, dir: sx > x ? -1 : 1 });
    });
  }

  groundBelow(x, fromY) {
    const layer = this.scene.layer;
    if (!layer) return null;
    const col = Math.floor(x / TILE);
    for (let row = Math.max(0, Math.floor(fromY / TILE)); row < this.level.rows; row++) {
      const tile = layer.getTileAt(col, row);
      if (tile && tile.collides) return row * TILE;
    }
    return null;
  }
}
