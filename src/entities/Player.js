import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { BASELINE, FRAME, DEPTH } from '../config/constants.js';
import { GameState } from '../core/GameState.js';
import { audio } from '../core/Audio.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'chars', GameState.jacketless && scene.textures.get('chars').has('mpshirt_idle') ? 'mpshirt_idle' : 'politician_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, BASELINE / FRAME);
    this.setDepth(DEPTH.player);
    const hb = BALANCE.player.hitbox;
    this.body.setSize(hb.w, hb.h);
    this.body.setOffset(hb.ox, hb.oy);
    this.body.setMaxVelocityY(BALANCE.player.terminal);
    this.body.setCollideWorldBounds(true);
    this.body.onWorldBounds = false;
    this.facing = 1;
    this.invulnUntil = 0;
    this.stunUntil = 0;
    this.dead = false;
    this.lastGroundMs = -9999;
    this.jumpBufferMs = -9999;
    this.jumpHeld = false;
    this.throwLock = 0;
    this.blinkUntil = 0;
    this.remorseUntil = 0;
    this.drinkUntil = 0;
  }

  get onGround() { return this.body.blocked.down || this.body.touching.down; }

  /** Wide poses use 128 px frames: keep the hitbox centred on the character. */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // Invulnerability blink, derived from the scene clock every frame so it can never end hidden
    // (timer-driven toggling used to fire once more after the "show again" call).
    const now = this.scene.time.now;
    this.setVisible(this.dead || now >= this.blinkUntil || Math.floor(now / 70) % 2 === 0);
    const w = this.frame.width;
    if (w !== this._lastW) {
      this._lastW = w;
      const hb = BALANCE.player.hitbox;
      this.body.setOffset((w - hb.w) / 2, hb.oy);
    }
  }

  get greed() {
    // slower and heavier the more cash is in the wallet
    const p = BALANCE.player;
    return Math.min(1, GameState.wallet / p.greedWalletRef);
  }

  handleInput(keys, now, dt) {
    if (this.dead) return;
    const p = BALANCE.player;
    const stunned = now < this.stunUntil;
    const left = keys.left.some((k) => k.isDown);
    const right = keys.right.some((k) => k.isDown);
    const jumpDown = keys.jump.some((k) => k.isDown);
    const jumpJust = keys.jump.some((k) => Phaser.Input.Keyboard.JustDown(k));

    const drunk = GameState.drunkProfile(now);
    const maxSpeed = p.speed * (1 - p.greedSpeedMax * this.greed) * (drunk ? drunk.speedMult : 1);
    // vodka: now and then the legs go their own way
    if (drunk && drunk.stumbleEverySec && this.onGround && now > (this.nextStumbleAt || 0)) {
      this.nextStumbleAt = now + drunk.stumbleEverySec * 1000 * (0.6 + Math.random() * 0.8);
      this.body.setVelocityX((Math.random() < 0.5 ? -1 : 1) * p.speed * 0.55);
    }
    const jumpV = p.jump * (1 - p.greedJumpMax * this.greed);
    let ax = 0;
    if (!stunned) {
      if (left && !right) { ax = -p.accel; this.facing = -1; }
      else if (right && !left) { ax = p.accel; this.facing = 1; }
    }
    if (ax !== 0) {
      this.body.setAccelerationX(ax);
      this.body.setDragX(0);
    } else {
      this.body.setAccelerationX(0);
      this.body.setDragX(p.drag);
    }
    this.body.setMaxVelocityX(maxSpeed);

    if (this.onGround) this.lastGroundMs = now;
    if (jumpJust) this.jumpBufferMs = now;
    const canCoyote = now - this.lastGroundMs <= p.coyoteMs;
    const buffered = now - this.jumpBufferMs <= p.jumpBufferMs;
    if (!stunned && buffered && canCoyote && this.body.velocity.y >= -10) {
      this.body.setVelocityY(jumpV);
      this.lastGroundMs = -9999;
      this.jumpBufferMs = -9999;
      audio.playJump();
    }
    // variable jump height
    if (!jumpDown && this.body.velocity.y < p.jumpCut) this.body.setVelocityY(p.jumpCut);

    this.setFlipX(this.facing < 0);
    this.animate(now, stunned);
  }

  /** Animation key for the current skin: the robbed politician (torn shirt) after the party. */
  k(name) {
    const pfx = GameState.jacketless ? 'mpshirt' : 'politician';
    const key = `${pfx}_${name}`;
    return this.scene.anims.exists(key) ? key : `politician_${name}`;
  }

  animate(now, stunned) {
    if (this.dead) return;
    let key;
    const drunk = !!GameState.drunk;
    const has = (k) => this.scene.anims.exists(k);
    if (now < this.remorseUntil && has(this.k('remorse'))) key = this.k('remorse');
    else if (now < this.drinkUntil && has(this.k('drink'))) key = this.k('drink');
    else if (stunned && has(this.k('hurt'))) key = this.k('hurt');
    else if (!this.onGround) key = this.body.velocity.y < 0 ? this.k('jump') : (this.scene.anims.exists(this.k('fall')) ? this.k('fall') : this.k('jump'));
    else if (Math.abs(this.body.velocity.x) > 20) key = drunk && has(this.k('drunk_walk')) ? this.k('drunk_walk') : this.k('walk');
    else key = drunk && has(this.k('drunk_idle')) ? this.k('drunk_idle') : this.k('idle');
    if (this.throwLock > now && this.scene.anims.exists(this.k('throw'))) key = this.k('throw');
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
  }

  /** Damage from an enemy/hazard. `reason` names the source for the HUD. Returns true if the hit landed. */
  hurt(fromX, reason = 'hit', now = this.scene.time.now) {
    if (this.dead || now < this.invulnUntil) return false;
    const p = BALANCE.player;
    this.invulnUntil = now + p.invulnSec * 1000;
    const dir = fromX === undefined ? -this.facing : (this.x < fromX ? -1 : 1);
    this.body.setVelocity(dir * p.knockback, -390);
    this.stunUntil = Math.max(this.stunUntil, now + 350);
    audio.playHurt();
    this.scene.cameras.main.flash(90, 200, 40, 40);
    if (this.scene.ui) this.scene.ui.flash(this.scene.tt(`hurt_${reason}`), '#ff6b6b', 800);
    this.startBlink(p.invulnSec * 1000);
    if (this.scene.onPlayerHurt) this.scene.onPlayerHurt(reason);
    this.loseReputation(reason, undefined, now);
    const nar = this.scene.narrator;
    if (nar) {
      if (reason === 'oldlady') nar.say('hurt_oldlady');
      else if (reason === 'chestnut') nar.say('hit_chestnut');
    }
    return true;
  }

  /**
   * Reputation damage by source (BALANCE.reputation.damage). The scripted mafia fight costs nothing
   * (it has its own knockout). At 0 the politician is finished: a life is lost.
   */
  loseReputation(reason, amount, now = this.scene.time.now) {
    const R = BALANCE.reputation;
    if (this.dead || this.scene.mafiaFight) return;
    const base = amount ?? (R.damage[reason] ?? R.damage.default);
    if (!base) return;
    const dmg = Math.round(base * (1 + (GameState.heat / 100) * R.corruptDamage));
    GameState.reputation = Math.max(0, GameState.reputation - dmg);
    this.repHitAt = now;
    GameState.emit();
    if (this.scene.ui && this.scene.ui.popValue) this.scene.ui.popValue(this.x, this.y - 110, `-${dmg}`, '#ff8f8f');
    if (GameState.reputation <= 0 && this.scene.killPlayer) this.scene.killPlayer('reputation');
  }

  /** Conscience attack: frozen in remorse (not a hit, no knockback). */
  remorse(sec, now = this.scene.time.now) {
    if (this.dead) return;
    this.remorseUntil = now + sec * 1000;
    this.stunUntil = Math.max(this.stunUntil, this.remorseUntil);
    this.body.setVelocityX(0);
  }

  stun(sec, now = this.scene.time.now) {
    if (this.dead) return;
    this.stunUntil = Math.max(this.stunUntil, now + sec * 1000);
    this.body.setVelocityX(0);
  }

  /** Classic invulnerability blink: fully on / fully off (applied in preUpdate). */
  startBlink(ms) {
    this.blinkUntil = this.scene.time.now + ms;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.body.setVelocity(0, -570);
    this.body.checkCollision.none = true;
    this.body.setAccelerationX(0);
    this.setVisible(true);
    this.setTint(0xff8080);
    this.play(this.k('hurt'), true);
    this.scene.tweens.add({ targets: this, angle: this.facing * 360, duration: 900 });
  }
}
