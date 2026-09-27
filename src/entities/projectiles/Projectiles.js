import Phaser from 'phaser';
import { DEPTH } from '../../config/constants.js';
import { BALANCE } from '../../config/balance.js';

/**
 * All thrown things live in three Arcade groups: cash (player → enemies),
 * hostile (warrants, jars → player).
 * Placeholder textures are generated if the atlas lacks a frame.
 */
export class Projectiles {
  constructor(scene) {
    this.scene = scene;
    this.ensureTextures();
    this.cash = scene.physics.add.group({ allowGravity: true });
    this.hostile = scene.physics.add.group({ allowGravity: true });
    this.nuts = scene.physics.add.group({ allowGravity: true });    // chestnuts / books (player -> enemies)
  }

  ensureTextures() {
    const s = this.scene;
    const props = s.textures.get('props');
    const mk = (key, w, h, draw) => {
      if (s.textures.exists(key)) return;
      const g = s.add.graphics();
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };
    if (!props.has('cash')) mk('__cash', 24, 16, (g) => {
      g.fillStyle(0x1e5a2d).fillRect(2, 4, 20, 10);
      g.fillStyle(0x3ca050).fillRect(1, 2, 20, 10);
      g.fillStyle(0x78d282).fillRect(2, 3, 18, 8);
      g.fillStyle(0xdcb43c).fillRect(9, 2, 4, 10);
    });
    if (!props.has('newspaper')) mk('__pr', 28, 20, (g) => {
      g.fillStyle(0xf5f5f0).fillRect(1, 1, 26, 18);
      g.fillStyle(0x333333).fillRect(1, 1, 26, 1).fillRect(1, 18, 26, 1);
      g.fillStyle(0xc81e1e).fillRect(4, 4, 20, 4);
      g.fillStyle(0x3c3c3c).fillRect(4, 10, 20, 1).fillRect(4, 13, 20, 1).fillRect(4, 16, 12, 1);
    });
    if (!props.has('jar')) mk('__jar', 16, 20, (g) => {
      g.fillStyle(0x9fd1a0).fillRect(2, 4, 12, 14);
      g.fillStyle(0x4c8a3f).fillRect(3, 8, 10, 8);
      g.fillStyle(0x333333).fillRect(3, 1, 10, 4);
    });
  }

  tex(frame, fallback) {
    return this.scene.textures.get('props').has(frame) ? ['props', frame] : [fallback, undefined];
  }

  throwCash(x, y, dir) {
    const [key, frame] = this.tex('cash', '__cash');
    const p = this.cash.create(x, y, key, frame);
    p.setDepth(DEPTH.projectiles);
    p.body.setVelocity(dir * BALANCE.bribe.cashSpeed, -240);
    p.body.setGravityY(BALANCE.bribe.cashGravity - BALANCE.player.gravity);
    p.setAngularVelocity(dir * 360);
    this.expire(p, 1800);
    return p;
  }

  throwWarrant(x, y, dir) {
    const [key, frame] = this.tex('warrant', '__pr');
    const p = this.hostile.create(x, y, key, frame);
    p.kind = 'warrant';
    p.setDepth(DEPTH.projectiles);
    p.body.setVelocity(dir * BALANCE.enemies.detective.warrantSpeed, -180);
    p.body.setGravityY(450 - BALANCE.player.gravity);
    p.setAngularVelocity(dir * 240);
    p.body.setSize(30, 30);
    this.expire(p, 2200);
    return p;
  }

  throwJar(x, y, dir) {
    const [key, frame] = this.tex('jar', '__jar');
    const p = this.hostile.create(x, y, key, frame);
    p.kind = 'jar';
    p.setDepth(DEPTH.projectiles);
    const v = BALANCE.enemies.voter;
    p.body.setVelocity(dir * v.jarSpeed, -360);
    p.body.setGravityY(v.jarGravity - BALANCE.player.gravity);
    p.setAngularVelocity(dir * 400);
    this.expire(p, 2600);
    return p;
  }

  /** Player's chestnut or 'Kapital' book: an arc that stuns (bosses: damage). */
  throwNut(x, y, dir, kind = 'chestnut', opts = {}) {
    const n = BALANCE.nuts;
    const frame = kind === 'book' ? 'kapital_open' : 'chestnut';
    const [key, fr] = this.tex(frame, '__jar');
    const p = this.nuts.create(x, y, key, fr);
    p.kind = kind;
    p.setDepth(DEPTH.projectiles).setScale(kind === 'book' ? 0.75 : 0.6);
    p.body.setVelocity(dir * n.speed, opts.lift ?? n.lift);
    p.body.setGravityY((opts.gravity ?? n.gravity) - BALANCE.player.gravity);
    p.body.setSize(p.width * 0.8, p.height * 0.8);
    p.setAngularVelocity(dir * 720);
    this.expire(p, 1600);
    return p;
  }

  /** Generic hostile throw (kids' and MPs' chestnuts, chocolate, notes, papers). */
  throwHostile(kind, frame, x, y, dir, speed, lift = -300, gravity = 700, scale = 0.7) {
    const [key, fr] = this.tex(frame, '__jar');
    const p = this.hostile.create(x, y, key, fr);
    p.kind = kind;
    p.setDepth(DEPTH.projectiles).setScale(scale);
    p.body.setVelocity(dir * speed, lift);
    p.body.setGravityY(gravity - BALANCE.player.gravity);
    p.body.setSize(p.width * 0.7, p.height * 0.7);
    p.setAngularVelocity(dir * 480);
    this.expire(p, 2600);
    return p;
  }

  /** Aimed hostile throw: lands near (tx, ty) after `t` seconds (seated MPs lob chestnuts). */
  lob(kind, frame, x, y, tx, ty, t = 1.1, gravity = 700, scale = 0.6) {
    const [key, fr] = this.tex(frame, '__jar');
    const p = this.hostile.create(x, y, key, fr);
    p.kind = kind;
    p.setDepth(DEPTH.projectiles).setScale(scale);
    p.body.setGravityY(gravity - BALANCE.player.gravity);
    p.body.setVelocity((tx - x) / t, (ty - y - 0.5 * gravity * t * t) / t);
    p.body.setSize(p.width * 0.7, p.height * 0.7);
    p.setAngularVelocity(480);
    this.expire(p, (t + 1.5) * 1000);
    return p;
  }

  /** Gavel shockwave: slides along the floor both ways; jump over it. */
  shockwave(x, floorY, dir, speed) {
    const [key, fr] = this.tex('fx_shock', '__pr');
    const p = this.hostile.create(x, floorY, key, fr);
    p.kind = 'shockwave';
    p.setOrigin(0.5, 1).setDepth(DEPTH.projectiles);
    if (dir < 0) p.setFlipX(true);
    p.body.setAllowGravity(false);
    p.body.setSize(p.width * 0.8, Math.min(30, p.height)).setOffset(p.width * 0.1, p.height - Math.min(30, p.height));
    p.body.setVelocity(dir * speed, 0);
    p.noWallDestroy = true;
    this.expire(p, 2400);
    return p;
  }

  expire(p, ms) {
    this.scene.time.delayedCall(ms, () => { if (p.active) p.destroy(); });
  }

  /** Small burst of particles (debris, cash confetti). */
  burst(x, y, color = 0xffe066, n = 8) {
    for (let i = 0; i < n; i++) {
      const r = this.scene.add.rectangle(x, y, 6, 6, color).setDepth(DEPTH.fx);
      this.scene.tweens.add({
        targets: r, x: x + Phaser.Math.Between(-60, 60), y: y + Phaser.Math.Between(-75, 15),
        alpha: 0, duration: 500, onComplete: () => r.destroy(),
      });
    }
  }
}
