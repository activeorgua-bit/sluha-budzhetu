import { Enemy } from './Enemy.js';
import { BALANCE } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';

/**
 * Kyiv metro cast. Passengers read the politician's record at a glance: a corrupt one is shoved,
 * hit with bags and canes; an honest one is mostly ignored — now and then somebody asks for an
 * autograph, or for money. The duty officer, the escalator attendant and the metro policeman
 * complete the station.
 */

/** Everyone in the metro knows about a corrupt MP: hostile from this heat on. */
export function metroHostile(scene) {
  if (scene && scene.metroOutrage) return true;          // robbed the busker or the flower seller
  return !GameState.cleanRun && GameState.heat >= BALANCE.enemies.passenger.hostileHeat;
}

const SKINS = ['ymale', 'yfemale', 'mmale', 'mfemale', 'omale', 'ofemale'];
const OLD = new Set(['omale', 'ofemale']);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Passenger extends Enemy {
  constructor(scene, x, y, opts = {}) {
    // the skin follows the map column, so the same station always has the same crowd
    // the type and the coat colour follow the map column: the same station always has the same crowd
    const col = Math.floor(x / 48);
    const base = opts.skin || SKINS[Math.abs(col * 7 + 3) % SKINS.length];
    // every repeat of a type takes the next coat colour, so no two look 100 % the same
    scene.paxSeen = scene.paxSeen || {};
    const n = (scene.paxSeen[base] = (scene.paxSeen[base] || 0) + 1) - 1;
    const variant = ['', '2', '3'][n % 3];
    const skin = scene.textures.get('chars').has(`${base}${variant}_idle`) ? `${base}${variant}` : base;
    const c = BALANCE.enemies.passenger;
    super(scene, x, y, 'passenger', `${skin}_idle`, { ...opts, skin, speed: OLD.has(base) ? c.speedOld : c.speed });
    this.nextShoveAt = 0;
    this.met = false;          // the honest encounter (ignore / autograph / money) happens once
    this.pauseUntil = 0;
  }

  get hostile() { return !this.bribed && metroHostile(this.scene); }
  get harmless() { return super.harmless || !this.hostile; }

  think(now) {
    const c = BALANCE.enemies.passenger;
    const dx = this.player.x - this.x;
    const near = Math.abs(dx) < 120 && Math.abs(this.player.y - this.y) < 90;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf(this.anim('idle')); return; }
    if (this.hostile) {
      if (Math.abs(dx) < c.aggroRange && Math.abs(this.player.y - this.y) < 110) {
        this.dir = Math.sign(dx) || this.dir;
        if (!this.shouted) { this.shouted = true; this.say(pick(['bubble_pax_angry1', 'bubble_pax_angry2', 'bubble_pax_angry3', 'bubble_pax_angry4']), 1500, '#ff6b6b'); }
        if (Math.abs(dx) < 70) {
          this.body.setVelocityX(0);
          this.playIf(this.anim('angry'));
          if (now >= this.nextShoveAt) { this.nextShoveAt = now + c.shoveEverySec * 1000; this.player.hurt(this.x, 'passenger', now); }
        } else if (!(this.onGround && this.ledgeAhead())) {
          this.body.setVelocityX(this.dir * this.speed * 1.25);
          this.playIf(this.anim('walk'));
        }
        return;
      }
    } else if (near && !this.met) {
      // an honest MP in the metro: mostly nobody cares
      this.met = true;
      const r = Math.random();
      if (r < c.autographChance) {
        this.say('bubble_pax_autograph', 2000, '#ffe66d'); this.pauseUntil = now + 2000;
        GameState.addScore(c.autographScore);
      } else if (r < c.autographChance + c.moneyChance) {
        this.say(pick(['bubble_pax_money1', 'bubble_pax_money2']), 2000, '#e6e6e6'); this.pauseUntil = now + 2000;
      }
    }
    if (now < this.pauseUntil) {
      this.body.setVelocityX(0);
      this.dir = Math.sign(dx) || this.dir;
      this.playIf(this.anim('idle'));
      return;
    }
    this.patrol();
    this.playIf(this.anim(Math.abs(this.body.velocity.x) > 5 ? 'walk' : 'idle'));
  }

  onPlayerContact() { /* shoves only */ }
}

/** Station staff: the duty officer (red cap, signal disc) and the escalator attendant. Harmless. */
export class MetroWorker extends Enemy {
  constructor(scene, x, y, opts = {}) {
    const skin = opts.skin || 'mworker';
    super(scene, x, y, 'worker', `${skin}_idle`, { ...opts, skin, speed: 60 });
    this.nextLineAt = 0;
  }

  get harmless() { return super.harmless || !this.scene.metroOutrage; }
  onPlayerContact() {}

  think(now) {
    const dx = this.player.x - this.x;
    if (this.scene.metroOutrage) {
      // after a theft the staff chase the thief too
      if (Math.abs(dx) < 420 && Math.abs(this.player.y - this.y) < 110) {
        this.dir = Math.sign(dx) || this.dir;
        if (!this.shouted) { this.shouted = true; this.say('bubble_staff_thief', 1500, '#ff6b6b'); }
        if (Math.abs(dx) < 70) {
          this.body.setVelocityX(0);
          this.playIf(this.anim(this.skin === 'mworker' ? 'signal' : 'talk'));
          if (now >= (this.nextShoveAt || 0)) { this.nextShoveAt = now + 1500; this.player.hurt(this.x, 'passenger', now); }
        } else if (!(this.onGround && this.ledgeAhead())) {
          this.body.setVelocityX(this.dir * 110);
          this.playIf(this.anim('walk'));
        }
        return;
      }
    }
    if (Math.abs(dx) < 200 && Math.abs(this.player.y - this.y) < 120) {
      this.body.setVelocityX(0);
      this.dir = Math.sign(dx) || this.dir;
      this.playIf(this.anim(this.skin === 'mworker' ? 'signal' : 'talk'));
      if (now >= this.nextLineAt) {
        this.nextLineAt = now + 6000;
        const hostile = metroHostile(this.scene);
        const key = this.skin === 'mworker'
          ? (hostile ? 'bubble_mworker_corrupt' : 'bubble_mworker_edge')
          : (hostile ? 'bubble_wworker_corrupt' : 'bubble_wworker_rail');
        this.say(key, 1800, hostile ? '#ffb36b' : '#e6e6e6');
      }
      return;
    }
    this.patrol();
    this.playIf(this.anim(Math.abs(this.body.velocity.x) > 5 ? 'walk' : 'idle'));
  }
}

/** The one metro policeman: salutes an honest MP, chases and grabs a corrupt one. Bribable. */
export class MetroCop extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'mcop', 'mcop_idle', { ...opts, speed: BALANCE.enemies.mcop.speed });
    this.nextGrabAt = 0;
    this.greeted = false;
  }

  get hostile() { return !this.bribed && metroHostile(this.scene); }
  get harmless() { return super.harmless || !this.hostile; }
  onPlayerContact() {}

  think(now) {
    const c = BALANCE.enemies.mcop;
    if (this.bribed) { this.body.setVelocityX(0); this.playIf('mcop_bribed'); return; }
    const dx = this.player.x - this.x;
    const close = Math.abs(dx) < c.chaseRange && Math.abs(this.player.y - this.y) < 110;
    if (!this.hostile) {
      if (Math.abs(dx) < 180 && !this.greeted) { this.greeted = true; this.say('bubble_mcop_salute', 1600, '#7ddf7d'); this.saluteUntil = now + 1500; }
      if (now < (this.saluteUntil || 0)) { this.body.setVelocityX(0); this.dir = Math.sign(dx) || this.dir; this.playIf('mcop_salute'); return; }
      this.patrol();
      this.playIf(Math.abs(this.body.velocity.x) > 5 ? 'mcop_walk' : 'mcop_idle');
      return;
    }
    if (close) {
      this.dir = Math.sign(dx) || this.dir;
      if (!this.whistled) { this.whistled = true; this.say('bubble_mcop_stop', 1400, '#ff6b6b'); this.playIf('mcop_whistle'); }
      if (Math.abs(dx) < 70) {
        this.body.setVelocityX(0);
        this.playIf('mcop_grab');
        if (now >= this.nextGrabAt) { this.nextGrabAt = now + c.grabEverySec * 1000; this.player.hurt(this.x, 'mcop', now); }
      } else if (!(this.onGround && this.ledgeAhead())) {
        this.body.setVelocityX(this.dir * this.speed * 1.4);
        this.playIf('mcop_walk');
      }
      return;
    }
    this.patrol();
    this.playIf(Math.abs(this.body.velocity.x) > 5 ? 'mcop_walk' : 'mcop_idle');
  }
}

/**
 * A metro vendor with a till you can rob: the busker (accordion case) and the flower seller.
 * Standing next to them shows a small hint; E opens a clear choice: steal the takings / walk on /
 * (with money) give a coin. Until you steal, the choice can be opened again.
 * Stealing turns the whole station against you (see scene.metroOutrage).
 */
export class Vendor extends Enemy {
  constructor(scene, x, y, opts = {}) {
    const skin = opts.skin || 'musician';
    super(scene, x, y, 'vendor', `${skin}_idle`, { ...opts, skin, speed: 0 });
    this.body.setAllowGravity(true);
    this.hinted = false;
    this.robbed = false;
    this.mood = 'idle';
    this.moodUntil = 0;
  }

  get harmless() { return true; }
  onPlayerContact() {}

  setMood(m, ms) { this.mood = m; this.moodUntil = ms ? this.scene.time.now + ms : 0; }

  think(now) {
    this.body.setVelocityX(0);
    const dx = this.player.x - this.x;
    if (Math.abs(dx) < 260) this.dir = Math.sign(dx) || this.dir;
    if (this.moodUntil && now > this.moodUntil) { this.mood = this.robbed ? 'cry' : 'idle'; this.moodUntil = 0; }
    this.playIf(this.anim(this.mood));
  }

  /** Close enough to talk to (and not robbed yet). */
  near(P) {
    return !this.robbed && Math.abs(P.x - this.x) < 90 && Math.abs(P.y - this.y) < 80 && !P.dead;
  }
}
