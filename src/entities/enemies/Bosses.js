import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { BALANCE } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { audio } from '../../core/Audio.js';

/**
 * Boss base: hit points instead of stuns. Chestnuts do 1 damage, 'Kapital' books 2.
 * A (big) bribe also ends the fight — the corrupt way out. The goal of a boss level stays
 * locked until the boss is defeated either way (Level.onBossDefeated).
 */
export class Boss extends Enemy {
  constructor(scene, x, y, type, cfg, opts = {}) {
    super(scene, x, y, type, `${type}_idle`, { speed: cfg.speed, ...opts });
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.isBoss = true;
    this.awake = false;
    this.defeated = false;
    this.hurtUntil = 0;
    this.actionUntil = 0;
    this.home = x;
  }

  get harmless() { return this.defeated || this.bribed; }

  wake() {
    if (this.awake) return;
    this.awake = true;
    this.scene.onBossWake(this);
    this.say(`bubble_${this.type}_intro`, 2200, '#ffe66d');
  }

  onNutHit(kind) {
    if (this.defeated) return false;
    const now = this.scene.time.now;
    this.wake();
    if (now < this.hurtUntil) return true;            // brief invulnerability: projectile absorbed
    const n = BALANCE.nuts;
    this.hp = Math.max(0, this.hp - (kind === 'book' ? n.bookDamage : n.chestnutDamage));
    this.hurtUntil = now + BALANCE.bosses.invulnMs;
    this.setTint(0xff8080);
    this.scene.time.delayedCall(140, () => this.active && this.clearTint());
    this.playIf(this.anim('hurt'));
    this.actionUntil = Math.max(this.actionUntil, now + 250);
    this.scene.onBossHit(this);
    if (this.hp <= 0) this.defeat('beaten');
    return true;
  }

  becomeBribed() {
    this.bribed = true;
    this.say(`bubble_${this.type}_bribed`, 2200, '#7ddf7d');
    this.defeat('bribed');
  }

  defeat(how) {
    if (this.defeated) return;
    this.defeated = true;
    this.body.setVelocity(0, 0);
    this.clearTint();
    this.playIf(this.anim(how === 'bribed' ? 'bribed' : 'defeated'));
    if (how !== 'bribed') this.say(`bubble_${this.type}_defeated`, 2200, '#7ddf7d');
    this.scene.onBossDefeated(this, how);
  }

  preUpdate(time, delta) {
    if (this.defeated) {
      Phaser.Physics.Arcade.Sprite.prototype.preUpdate.call(this, time, delta);
      this.body.setVelocityX(0);
      if (this.bubble) {
        this.bubble.setPosition(this.x, this.y - this.displayHeight * this.originY - 10);
        if (time > this.bubbleUntil) { this.bubble.destroy(); this.bubble = null; }
      }
      return;
    }
    super.preUpdate(time, delta);
  }

  think(now, dt) {
    if (!this.awake) {
      this.body.setVelocityX(0);
      this.playIf(this.anim('idle'));
      if (Math.abs(this.player.x - this.x) < 520 && Math.abs(this.player.y - this.y) < 260) this.wake();
      return;
    }
    if (now < this.actionUntil) return;
    this.fight(now, dt);
  }

  approach(speedMult = 1, keep = 60) {
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (Math.abs(dx) > keep && !(this.onGround && this.ledgeAhead())) {
      this.body.setVelocityX(this.dir * this.speed * speedMult);
      this.playIf(this.anim('walk'));
    } else {
      this.body.setVelocityX(0);
      this.playIf(this.anim('idle'));
    }
  }

  fight() { this.approach(); }
}

/** Mariinsky park: a street animator in a Patron dog costume. Dashes, jumps, stomps, begs for tips. */
export class AnimatorBoss extends Boss {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'animator', BALANCE.bosses.animator, { hitbox: { w: 70, h: 110, oy: 28 }, ...opts });
    this.nextDashAt = 0;
    this.nextJumpAt = 0;
    this.nextBegAt = 0;
  }

  fight(now) {
    const c = this.cfg;
    const dx = this.player.x - this.x;
    if (!this.nextDashAt) { this.nextDashAt = now + 1500; this.nextJumpAt = now + c.jumpEverySec * 1000; }
    if (now >= this.nextDashAt && this.onGround) {
      this.nextDashAt = now + c.dashEverySec * 1000;
      this.dir = Math.sign(dx) || this.dir;
      this.body.setVelocityX(0);
      this.playIf(this.anim('crouch'));
      this.actionUntil = now + 1150;
      this.scene.time.delayedCall(450, () => {
        if (!this.active || this.defeated || this.stunned) return;
        this.playIf(this.anim('dash'));
        this.body.setVelocityX(this.dir * c.dashSpeed);
        audio.playJump();
      });
      this.scene.time.delayedCall(1100, () => { if (this.active && !this.defeated) this.body.setVelocityX(0); });
      return;
    }
    if (now >= this.nextJumpAt && this.onGround) {
      this.nextJumpAt = now + c.jumpEverySec * 1000;
      this.dir = Math.sign(dx) || this.dir;
      this.body.setVelocity(this.dir * Math.min(Math.abs(dx) * 1.2, 330), -720);
      this.playIf(this.anim('jump'));
      this.actionUntil = now + 400;
      this.landing = true;
      return;
    }
    if (this.landing && this.onGround && this.body.velocity.y >= 0) {
      this.landing = false;
      this.playIf(this.anim('stomp'));
      this.scene.cameras.main.shake(140, 0.005);
      const floor = this.body.bottom;
      this.scene.projectiles.shockwave(this.x - 30, floor, -1, 300);
      this.scene.projectiles.shockwave(this.x + 30, floor, 1, 300);
      this.actionUntil = now + 450;
      return;
    }
    if (now >= this.nextBegAt && Math.abs(dx) < 220) {
      this.nextBegAt = now + 6000;
      this.playIf(this.anim('beg'));
      this.say('bubble_animator_beg', 1600, '#f2c14e');
      this.body.setVelocityX(0);
      this.actionUntil = now + 900;
      return;
    }
    this.approach(1, 50);
  }
}

/** Bunker: the boss rat with a balalaika. Strums arcs of music notes, hops at you. */
export class RatBoss extends Boss {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'ratboss', BALANCE.bosses.ratboss, { hitbox: { w: 60, h: 80, oy: 10 }, ...opts });
    this.nextNotesAt = 0;
    this.nextJumpAt = 0;
  }

  fight(now) {
    const c = this.cfg;
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (!this.nextNotesAt) { this.nextNotesAt = now + 1000; this.nextJumpAt = now + c.jumpEverySec * 1000; }
    if (now >= this.nextNotesAt) {
      this.nextNotesAt = now + c.noteEverySec * 1000 * (this.hp <= this.maxHp / 2 ? 0.7 : 1);
      this.body.setVelocityX(0);
      this.playIf(this.anim('strum'));
      audio.playCheckpoint();
      for (let i = 0; i < 3; i++) {
        this.scene.time.delayedCall(i * 140, () => {
          if (!this.active || this.defeated) return;
          this.scene.projectiles.throwHostile('note', i % 2 ? 'note2' : 'note1', this.x + this.dir * 20, this.y - 70,
            this.dir, c.noteSpeed * (0.7 + i * 0.25), -380 + i * 90, 650, 0.8);
        });
      }
      this.actionUntil = now + 700;
      return;
    }
    if (now >= this.nextJumpAt && this.onGround) {
      this.nextJumpAt = now + c.jumpEverySec * 1000;
      this.body.setVelocity(this.dir * Math.min(Math.abs(dx), 280), -640);
      this.playIf(this.anim('jump'));
      this.actionUntil = now + 500;
      return;
    }
    this.approach(1, 160);
  }
}

/**
 * Session hall: THE SPEAKER. Gavel slams send shockwaves along the floor (jump them), stacks of
 * draft laws fly at you, and below half health he calls a vote: every seated MP throws at once.
 */
export class SpeakerBoss extends Boss {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'speaker', BALANCE.bosses.speaker, { hitbox: { w: 84, h: 124, oy: 14 }, ...opts });
    this.nextSlamAt = 0;
    this.nextPaperAt = 0;
    this.nextChargeAt = 0;
    this.rage = false;
  }

  get pace() { return this.rage ? 0.7 : 1; }

  fight(now) {
    const c = this.cfg;
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (!this.nextSlamAt) {
      this.nextSlamAt = now + 1600; this.nextPaperAt = now + 2600; this.nextChargeAt = now + 7000;
    }
    if (!this.rage && this.hp <= this.maxHp * c.phase2At) {
      this.rage = true;
      this.baseSpeed = c.speed * 1.35;
      this.playIf(this.anim('rage'));
      this.say('bubble_speaker_vote', 1800, '#ff6b6b');
      this.scene.cameras.main.shake(300, 0.006);
      this.scene.speakerVote();
      this.actionUntil = now + 900;
      return;
    }
    if (now >= this.nextSlamAt && this.onGround) {
      this.nextSlamAt = now + c.slamEverySec * 1000 * this.pace;
      this.body.setVelocityX(0);
      this.playIf(this.anim('raise'));
      this.say('bubble_speaker_order', 900, '#ffe66d');
      this.actionUntil = now + 1000;
      this.scene.time.delayedCall(600, () => {
        if (!this.active || this.defeated || this.stunned) return;
        this.playIf(this.anim('slam'));
        this.scene.cameras.main.shake(160, 0.007);
        audio.playBridgeCrack();
        const floor = this.body.bottom;
        this.scene.projectiles.shockwave(this.x - 40, floor, -1, c.shockSpeed);
        this.scene.projectiles.shockwave(this.x + 40, floor, 1, c.shockSpeed);
        if (this.rage) this.scene.speakerVote();
      });
      return;
    }
    if (now >= this.nextPaperAt) {
      this.nextPaperAt = now + c.paperEverySec * 1000 * this.pace;
      this.body.setVelocityX(0);
      this.playIf(this.anim('throw'));
      this.scene.projectiles.lob('papers', 'papers', this.x + this.dir * 30, this.y - 90,
        this.player.x, this.player.y - 30, Phaser.Math.Clamp(Math.abs(dx) / 420, 0.6, 1.2), 700, 0.8);
      this.actionUntil = now + 500;
      return;
    }
    if (now >= this.nextChargeAt && Math.abs(dx) > 260 && this.onGround) {
      this.nextChargeAt = now + 7000 * this.pace;
      this.playIf(this.anim('charge'));
      this.say('bubble_speaker_charge', 900, '#ff6b6b');
      this.body.setVelocityX(this.dir * c.chargeSpeed);
      this.actionUntil = now + 1100;
      this.scene.time.delayedCall(1050, () => { if (this.active && !this.defeated) this.body.setVelocityX(0); });
      return;
    }
    this.approach(1, 110);
  }

  /** The corrupt way out: only a very large bribe works, and only half the time. */
  onCashHit(rng) {
    if (this.defeated) return 'bribed';
    this.wake();
    return super.onCashHit(rng);
  }
}
