import Phaser from 'phaser';
import { TILE, DEPTH } from '../../config/constants.js';
import { BALANCE } from '../../config/balance.js';
import { audio } from '../../core/Audio.js';

/**
 * Horse chestnut tree. Press E next to the trunk (or bump it from below) to shake it: a few
 * chestnuts fall and can be picked up as free, honest ammo. Each tree has a limited number of shakes.
 */
export class ChestnutTree {
  constructor(scene, col, row, variant = 'green') {
    this.scene = scene;
    const has = (f) => scene.textures.get('props').has(f);
    const frame = variant === 'gold' && has('chestnut_tree_gold') ? 'chestnut_tree_gold' : (has('chestnut_tree') ? 'chestnut_tree' : 'bush');
    const x = col * TILE + TILE / 2;
    const y = (row + 1) * TILE;
    this.img = scene.add.image(x, y, 'props', frame).setOrigin(0.5, 1).setDepth(DEPTH.decorBack);
    this.x = x;
    this.baseY = y;
    this.shakesLeft = BALANCE.nuts.treeShakes;
    this.readyAt = 0;
    this.hinted = false;
  }

  get crownTop() { return this.baseY - this.img.height; }

  near(player) {
    return Math.abs(player.x - this.x) < BALANCE.nuts.treeRange && Math.abs(player.y - this.baseY) < 110;
  }

  /** Returns true if the tree was shaken (chestnuts dropped or it wobbled empty). */
  shake() {
    const s = this.scene;
    const now = s.time.now;
    if (now < this.readyAt) return false;
    this.readyAt = now + BALANCE.nuts.treeCooldownSec * 1000;
    s.tweens.add({ targets: this.img, angle: { from: -3, to: 3 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => this.img.setAngle(0) });
    if (this.shakesLeft <= 0) { s.ui.flash(s.tt('tree_empty'), '#e8b06a', 700); return true; }
    this.shakesLeft -= 1;
    audio.playBridgeCrack();
    const [lo, hi] = BALANCE.nuts.treeDrops;
    const n = Phaser.Math.Between(lo, hi);
    for (let i = 0; i < n; i++) {
      s.time.delayedCall(i * 90, () => {
        const px = this.x + Phaser.Math.Between(-this.img.width * 0.32, this.img.width * 0.32);
        const py = this.crownTop + this.img.height * Phaser.Math.FloatBetween(0.25, 0.45);
        const p = s.spawnPickup('chestnut', px, py, { falling: true });
        p.body.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(-120, 0));
      });
    }
    return true;
  }
}

/**
 * Secret hatch (Mariinsky park): press E on it to climb down into the Stalin-era bunker (bonus level).
 */
export class SecretHatch {
  constructor(scene, col, row) {
    this.scene = scene;
    const has = scene.textures.get('props').has('secret_hatch');
    this.x = col * TILE + TILE / 2;
    this.baseY = (row + 1) * TILE;
    this.img = scene.add.image(this.x, this.baseY, 'props', has ? 'secret_hatch' : 'manhole').setOrigin(0.5, 1).setDepth(DEPTH.decorBack);
    this.hinted = false;
  }

  near(player) { return Math.abs(player.x - this.x) < 60 && Math.abs(player.y - this.baseY) < 60; }
}
