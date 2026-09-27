import Phaser from 'phaser';
import { BASELINE, FRAME, DEPTH } from '../../config/constants.js';
import { BALANCE } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { t, textStyle, hasText } from '../../core/i18n.js';

/**
 * Base enemy: patrol / alert / chase / attack / stunned / bribed / enraged / flee.
 * Subclasses override think(), onCashHit(), onNutHit(), onPlayerContact().
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, frame, opts = {}) {
    super(scene, x, y, 'chars', frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.type = type;
    this.skin = opts.skin || type;          // animation prefix (e.g. journalist_f uses the Journalist AI)
    // feet 6 px above the frame bottom for every frame size (96 px characters, 144 px bosses)
    this.setOrigin(0.5, (this.frame.height - (FRAME - BASELINE)) / this.frame.height);
    this.setDepth(DEPTH.enemies);
    this.hb = opts.hitbox || { w: 42, h: 78, oy: 12 };
    this.body.setSize(this.hb.w, this.hb.h);
    this.fixOffset(true);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityY(BALANCE.player.terminal);
    this.stateName = 'patrol';
    this.dir = opts.dir || -1;
    this.bribed = false;
    this.failedAttempts = 0;
    this.enragedUntil = 0;
    this.fleeUntil = 0;
    this.stunUntil = 0;
    this.baseSpeed = opts.speed || 90;
    this.patrolMin = opts.patrolMin ?? x - 240;
    this.patrolMax = opts.patrolMax ?? x + 240;
    this.bubble = null;
    this.bubbleUntil = 0;
    this.placeholder = opts.placeholder || false;
    if (this.placeholder) this.makeLabel(opts.label || type);
  }

  makeLabel(text) {
    this.label = this.scene.add.text(this.x, this.y - 104, text.toUpperCase(), textStyle(6, '#ffe66d', { stroke: '#000', strokeThickness: 3 }))
      .setOrigin(0.5).setDepth(DEPTH.enemies + 1);
  }

  fixOffset(force = false) {
    const w = this.frame.width;
    if (force || w !== this._lastW) {
      this._lastW = w;
      this.body.setOffset((w - this.hb.w) / 2, this.hb.oy);
    }
  }

  get player() { return this.scene.player; }
  get speed() {
    const enraged = this.scene.time.now < this.enragedUntil;
    return this.baseSpeed * (enraged ? BALANCE.bribe.enragedSpeedMult : 1);
  }
  get harmless() {
    const now = this.scene.time.now;
    return this.bribed || now < this.fleeUntil || now < this.stunUntil;
  }
  get stunned() { return this.scene.time.now < this.stunUntil; }
  anim(name) { return `${this.skin}_${name}`; }
  get onGround() { return this.body.blocked.down || this.body.touching.down; }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.fixOffset();
    if (this.bubble) {
      this.bubble.setPosition(this.x, this.y - 110);
      if (time > this.bubbleUntil) { this.bubble.destroy(); this.bubble = null; }
    }
    if (this.label) this.label.setPosition(this.x, this.y - 100);
    if (this.stars) {
      if (time < this.stunUntil) this.stars.setPosition(this.x, this.y - this.displayHeight * this.originY - 6);
      else { this.stars.destroy(); this.stars = null; }
    }
    if (!this.player || this.player.dead) { this.body.setVelocityX(0); return; }
    if (time < this.stunUntil) {
      this.body.setVelocityX(0);
      if (this.scene.anims.exists(this.anim('stunned'))) this.playIf(this.anim('stunned'));
      return;
    }
    this.think(time, delta / 1000);
    this.setFlipX(this.dir < 0);
  }

  /** Default behaviour: patrol between bounds, turn at walls and ledges. */
  patrol() {
    if (this.x <= this.patrolMin) this.dir = 1;
    if (this.x >= this.patrolMax) this.dir = -1;
    if (this.body.blocked.left) this.dir = 1;
    if (this.body.blocked.right) this.dir = -1;
    if (this.onGround && this.ledgeAhead()) this.dir *= -1;
    this.body.setVelocityX(this.dir * this.speed);
  }

  ledgeAhead() {
    const layer = this.scene.layer;
    if (!layer) return false;
    const probeX = this.x + this.dir * (this.hb.w / 2 + 9);
    const probeY = this.y + 9;
    const tile = layer.getTileAtWorldXY(probeX, probeY, true);
    const support = tile && tile.collides;
    if (support) return false;
    // moving platforms / bridges also count as support
    const hit = this.scene.physics.overlapRect(probeX - 2, probeY - 2, 4, 6, true, true);
    return !hit.some((b) => b.gameObject !== this && (b.immovable || b.isStatic));
  }

  walkAwayFrom(x) {
    this.dir = this.x < x ? -1 : 1;
    this.body.setVelocityX(this.dir * this.speed);
  }

  distanceToPlayer() {
    return Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
  }

  facingPlayer() {
    return Math.sign(this.player.x - this.x) === this.dir;
  }

  think() { this.patrol(); }

  say(key, ms = 1400, color = '#ffffff') {
    if (!hasText(key)) return;          // not every enemy has a line for every situation
    if (this.bubble) this.bubble.destroy();
    this.bubble = this.scene.add.text(this.x, this.y - 110, t(key), textStyle(8, color, { stroke: '#000', strokeThickness: 3, align: 'center', wordWrap: { width: 160 } }))
      .setOrigin(0.5, 1).setDepth(DEPTH.fx);
    this.bubbleUntil = this.scene.time.now + ms;
  }

  /** Cash hit resolved by BribeSystem: returns 'bribed' | 'refused'. */
  onCashHit(rng) {
    if (this.bribed) return 'bribed';
    const cfg = BALANCE.bribe[this.bribeKey] || { odds: 0 };
    const odds = (cfg.odds ?? 0) * Math.pow(BALANCE.bribe.failOddsMult, this.failedAttempts);
    if (rng.chance(odds)) {
      this.becomeBribed();
      return 'bribed';
    }
    this.failedAttempts += 1;
    this.enrage();
    return 'refused';
  }

  /** Bribe odds / cost entry: a skin may have its own (journalist_f), else the type's. */
  get bribeKey() { return BALANCE.bribe[this.skin] ? this.skin : this.type; }

  becomeBribed() {
    this.bribed = true;
    this.stateName = 'bribed';
    const key = `${this.type}_bribed`;
    if (this.scene.anims.exists(key)) this.play(key, true);
    this.say(`bubble_${this.type}_bribed`, 1800, '#7ddf7d');
    if (!this.staysWhenBribed) this.vanish(1500);
  }

  /** A bribed enemy stays where it is (seated MPs keep their seats, they just stop throwing). */
  get staysWhenBribed() { return false; }

  /**
   * Leave the level: fade out after `delayMs` and switch off (the object stays, inactive, so any
   * reference to it stays valid). Bribed enemies and knocked-out rats go, so the screen stays tidy.
   */
  vanish(delayMs = 0, opts = {}) {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.time.delayedCall(delayMs, () => {
      if (!this.active) return;
      this.scene.tweens.add({
        targets: this, alpha: 0, y: this.y + (opts.sink || 0), duration: 500,
        onComplete: () => {
          if (this.bubble) { this.bubble.destroy(); this.bubble = null; }
          if (this.stars) { this.stars.destroy(); this.stars = null; }
          if (this.label) this.label.setVisible(false);
          this.disableBody(true, true);
        },
      });
    });
  }

  enrage() {
    this.enragedUntil = this.scene.time.now + BALANCE.bribe.enragedSec * 1000;
    this.say(`bubble_${this.type}_refuse`, 1400, '#ff6b6b');
  }

  /**
   * Hit by the player's chestnut / 'Kapital' book: dizzy for a while (harmless, frozen).
   * Returns true when the projectile was used up. Bosses override this to take damage.
   */
  onNutHit(kind) {
    if (this.bribed) return false;
    const n = BALANCE.nuts;
    const sec = kind === 'book' ? n.bookStunSec : n.chestnutStunSec;
    this.stun(sec);
    return true;
  }

  stun(sec) {
    const now = this.scene.time.now;
    this.stunUntil = Math.max(this.stunUntil, now + sec * 1000);
    this.body.setVelocityX(0);
    // characters with a painted dizzy pose already show stars; others get the floating star ring
    if (!this.stars && !this.scene.anims.exists(this.anim('stunned')) && this.scene.textures.get('props').has('fx_stars')) {
      this.stars = this.scene.add.image(this.x, this.y - 90, 'props', 'fx_stars').setDepth(DEPTH.fx).setScale(0.8);
      this.scene.tweens.add({ targets: this.stars, angle: 360, duration: 900, repeat: -1 });
    }
    this.say(`bubble_${this.type}_stunned`, 900, '#e8b06a');
  }

  onPlayerContact(player) {
    if (this.harmless) return;
    player.hurt(this.x, this.type);
  }

  playIf(key) {
    if (this.scene.anims.exists(key)) { if (this.anims.currentAnim?.key !== key) this.play(key, true); }
  }

  destroy(fromScene) {
    if (this.stars) this.stars.destroy();
    if (this.bubble) this.bubble.destroy();
    if (this.label) this.label.destroy();
    super.destroy(fromScene);
  }
}
