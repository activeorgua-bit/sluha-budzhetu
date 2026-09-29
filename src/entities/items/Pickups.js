import Phaser from 'phaser';
import { DEPTH } from '../../config/constants.js';
import { GameState } from '../../core/GameState.js';
import { BALANCE } from '../../config/balance.js';
import { audio } from '../../core/Audio.js';

/**
 * Coin / trap coin / money bag. Trap coins look exactly like coins; picking one up summons a
 * detective from the nearest sting point. Bags dropped by party guests fall to the ground.
 */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, kind, opts = {}) {
    const has = (f) => scene.textures.get('props').has(f);
    const frame = kind === 'money_bag' ? 'money_bag'
      : kind === 'chestnut' ? (has('chestnut_open') ? 'chestnut_open' : 'coin')
        : kind === 'book' ? (has('kapital_book') ? 'kapital_book' : 'coin')
          : kind === 'whiskey' ? (has('bottle_whiskey') ? 'bottle_whiskey' : 'coin')
            : kind === 'vodka' ? (has('bottle_vodka') ? 'bottle_vodka' : 'coin') : 'coin';
    // extra life: a first-aid kit (the politician's portrait if the prop is missing)
    const kit = kind === 'life' && has('first_aid');
    const portrait = kind === 'life' && !kit && scene.textures.get('ui').has('hud_portrait');
    super(scene, x, y, portrait ? 'ui' : 'props', kit ? 'first_aid' : portrait ? 'hud_portrait' : frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = kind;                // 'coin' | 'trap' | 'money_bag' | 'chestnut' | 'book' (free ammo)
    this.ammo = kind === 'chestnut' || kind === 'book';
    this.bottle = kind === 'whiskey' || kind === 'vodka';
    this.life = kind === 'life';
    if (this.life && opts.falling) this.once('destroy', () => this.glow && this.glow.destroy());
    if (this.life) {
      this.glow = scene.add.circle(x, y, 26, 0xffffff, 0.22).setDepth(DEPTH.pickups - 1);
      scene.tweens.add({ targets: this.glow, scale: 1.35, alpha: 0.08, duration: 800, yoyo: true, repeat: -1 });
    }
    this.setDepth(DEPTH.pickups);
    this.body.setSize(34, 34).setOffset((this.width - 34) / 2, (this.height - 34) / 2);
    this.collected = false;
    if (opts.falling) {
      this.body.allowGravity = true;
      this.body.setVelocity(Phaser.Math.Between(-90, 90), -330);
      this.body.setBounce(0.2);
    } else {
      this.body.allowGravity = false;
      this.body.setImmovable(true);
      this.baseY = y;
      this.bob = scene.tweens.add({ targets: this, y: y - 6, duration: 700 + (x % 5) * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if ((kind === 'coin' || kind === 'trap' || kind === 'question_block') && scene.anims.exists('coin_spin')) this.play('coin_spin');
    if (this.ammo && !opts.falling) { this.bob.remove(); this.bob = null; this.y = y + 8; } // lies on the ground
  }

  collect(player) {
    if (this.collected) return;
    const scene = this.scene;
    if (this.life) {
      this.collected = true;
      GameState.addLife();                 // the level announces it (flash + sound)
      scene.ui.popValue(this.x, this.y - 20, scene.tt('life_pop'), '#ffe66d');
      if (scene.narrator) scene.narrator.say('life_letter', { priority: 2 });
      if (this.bob) this.bob.remove();
      if (this.glow) this.glow.destroy();
      scene.tweens.add({ targets: this, y: this.y - 40, alpha: 0, scale: 1.6, duration: 400, onComplete: () => this.destroy() });
      this.body.enable = false;
      return;
    }
    if (this.bottle) {
      this.collected = true;
      scene.drinkBottle(this.kind);
      if (this.bob) this.bob.remove();
      scene.tweens.add({ targets: this, y: this.y - 30, alpha: 0, duration: 220, onComplete: () => this.destroy() });
      this.body.enable = false;
      return;
    }
    if (this.ammo) {
      // chestnuts / books: free, honest ammo (kids race you for them)
      const got = GameState.addAmmo(this.kind, this.kind === 'chestnut' ? 1 : 1);
      if (!got) return;               // pockets full: leave it on the ground
      this.collected = true;
      audio.playCoin();
      scene.ui.popValue(this.x, this.y - 10, `+1 ${scene.tt(this.kind === 'book' ? 'ammo_book' : 'ammo_nut')}`, '#e8b06a');
      if (this.bob) this.bob.remove();
      scene.tweens.add({ targets: this, y: this.y - 30, alpha: 0, duration: 220, onComplete: () => this.destroy() });
      this.body.enable = false;
      return;
    }
    this.collected = true;
    const kind = this.kind === 'trap' ? 'coin' : this.kind;
    scene.lastPickupX = this.x;
    const value = GameState.addPickup(kind);
    audio.playCoin();
    scene.ui.popValue(this.x, this.y - 10, `+${value}$`);
    if (this.kind === 'trap') {
      GameState.trapTriggered();
      scene.ui.flash(scene.tt('trap'), '#ff6b6b', 1600);
      scene.director.sting(this.x, this.y);
    }
    if (this.bob) this.bob.remove();
    scene.tweens.add({ targets: this, y: this.y - 36, alpha: 0, duration: 260, onComplete: () => this.destroy() });
    this.body.enable = false;
  }
}

/** Question block: solid; hit from below pops a coin that lands back on top of the block. */
export class QuestionBlock extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'props', 'question_block');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.props);
    this.used = false;
  }

  hit() {
    if (this.used) return;
    this.used = true;
    const scene = this.scene;
    scene.tweens.add({ targets: this, y: this.y - 12, duration: 80, yoyo: true });
    const used = scene.textures.get('props').has('question_used') ? 'question_used' : 'metal_block';
    if (scene.textures.get('props').has(used)) this.setFrame(used);
    // now and then the box holds a first-aid kit instead of a "thank-you" (at most one per level)
    if (!scene.kitFromBlock && GameState.rng.next() < BALANCE.lives.kitInBlockChance) {
      scene.kitFromBlock = true;
      const kit = scene.spawnPickup('life', this.x, this.y - 60, { falling: true });
      kit.body.setVelocity(0, -450);
      return;
    }
    // pop a coin worth 3 (question_block value): it hops off the row of blocks, away from the player, and
    // lands on the ground (a high row of blocks would otherwise keep it out of reach); take it or leave it
    const coin = scene.spawnPickup('question_block', this.x, this.y - 60, { falling: true });
    const away = Math.sign(this.x - scene.player.x) || 1;
    coin.body.setVelocity(away * 210, -430).setDragX(110);
    coin.setFrame('coin');
    coin.setTint(0xffe066);
    audio.playCoin();
  }
}

/**
 * A hidden stash: an ordinary cardboard box somewhere off the main route. E next to it searches it;
 * a first-aid kit pops out (+1 life, full reputation). A faint glint now and then gives it away.
 */
export class Stash {
  constructor(scene, x, feetY) {
    this.scene = scene;
    this.x = x;
    this.y = feetY;
    this.opened = false;
    const has = (f) => scene.textures.get('props').has(f);
    this.img = scene.add.image(x, feetY, 'props', has('stash_box') ? 'stash_box' : 'crate').setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.glint = scene.time.addEvent({ delay: 3200, loop: true, callback: () => {
      if (this.opened || !scene.textures.get('props').has('fx_stars')) return;
      const s = scene.add.image(x + Phaser.Math.Between(-12, 12), feetY - this.img.height + 6, 'props', 'fx_stars').setScale(0.35).setAlpha(0.9).setDepth(DEPTH.fx);
      scene.tweens.add({ targets: s, alpha: 0, scale: 0.15, duration: 700, onComplete: () => s.destroy() });
    } });
  }

  near(player) { return !this.opened && Math.abs(player.x - this.x) < 70 && Math.abs(player.body.bottom - this.y) < 60; }

  search() {
    if (this.opened) return false;
    this.opened = true;
    const s = this.scene;
    if (s.textures.get('props').has('stash_box_open')) this.img.setFrame('stash_box_open');
    this.glint.remove();
    const kit = s.spawnPickup('life', this.x, this.y - 70, { falling: true });
    kit.body.setVelocity(Phaser.Math.Between(-40, 40), -420);
    s.ui.flash(s.tt('stash_found'), '#ffe66d', 1200);
    return true;
  }
}
