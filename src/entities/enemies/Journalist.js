import { Enemy } from './Enemy.js';
import { BALANCE } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { audio } from '../../core/Audio.js';

/**
 * Anti-corruption journalist: patrols, and when the politician is in line of sight
 * raises the camera, flashes and stuns the player. Bribe 22%. Black PR makes them flee.
 */
export class Journalist extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'journalist', `${opts.skin || 'journalist'}_idle`, { speed: BALANCE.enemies.journalist.speed, ...opts });
    this.flashReadyAt = 0;
    this.windupUntil = 0;
    this.playIf(this.anim('walk'));
  }

  get los() {
    const j = BALANCE.enemies.journalist;
    return GameState.tier.id >= 1 ? j.losTier1 : j.los;
  }

  think(now) {
    const j = BALANCE.enemies.journalist;
    if (this.bribed) {
      this.walkAwayFrom(this.player.x);
      this.playIf(this.anim('bribed'));
      if (this.body.blocked.left || this.body.blocked.right) this.body.setVelocityX(0);
      return;
    }
    if (now < this.fleeUntil) {
      this.dir = this.x < this.player.x ? -1 : 1;
      this.body.setVelocityX(this.dir * this.speed * 2.2);
      this.playIf(this.scene.anims.exists(this.anim('flee')) ? this.anim('flee') : this.anim('walk'));
      return;
    }
    const dx = this.player.x - this.x;
    const dy = Math.abs(this.player.y - this.y);
    const inSight = Math.abs(dx) < this.los && dy < j.losHeight;
    if (this.stateName === 'alert') {
      this.body.setVelocityX(0);
      this.dir = Math.sign(dx) || this.dir;
      if (now >= this.windupUntil) {
        this.stateName = 'patrol';
        this.flashReadyAt = now + j.flashCooldownSec * 1000;
        if (inSight && !this.player.dead) {
          this.scene.cameras.main.flash(120, 255, 255, 255);
          audio.playCameraFlash();
          this.player.stun(BALANCE.player.stunSec, now);
          this.player.loseReputation('flash', undefined, now);     // a bad photo
          if (this.scene.narrator) this.scene.narrator.say('flash');
          this.playIf(this.anim('flash'));
        }
      }
      return;
    }
    if (inSight && now >= this.flashReadyAt && (this.facingPlayer() || Math.abs(dx) < 135)) {
      this.stateName = 'alert';
      this.windupUntil = now + j.flashWindupSec * 1000;
      this.dir = Math.sign(dx) || this.dir;
      this.playIf(this.anim('camera'));
      this.say('bubble_journalist_spot', 900);
      return;
    }
    this.patrol();
    this.playIf(Math.abs(this.body.velocity.x) > 5 ? this.anim('walk') : this.anim('idle'));
  }

  onBlackPR() {
    if (this.bribed) return false;
    this.fleeUntil = this.scene.time.now + BALANCE.bribe.blackPRFleeSec * 1000;
    this.stateName = 'patrol';
    this.say('bubble_journalist_flee', 1200, '#f2c14e');
    return true;
  }
}
