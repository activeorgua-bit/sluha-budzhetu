import { Enemy } from './Enemy.js';
import { BALANCE, guardCost } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { audio } from '../../core/Audio.js';

const has = (scene, frame) => scene.textures.get('chars').has(frame);

/** Patrol police: harmless patrol, hurts on touch, always takes a bribe. */
export class Cop extends Enemy {
  constructor(scene, x, y, opts = {}) {
    const frame = has(scene, 'cop_idle') ? 'cop_idle' : 'politician_idle';
    super(scene, x, y, 'cop', frame, { speed: BALANCE.enemies.cop.speed, placeholder: frame !== 'cop_idle', label: 'cop', ...opts });
    if (this.placeholder) this.setTint(0x6f8fd6);
  }

  think() {
    if (this.bribed) { this.body.setVelocityX(0); this.playIf('cop_bribed'); return; }
    this.patrol();
    this.playIf(Math.abs(this.body.velocity.x) > 5 ? 'cop_walk' : 'cop_idle');
  }

  becomeBribed() {
    super.becomeBribed();
    audio.playCopBribed();
  }
}

/** Courtyard voter: waves at a clean politician, attacks a corrupt one with jars. */
export class Voter extends Enemy {
  constructor(scene, x, y, opts = {}) {
    const variant = opts.variant || (Math.random() < 0.5 ? 'babusya' : 'tracksuit');
    const frame = has(scene, `${variant}_idle`) ? `${variant}_idle` : 'journalist_idle';
    super(scene, x, y, 'voter', frame, { speed: BALANCE.enemies.voter.speed, placeholder: !has(scene, `${variant}_idle`), label: variant, ...opts });
    this.variant = variant;
    this.nextThrowAt = 0;
    this.saidCalm = false;
    if (this.placeholder) this.setTint(0xd6a06f);
  }

  get hostile() { return !this.bribed && GameState.tier.id >= BALANCE.enemies.voter.hostileTier; }
  get harmless() { return !this.hostile; }

  think(now) {
    const v = BALANCE.enemies.voter;
    if (!this.hostile) {
      this.body.setVelocityX(0);
      this.dir = Math.sign(this.player.x - this.x) || this.dir;
      this.playIf(this.bribed ? `${this.variant}_idle` : `${this.variant}_wave`);
      if (!this.saidCalm && this.distanceToPlayer() < 330) {
        this.saidCalm = true;
        this.say(this.bribed ? 'bubble_voter_bribed' : 'bubble_voter_calm', 1400, '#7ddf7d');
      }
      return;
    }
    const dx = this.player.x - this.x;
    if (Math.abs(dx) < v.range) {
      this.dir = Math.sign(dx) || this.dir;
      if (Math.abs(dx) > 60) this.body.setVelocityX(this.dir * this.speed); else this.body.setVelocityX(0);
      if (this.stateName !== 'angry') { this.stateName = 'angry'; this.say('bubble_voter_angry', 1200, '#ff6b6b'); }
      if (now >= this.nextThrowAt && Math.abs(dx) > 90) {
        this.nextThrowAt = now + v.throwEverySec * 1000;
        this.scene.projectiles.throwJar(this.x + this.dir * 21, this.y - 66, this.dir);
        this.playIf(`${this.variant}_throw`);
        return;
      }
      this.playIf(Math.abs(this.body.velocity.x) > 5 ? `${this.variant}_walk` : `${this.variant}_idle`);
    } else {
      this.patrol();
      this.playIf(`${this.variant}_walk`);
    }
  }
}

/** Party guest (oligarch): never hurts you — tempts you with money bags and blocks the way. */
export class PartyGuest extends Enemy {
  constructor(scene, x, y, opts = {}) {
    const frame = has(scene, 'oligarch_idle') ? 'oligarch_idle' : 'politician_idle';
    super(scene, x, y, 'guest', frame, { speed: 0, placeholder: frame !== 'oligarch_idle', label: 'oligarch', ...opts });
    if (this.placeholder) this.setTint(0xf2f2f2);
    this.body.setImmovable(true);
    this.body.allowGravity = false;
    this.nextDropAt = scene.time.now + 2000;
    this.moved = false;
  }

  get harmless() { return true; }

  think(now) {
    const g = BALANCE.enemies.guest;
    this.body.setVelocityX(0);
    this.dir = Math.sign(this.player.x - this.x) || this.dir;
    this.playIf('oligarch_dance');
    if (!this.moved && this.distanceToPlayer() < g.dropRange && now >= this.nextDropAt) {
      this.nextDropAt = now + g.dropEverySec * 1000;
      this.say('bubble_guest_offer', 1200, '#f2c14e');
      this.playIf('oligarch_offer');
      this.scene.spawnPickup('money_bag', this.x + this.dir * 72, this.y - 12, { falling: true });
    }
  }

  /** Player pressed E next to the guest: he steps aside, the clock loses 10 s. */
  interact() {
    if (this.moved) return false;
    this.moved = true;
    this.scene.tweens.add({ targets: this, x: this.x + 60 * (this.player.x < this.x ? 1 : -1), duration: 400 });
    this.scene.time.delayedCall(420, () => this.body.checkCollision.none = true);
    this.scene.penalizeTime(BALANCE.enemies.guest.drinkPenaltySec);
    return true;
  }
}

/** Border guard at the airport gate. Free passage for a clean run; a bribe otherwise; else arrest. */
export class BorderGuard extends Enemy {
  constructor(scene, x, y, opts = {}) {
    const frame = has(scene, 'guard_idle') ? 'guard_idle' : 'detective_idle';
    super(scene, x, y, 'guard', frame, { speed: 0, placeholder: frame !== 'guard_idle', label: 'border guard', ...opts });
    if (this.placeholder) this.setTint(0x8fd68f);
    this.body.setImmovable(true);
    this.body.allowGravity = false;
    this.resolved = false;
    this.demanded = false;
  }

  get harmless() { return true; }

  think() {
    this.body.setVelocityX(0);
    this.dir = Math.sign(this.player.x - this.x) || this.dir;
    if (this.resolved) return;
    if (this.distanceToPlayer() < 180 && !this.demanded) {
      this.demanded = true;
      if (GameState.cleanRun) {
        this.say('bubble_guard_free', 2000, '#7ddf7d');
        this.open();
      } else {
        this.say('bubble_guard_demand', 2600, '#f2c14e');
        this.scene.ui.flash(`${guardCost(GameState.heat)} $ — J`, '#f2c14e', 2200);
      }
    }
    this.playIf(this.demanded && !this.resolved ? 'guard_block' : 'guard_idle');
  }

  open() {
    this.resolved = true;
    this.playIf('guard_bribed');
    this.scene.tweens.add({ targets: this, x: this.x + 72, duration: 500 });
    this.scene.time.delayedCall(520, () => { this.body.checkCollision.none = true; });
  }

  /** The gate takes the full bribe in one payment (cost = 5 + ceil(heat/4)). */
  onCashHit() {
    if (this.resolved) return 'bribed';
    const cost = guardCost(GameState.heat) - 1; // the thrown bill already cost 1
    if (GameState.spendWallet(cost)) {
      GameState.guardPaid = true;
      this.say('bubble_guard_bribed', 1500, '#7ddf7d');
      this.open();
      return 'bribed';
    }
    this.say('bubble_guard_demand', 1500, '#ff6b6b');
    return 'refused';
  }

  onPlayerContact(player) {
    if (this.resolved || GameState.cleanRun) return;
    // pushing through unpaid = arrest
    this.resolved = true;
    this.say('bubble_guard_arrest', 1500, '#ff6b6b');
    this.scene.arrest();
  }
}
