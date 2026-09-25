import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { Kid } from './Chestnut.js';
import { Boss } from './Bosses.js';
import { BALANCE } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { audio } from '../../core/Audio.js';

/**
 * World 3 cast: the oligarch's party (bandits, mafiosi, the mafia boss with his offer) and the block
 * district at golden hour (gopniks with beer bottles, citizens with eggs, dogs, the gopnik gang).
 */

/** Is the politician "one of us" for the criminal world? */
export function wellCorrupt() {
  const c = BALANCE.enemies.bandit;
  return GameState.heat >= c.friendlyHeat || GameState.wallet >= c.friendlyWallet;
}

/** Does the district hate you? After the mafia's money, or with high heat. */
/** Falling balconies and panels: only for the truly corrupt (the mafia's money, or heat tier 3+). */
export function debrisHostile() {
  return GameState.mafiaChoice === 'yes' || GameState.tier.id >= 3;
}

export function districtHostile() {
  return GameState.mafiaChoice === 'yes' || GameState.tier.id >= BALANCE.enemies.citizen.hostileTier;
}

/** Party bandit: ignores a well-corrupt politician ("one of ours"), beats up an honest one. */
export class Bandit extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'bandit', 'bandit_idle', { speed: BALANCE.enemies.bandit.speed, ...opts });
    this.always = !!opts.always;           // mafiosi in the boss fight
    this.nextPunchAt = 0;
    this.greeted = false;
  }

  get friendly() { return !this.always && wellCorrupt(); }
  get harmless() { return super.harmless || this.friendly; }

  think(now) {
    const c = BALANCE.enemies.bandit;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('bribed')); return; }
    const dx = this.player.x - this.x;
    if (this.friendly) {
      this.body.setVelocityX(0);
      this.dir = Math.sign(dx) || this.dir;
      this.playIf(this.anim('idle'));
      if (!this.greeted && Math.abs(dx) < 220) { this.greeted = true; this.say('bubble_bandit_friend', 1500, '#7ddf7d'); }
      return;
    }
    if (Math.abs(dx) < c.aggroRange && Math.abs(this.player.y - this.y) < 120) {
      this.dir = Math.sign(dx) || this.dir;
      if (Math.abs(dx) < 70) {
        this.body.setVelocityX(0);
        if (now >= this.nextPunchAt) {
          this.nextPunchAt = now + c.punchEverySec * 1000;
          this.playIf(this.anim('punch'));
          this.player.hurt(this.x, 'bandit', now);
        } else this.playIf(this.anim('knuckles'));
      } else if (!(this.onGround && this.ledgeAhead())) {
        this.body.setVelocityX(this.dir * this.speed * 1.3);
        this.playIf(this.anim('walk'));
      }
      if (!this.warned) { this.warned = true; this.say('bubble_bandit_angry', 1200, '#ff6b6b'); }
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }

  onPlayerContact() { /* punches only */ }
}

/**
 * The mafia boss. First a host: when you come close he makes The Offer (a Yes/No choice handled by
 * the level). Refuse and it becomes a boss fight you are meant to lose; accept and the cut scene rolls.
 */
export class MafiaBoss extends Boss {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'mafia', BALANCE.bosses.mafia, { hitbox: { w: 80, h: 120, oy: 18 }, ...opts });
    this.offered = false;
    this.fighting = false;
    this.nextStompAt = 0;
    this.nextPunchAt = 0;
  }

  get harmless() { return !this.fighting || super.harmless; }

  wake() {
    if (this.fighting) { super.wake(); return; }
    if (this.offered) return;
    this.offered = true;
    this.playIf(this.anim('offer'));
    this.say('bubble_mafia_offer', 2600, '#f2c14e');
    this.scene.mafiaOffer(this);
  }

  startFight() {
    this.fighting = true;
    this.awake = false;
    super.wake();
  }

  think(now, dt) {
    if (!this.fighting) {
      this.body.setVelocityX(0);
      this.dir = Math.sign(this.player.x - this.x) || this.dir;
      if (!this.offered) this.playIf(this.anim('idle'));
      if (Math.abs(this.player.x - this.x) < 330 && Math.abs(this.player.y - this.y) < 160) this.wake();
      return;
    }
    super.think(now, dt);
  }

  onNutHit(kind) {
    if (!this.fighting) return false;
    return super.onNutHit(kind);
  }

  onCashHit() { return this.fighting ? 'refused' : 'bribed'; }

  fight(now) {
    const c = this.cfg;
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (now >= this.nextStompAt && this.onGround) {
      this.nextStompAt = now + c.stompEverySec * 1000;
      this.body.setVelocityX(0);
      this.playIf(this.anim('stomp'));
      this.scene.cameras.main.shake(150, 0.006);
      const floor = this.body.bottom;
      this.scene.projectiles.shockwave(this.x - 40, floor, -1, c.shockSpeed);
      this.scene.projectiles.shockwave(this.x + 40, floor, 1, c.shockSpeed);
      this.actionUntil = now + 700;
      return;
    }
    if (Math.abs(dx) < 110 && now >= this.nextPunchAt) {
      this.nextPunchAt = now + 1200;
      this.body.setVelocityX(0);
      this.playIf(this.anim('punch'));
      this.player.hurt(this.x, 'mafia', now);
      this.actionUntil = now + 500;
      return;
    }
    this.approach(1, 80);
  }
}

/** Gopnik kid in a tracksuit: squats, throws empty beer bottles. Never runs out of bottles. */
export class Gopnik extends Kid {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, { skin: 'gopnik', ammoFrame: 'beer_bottle', ammoKind: 'bottle', ...opts });
    this.type = 'gopnik';
    this.nuts = 99;
  }

  think(now) {
    this.nuts = 99;
    if (!this.player) return;
    const far = Math.abs(this.player.x - this.x) > BALANCE.enemies.kid.throwRange;
    if (far && !this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('squat')); return; }
    super.think(now);
  }
}

/** Angry citizen: calm and friendly to a decent politician, throws eggs at a corrupt one. */
export class Citizen extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'citizen', 'citizen_idle', { speed: BALANCE.enemies.citizen.speed, ...opts });
    this.nextThrowAt = scene.time.now + 800;
    this.greeted = false;
  }

  get hostile() { return !this.bribed && districtHostile(); }
  get harmless() { return super.harmless || !this.hostile; }
  onPlayerContact() {}

  think(now) {
    const c = BALANCE.enemies.citizen;
    const dx = this.player.x - this.x;
    if (!this.hostile) {
      this.body.setVelocityX(0);
      this.dir = Math.sign(dx) || this.dir;
      this.playIf(this.anim(Math.abs(dx) < 260 ? 'wave' : 'idle'));
      if (!this.greeted && Math.abs(dx) < 260) { this.greeted = true; this.say('bubble_citizen_calm', 1400, '#7ddf7d'); }
      return;
    }
    if (Math.abs(dx) < c.throwRange && Math.abs(this.player.y - this.y) < 180) {
      this.dir = Math.sign(dx) || this.dir;
      this.body.setVelocityX(0);
      if (now >= this.nextThrowAt) {
        this.nextThrowAt = now + c.throwEverySec * 1000;
        this.playIf(this.anim('throw'));
        if (!this.shouted) { this.shouted = true; this.say('bubble_citizen_angry', 1200, '#ff6b6b'); }
        this.scene.projectiles.lob('egg', 'egg', this.x + this.dir * 20, this.y - 60, this.player.x, this.player.y - 40,
          Phaser.Math.Clamp(Math.abs(dx) / c.eggSpeed, 0.5, 1.1), 700, 0.9);
      } else this.playIf(this.anim('angry'));
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}

/** A dog on a walk: barks and bites a corrupt politician, ignores a decent one. */
export class Dog extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'dog', 'dog_sit', { speed: BALANCE.enemies.dog.speed, hitbox: { w: 40, h: 34, oy: 56 }, ...opts });
  }

  get harmless() { return super.harmless || !districtHostile(); }

  think() {
    const c = BALANCE.enemies.dog;
    const dx = this.player.x - this.x;
    if (this.bribed || !districtHostile()) { this.body.setVelocityX(0); this.playIf(this.anim('sit')); return; }
    if (Math.abs(dx) < c.chaseRange && Math.abs(this.player.y - this.y) < 80 && !(this.onGround && this.ledgeAhead())) {
      this.dir = Math.sign(dx) || this.dir;
      this.body.setVelocityX(this.dir * this.speed);
      this.playIf(this.anim(Math.abs(dx) < 90 ? 'bark' : 'run'));
      return;
    }
    this.body.setVelocityX(0);
    this.playIf(this.anim('sit'));
  }
}

/** The dog's owner: harmless, shouts at a corrupt politician. */
export class DogWalker extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'dogwalker', 'dogwalker_idle', { speed: 50, ...opts });
  }

  get harmless() { return true; }
  onPlayerContact() {}

  think() {
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (districtHostile() && Math.abs(dx) < 300) {
      this.body.setVelocityX(0);
      this.playIf(this.anim('shout'));
      if (!this.shouted) { this.shouted = true; this.say('bubble_dogwalker_angry', 1400, '#ff6b6b'); }
      return;
    }
    this.patrol();
    this.playIf(this.anim('walk'));
  }
}

/** The gopnik gang: a leader who calls two of his boys when the fight starts. */
export class GangBoss extends Boss {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'gopboss', BALANCE.bosses.gopboss, { hitbox: { w: 44, h: 80, oy: 10 }, ...opts });
    this.nextPunchAt = 0;
    this.nextThrowAt = 0;
  }

  wake() {
    if (this.awake) return;
    super.wake();
    for (const dx of [-120, 140]) {
      const g = this.scene.spawnEnemy('gopnik', this.x + dx, this.y);
      if (g) g.say('bubble_gopnik_gang', 1200, '#ff6b6b');
    }
  }

  fight(now) {
    const c = this.cfg;
    const dx = this.player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    if (Math.abs(dx) < 80 && now >= this.nextPunchAt) {
      this.nextPunchAt = now + 1100;
      this.body.setVelocityX(0);
      this.playIf(this.anim('punch'));
      this.player.hurt(this.x, 'gopboss', now);
      this.actionUntil = now + 400;
      return;
    }
    if (Math.abs(dx) > 220 && now >= this.nextThrowAt) {
      this.nextThrowAt = now + c.throwEverySec * 1000;
      this.playIf(this.anim('swagger'));
      this.scene.projectiles.lob('bottle', 'beer_bottle', this.x + this.dir * 20, this.y - 60, this.player.x, this.player.y - 40, 0.9);
      this.actionUntil = now + 400;
      return;
    }
    this.approach(1.1, 60);
  }
}

export function playBark() { audio.playDenied(); }
