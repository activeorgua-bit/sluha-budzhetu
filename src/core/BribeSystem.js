import { BALANCE } from '../config/balance.js';
import { GameState } from './GameState.js';
import { audio } from './Audio.js';

/**
 * J = throw cash. Throwing costs 1 bribe; hitting an enemy of type T completes the bribe
 * only if the wallet can cover cost[T]-1 more, then rolls odds × 0.75^(failed attempts on
 * that enemy). Failure enrages the enemy and raises heat. K = black PR (free, journalists).
 */
export class BribeSystem {
  constructor(scene) {
    this.scene = scene;
  }

  throwCash(player) {
    if (player.dead) return;
    if (!GameState.spendWallet(1)) {
      this.scene.ui.flash(this.scene.tt('no_money'), '#ff6b6b', 700);
      audio.playDenied();
      return;
    }
    audio.playThrowCash();
    player.throwLock = this.scene.time.now + 250;
    const cash = this.scene.projectiles.throwCash(player.x + player.facing * 30, player.y - 60, player.facing);
    if (this.scene.wobble) this.scene.wobble(cash);
  }

  onCashHitEnemy(cash, enemy) {
    if (!cash.active) return;
    if (enemy.bribed || enemy.leaving || enemy.bribeProof) return;   // the bill flies past (rats take no bribes)
    cash.destroy();
    const cfg = BALANCE.bribe[enemy.bribeKey];
    const extra = cfg && cfg.cost !== undefined ? cfg.cost - 1 : 0;
    if (extra > 0 && !GameState.spendWallet(extra)) {
      // not enough to complete the bribe: counts as a refused attempt
      this.refused(enemy, 'no_money');
      return;
    }
    const result = enemy.onCashHit(GameState.rng);
    if (result === 'bribed') {
      GameState.addConscience('bribe_ok');
      if (this.scene.narrator) this.scene.narrator.say(enemy.type === 'cop' ? 'bribe_cop' : 'bribe_ok');
      audio.playBribe();
      this.scene.projectiles.burst(enemy.x, enemy.y - 30, 0x7ddf7d, 10);
      this.scene.ui.flash(this.scene.tt('bribe_ok'), '#7ddf7d', 900);
    } else {
      this.refused(enemy, 'bribe_fail');
    }
  }

  refused(enemy, msgKey) {
    GameState.bribeFailed();
    if (this.scene.narrator) this.scene.narrator.say('bribe_fail');
    audio.playDenied();
    this.scene.projectiles.burst(enemy.x, enemy.y - 30, 0xff6b6b, 6);
    this.scene.ui.flash(this.scene.tt(msgKey), '#ff6b6b', 900);
    if (!enemy.enragedUntil || enemy.enragedUntil < this.scene.time.now) enemy.enrage();
  }

}
