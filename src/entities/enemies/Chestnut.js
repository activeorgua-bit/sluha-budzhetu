import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { BALANCE } from '../../config/balance.js';
import { audio } from '../../core/Audio.js';

/**
 * World 2 cast (Mariinsky park, the Stalin-era bunker, the Rada corridor and session hall).
 * Everything here can be stunned with chestnuts / 'Kapital' books and most of it can be bribed.
 */

/** Grumpy old lady: shuffles towards you and whacks you with her walking stick. Touch is harmless. */
export class OldLady extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'oldlady', 'oldlady_idle', { speed: BALANCE.enemies.oldlady.speed, hitbox: { w: 42, h: 72, oy: 18 }, ...opts });
    this.windupUntil = 0;
    this.nextStrikeAt = 0;
  }

  onPlayerContact() { /* only the stick hurts */ }

  think(now) {
    const c = BALANCE.enemies.oldlady;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('bribed')); return; }
    const dx = this.player.x - this.x;
    const dy = Math.abs(this.player.y - this.y);
    if (this.windupUntil) {
      this.body.setVelocityX(0);
      if (now >= this.windupUntil) {
        this.windupUntil = 0;
        this.nextStrikeAt = now + c.strikeEverySec * 1000;
        this.playIf(this.anim('strike'));
        audio.playDenied();
        if (Math.abs(dx) < c.strikeRange + 24 && dy < 70 && Math.sign(dx) === this.dir) this.player.hurt(this.x, 'oldlady', now);
      }
      return;
    }
    if (Math.abs(dx) < c.aggroRange && dy < 90) {
      this.dir = Math.sign(dx) || this.dir;
      if (Math.abs(dx) <= c.strikeRange) {
        this.body.setVelocityX(0);
        if (now >= this.nextStrikeAt) {
          this.windupUntil = now + c.windupSec * 1000;
          this.playIf(this.anim('raise'));
          this.say('bubble_oldlady_strike', 900, '#ff6b6b');
        } else {
          this.playIf(this.anim('angry'));
        }
      } else {
        if (this.onGround && this.ledgeAhead()) { this.body.setVelocityX(0); this.playIf(this.anim('angry')); return; }
        this.body.setVelocityX(this.dir * this.speed);
        this.playIf(this.anim('walk'));
      }
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}

/** Naughty kid: collects chestnuts from the ground (racing you for them) and throws them at you. */
export class Kid extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'kid', `${opts.skin || 'kid'}_idle`, { speed: BALANCE.enemies.kid.speed, hitbox: { w: 36, h: 56, oy: 34 }, ...opts });
    this.nuts = BALANCE.enemies.kid.startNuts;
    this.ammoFrame = opts.ammoFrame || 'chestnut';
    this.ammoKind = opts.ammoKind || 'chestnut';
    this.nextThrowAt = 0;
    this.actionUntil = 0;
    this.target = null;
  }

  onPlayerContact() { /* kids never hurt by touching */ }

  findChestnut() {
    const r = BALANCE.nuts.kidPickupRange;
    let best = null; let bd = r;
    for (const p of this.scene.pickups.getChildren()) {
      if (!p.active || p.collected || p.kind !== 'chestnut') continue;
      if (Math.abs(p.y - this.y) > 80) continue;
      const d = Math.abs(p.x - this.x);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  think(now) {
    const c = BALANCE.enemies.kid;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('idle')); return; }
    if (now < this.actionUntil) { this.body.setVelocityX(0); return; }
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    // out of ammo: run for the nearest chestnut on the ground
    if (this.nuts <= 0) {
      if (!this.target || !this.target.active || this.target.collected) this.target = this.findChestnut();
      if (this.target) {
        const tx = this.target.x - this.x;
        this.dir = Math.sign(tx) || this.dir;
        if (Math.abs(tx) < 20) {
          this.target.collected = true;
          this.target.destroy();
          this.target = null;
          this.nuts += 1;
          this.actionUntil = now + 450;
          this.playIf(this.anim('pick'));
          this.say('bubble_kid_mine', 800, '#e8b06a');
        } else {
          this.body.setVelocityX(this.dir * this.speed * 1.3);
          this.playIf(this.anim('run'));
        }
        return;
      }
      this.patrol();
      this.playIf(this.anim('walk'));
      return;
    }
    if (Math.abs(dx) < c.throwRange && Math.abs(dy) < 200 && now >= this.nextThrowAt) {
      this.dir = Math.sign(dx) || this.dir;
      this.body.setVelocityX(0);
      this.playIf(this.anim('windup'));
      this.actionUntil = now + 320;
      this.nextThrowAt = now + c.throwEverySec * 1000;
      this.scene.time.delayedCall(300, () => {
        if (!this.active || this.stunned || this.bribed) return;
        this.nuts -= 1;
        this.playIf(this.anim('throw'));
        this.scene.projectiles.lob(this.ammoKind, this.ammoFrame, this.x + this.dir * 20, this.y - 50,
          this.player.x, this.player.y - 40, Phaser.Math.Clamp(Math.abs(dx) / c.nutSpeed, 0.45, 1.1));
      });
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}

/** Bunker rat in an ushanka: scurries about, bites on touch, chases you when you're close. */
export class Rat extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'rat', 'rat_idle', { speed: BALANCE.enemies.rat.speed, hitbox: { w: 40, h: 36, oy: 54 }, ...opts });
  }

  think() {
    const c = BALANCE.enemies.rat;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('bribed')); return; }
    const dx = this.player.x - this.x;
    if (Math.abs(dx) < c.chaseRange && Math.abs(this.player.y - this.y) < 60 && !(this.onGround && this.ledgeAhead())) {
      this.dir = Math.sign(dx) || this.dir;
      this.body.setVelocityX(this.dir * this.speed * 1.6);
      this.playIf(this.anim('run'));
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}

/** Opposition MP: shouts and throws chocolate bars. Hurts on touch. */
export class OppositionMP extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'oppmp', 'oppmp_idle', { speed: BALANCE.enemies.oppmp.speed, ...opts });
    this.nextThrowAt = scene.time.now + 1200;
  }

  think(now) {
    const c = BALANCE.enemies.oppmp;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('bribed')); return; }
    const dx = this.player.x - this.x;
    if (Math.abs(dx) < c.throwRange && Math.abs(this.player.y - this.y) < 160) {
      this.dir = Math.sign(dx) || this.dir;
      if (now >= this.nextThrowAt) {
        this.nextThrowAt = now + c.throwEverySec * 1000;
        this.body.setVelocityX(0);
        this.playIf(this.anim('throw'));
        this.say('bubble_oppmp_throw', 1000, '#ff6b6b');
        this.scene.projectiles.throwHostile('chocolate', 'chocolate', this.x + this.dir * 24, this.y - 60, this.dir, c.chocoSpeed, -330, 800, 0.7);
        return;
      }
      if (Math.abs(dx) > 200 && !(this.onGround && this.ledgeAhead())) {
        this.body.setVelocityX(this.dir * this.speed);
        this.playIf(this.anim('walk'));
      } else {
        this.body.setVelocityX(0);
        this.playIf(this.anim('shout'));
      }
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}

/** MP sitting in the session hall: watches, claps, lobs a chestnut now and then. Harmless to touch. */
export class SeatedMP extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'seatedmp', 'seatedmp_sit', { speed: 0, ...opts });
    this.nextThrowAt = scene.time.now + 1500 + Math.random() * 3000;
    this.body.setImmovable(true);
  }

  get harmless() { return true; }
  onPlayerContact() {}

  /** The speaker calls a vote: everybody throws at once (after a short random delay). */
  volley() { this.nextThrowAt = Math.min(this.nextThrowAt, this.scene.time.now + 200 + Math.random() * 700); }

  think(now) {
    const c = BALANCE.enemies.seatedmp;
    this.body.setVelocityX(0);
    if (this.bribed) { this.playIf(this.anim('clap')); return; }
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (Math.abs(dx) < c.throwRange && now >= this.nextThrowAt && this.scene.bossAwake) {
      this.nextThrowAt = now + c.throwEverySec * 1000 * (0.7 + Math.random() * 0.6);
      this.playIf(this.anim('throw'));
      this.scene.projectiles.lob('chestnut', 'chestnut', this.x + this.dir * 16, this.y - 60,
        this.player.x + Phaser.Math.Between(-30, 30), this.player.y - 30, Phaser.Math.FloatBetween(0.8, 1.3));
      this.scene.time.delayedCall(400, () => { if (this.active && !this.stunned) this.playIf(this.anim('sit')); });
      return;
    }
    if (this.anims.currentAnim?.key !== this.anim('throw')) this.playIf(Math.random() < 0.002 ? this.anim('clap') : this.anims.currentAnim?.key || this.anim('sit'));
  }
}

/** Parliament assistant: harmless background life. Walks with folders, drops them if hit. */
export class Assistant extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'assistant', `${opts.skin || 'assistant'}_idle`, { speed: BALANCE.enemies.assistant.speed, ...opts });
    this.nextLineAt = scene.time.now + 2000 + Math.random() * 4000;
  }

  get harmless() { return true; }
  onPlayerContact() {}

  think(now) {
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('bow')); return; }
    if (now > this.nextLineAt && this.distanceToPlayer() < 260) {
      this.nextLineAt = now + 7000;
      this.say('bubble_assistant_hello', 1400, '#ffffff');
      this.playIf(this.anim('phone'));
      this.body.setVelocityX(0);
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}
