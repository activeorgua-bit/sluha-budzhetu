import { Enemy } from './Enemy.js';
import { BALANCE } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { audio } from '../../core/Audio.js';

/**
 * NABU detective: relentless. Chases within range, throws warrants, jumps small walls.
 * Speed and warrant rate scale with heat. Bribe 14%. Immune to black PR.
 */
export class Detective extends Enemy {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y, 'detective', 'detective_idle', { speed: BALANCE.enemies.detective.speedBase, ...opts });
    this.nextWarrantAt = 0;
    this.emergeUntil = opts.emerge ? scene.time.now + BALANCE.enemies.detective.emergeSec * 1000 : 0;
    if (opts.emerge) {
      this.body.setVelocityY(-570);
      this.playIf('detective_emerge');
      this.say('bubble_detective_emerge', 1600, '#ff6b6b');
      audio.playNABUSiren();
    }
  }

  get speed() {
    const d = BALANCE.enemies.detective;
    const enraged = this.scene.time.now < this.enragedUntil;
    return (d.speedBase + d.speedPerHeat * GameState.heat) * (enraged ? BALANCE.bribe.enragedSpeedMult : 1);
  }

  think(now) {
    const d = BALANCE.enemies.detective;
    if (this.bribed) {
      this.body.setVelocityX(0);
      this.playIf('detective_bribed');
      return;
    }
    if (now < this.emergeUntil) { this.body.setVelocityX(0); return; }
    const dx = this.player.x - this.x;
    const dist = this.distanceToPlayer();
    if (dist > d.chaseRange) {
      this.patrol();
      this.playIf(Math.abs(this.body.velocity.x) > 5 ? 'detective_walk' : 'detective_idle');
      return;
    }
    if (this.stateName !== 'chase') { this.stateName = 'chase'; this.say('bubble_detective_spot', 900, '#ff6b6b'); }
    this.dir = Math.sign(dx) || this.dir;
    if (Math.abs(dx) > 36) this.body.setVelocityX(this.dir * this.speed);
    else this.body.setVelocityX(0);
    if (this.onGround && (this.body.blocked.left || this.body.blocked.right)) this.body.setVelocityY(-650);
    if (this.onGround && this.ledgeAhead() && Math.abs(dx) > 96) this.body.setVelocityY(-600);
    this.playIf(Math.abs(this.body.velocity.x) > 5 ? 'detective_walk' : 'detective_idle');

    if (Math.abs(dx) > d.warrantMin && Math.abs(dx) < d.warrantMax && now >= this.nextWarrantAt) {
      const every = Math.max(1.2, d.warrantBaseSec - d.warrantPerHeat * GameState.heat);
      this.nextWarrantAt = now + every * 1000;
      this.scene.projectiles.throwWarrant(this.x + this.dir * 24, this.y - 60, this.dir);
      this.playIf('detective_throw');
    }
  }
}
