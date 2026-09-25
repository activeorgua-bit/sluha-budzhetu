import Phaser from 'phaser';
import { TILE, DEPTH } from '../../config/constants.js';

/**
 * Falling debris in the block district (a broken balcony slab or a chunk of concrete panel).
 * Only when the district is hostile (you are corrupt): as the politician walks under it, dust
 * trickles for a moment (the warning), then it drops from above the screen and hurts on impact.
 */
export class FallingDebris {
  constructor(scene, col, row, active) {
    this.scene = scene;
    this.x = col * TILE + TILE / 2;
    this.floorY = (row + 1) * TILE;
    this.active = active;
    this.state = 'idle';
    const has = (f) => scene.textures.get('props').has(f);
    this.frame = col % 2 && has('debris_balcony') ? 'debris_balcony' : (has('debris_panel') ? 'debris_panel' : 'crate');
  }

  update(player) {
    if (!this.active || this.state !== 'idle' || player.dead) return;
    if (Math.abs(player.x - this.x) > TILE * 2.2 || player.y < this.floorY - TILE * 4) return;
    this.state = 'warn';
    const s = this.scene;
    const top = s.cameras.main.scrollY + 70;
    const dust = [];
    for (let i = 0; i < 6; i++) {
      const d = s.add.rectangle(this.x + Phaser.Math.Between(-24, 24), top, 4, 4, 0xcfc3a8).setDepth(DEPTH.fx);
      s.tweens.add({ targets: d, y: top + 120, alpha: 0, duration: 450, delay: i * 60, onComplete: () => d.destroy() });
      dust.push(d);
    }
    s.time.delayedCall(550, () => this.drop(top));
  }

  drop(top) {
    const s = this.scene;
    this.state = 'fall';
    const img = s.physics.add.image(this.x, top - 40, 'props', this.frame).setDepth(DEPTH.props + 1);
    img.body.setAllowGravity(true);
    img.body.setSize(img.width * 0.8, img.height * 0.6);
    img.setAngularVelocity(Phaser.Math.Between(-90, 90));
    const hit = s.physics.add.overlap(s.player, img, () => {
      if (s.player.hurt(img.x, 'debris')) img.body.setVelocity(0, 0);
    });
    s.time.delayedCall(2200, () => { hit.destroy(); s.tweens.add({ targets: img, alpha: 0, duration: 300, onComplete: () => img.destroy() }); });
    s.physics.add.collider(img, s.layer, () => {
      if (img.landed) return;
      img.landed = true;
      img.setAngularVelocity(0);
      s.cameras.main.shake(120, 0.004);
      s.projectiles.burst(img.x, img.y, 0xa89f8f, 8);
    });
  }
}
