import Phaser from 'phaser';
import { GAME_W, GAME_H, TILE, DEPTH, KEYS, S } from '../config/constants.js';
import { BALANCE } from '../config/balance.js';
import { LEVELS, STORY, levelIndexById } from '../config/levels.js';
import { GameState } from '../core/GameState.js';
import { Save } from '../core/Save.js';
import { audio } from '../core/Audio.js';
import { t, textStyle } from '../core/i18n.js';
import { buildLevel } from '../levels/LevelBuilder.js';
import { levelText } from './Preload.js';
import { Player } from '../entities/Player.js';
import { Journalist } from '../entities/enemies/Journalist.js';
import { Detective } from '../entities/enemies/Detective.js';
import { Cop, Voter, PartyGuest, BorderGuard } from '../entities/enemies/Others.js';
import { OldLady, Kid, Rat, OppositionMP, SeatedMP, Assistant } from '../entities/enemies/Chestnut.js';
import { AnimatorBoss, RatBoss, SpeakerBoss } from '../entities/enemies/Bosses.js';
import { ChestnutTree, SecretHatch } from '../entities/world/Park.js';
import { Narrator } from '../core/Narrator.js';
import { Bandit, MafiaBoss, Gopnik, Citizen, Dog, DogWalker, GangBoss, districtHostile, debrisHostile } from '../entities/enemies/World3.js';
import { FallingDebris } from '../entities/world/Debris.js';
import { Sky } from '../entities/world/Sky.js';
import { Pickup, QuestionBlock } from '../entities/items/Pickups.js';
import { CrumblingBridge, MovingPlatform, HangingHook, waveDeckTexture, dressWaveBridge } from '../entities/world/Platforms.js';
import { Projectiles } from '../entities/projectiles/Projectiles.js';
import { BribeSystem } from '../core/BribeSystem.js';
import { SpawnDirector } from '../core/SpawnDirector.js';

export class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.levelIndex = data.levelIndex ?? GameState.levelIndex ?? 0;
    this.fromCheckpoint = !!data.fromCheckpoint;
  }

  tt(key, params) { return t(key, params); }

  create() {
    const def = LEVELS[this.levelIndex];
    GameState.levelIndex = this.levelIndex;
    // snapshot for save slots: saves restore the start of the level (pickups cannot be doubled)
    if (!this.fromCheckpoint || !GameState.levelStartSnapshot || GameState.levelStartSnapshot.levelIndex !== this.levelIndex) {
      GameState.levelStartSnapshot = GameState.serialize();
      Save.writeSlot('auto', { levelIndex: this.levelIndex, label: LEVELS[this.levelIndex].label, state: GameState.levelStartSnapshot });
    }
    this.def = def;
    this.finished = false;
    this.levelStartMs = this.time.now;

    const text = levelText(def.file);
    if (!text) {
      this.add.text(20, 20, `Level file missing: ${def.file}`, textStyle(10, '#ff6b6b'));
      return;
    }
    const built = buildLevel(this, text);
    this.level = built.level;
    this.meta = built.meta;
    this.map = built.map;
    this.layer = built.layer;
    this.widthPx = built.widthPx;
    this.heightPx = built.heightPx;
    this.physics.world.setBounds(0, -TILE * 4, this.widthPx, this.heightPx + TILE * 6);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this.buildParallax();
    this.buildBackfill(built.texKey);
    this.projectiles = new Projectiles(this);
    this.bribes = new BribeSystem(this);

    // Arcade groups apply their defaults to every child they receive (allowGravity: true unless
    // told otherwise), so floating objects must get the no-gravity default from the group itself.
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.pickups = this.physics.add.group({ allowGravity: false });
    this.blocks = this.physics.add.staticGroup();
    this.bridges = this.physics.add.staticGroup();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.hooks = this.physics.add.group({ allowGravity: false, immovable: true });
    this.hookZones = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.triggers = this.physics.add.staticGroup();
    this.decorSolids = this.physics.add.staticGroup();
    this.trees = [];          // shakeable chestnut trees
    this.secrets = [];        // secret hatches (bonus level entrances)
    this.boss = null;
    this.bossAwake = false;
    this.nutReadyAt = 0;
    this.shops = [];          // decor with "shop": sells whiskey
    this.debris = [];         // falling balconies / panels (block district, corrupt only)
    this.mafiaHits = 0;
    this.nextConscienceAt = 0;
    GameState.drunk = null;   // a new level starts sober (the hangover is implied)

    for (const h of built.hazards) {
      const z = this.add.zone(h.x, h.y, h.w, h.h).setOrigin(0);
      this.hazards.add(z);
      z.body.updateFromGameObject();
      z.kind = h.kind;
    }
    for (const d of this.level.decor) this.placeDecor(d);

    let spawn = null;
    for (const o of this.level.objects) spawn = this.spawnObject(o) || spawn;
    const cp = GameState.checkpoint;
    if (this.fromCheckpoint && cp && cp.levelId === def.id) spawn = { x: cp.x, y: cp.y };
    if (!spawn) spawn = { x: 2 * TILE, y: 14 * TILE };
    this.player = new Player(this, spawn.x, spawn.y);
    this.director = new SpawnDirector(this, this.level);
    this.narrator = new Narrator(this);

    this.setupColliders();
    this.setupCamera();
    this.setupKeys();

    // Always restart the HUD: a queued stop from a previous level would otherwise land after an
    // "is it active?" check and leave the level without a HUD.
    this.ui = this.scene.get('UI');
    if (this.scene.isActive('UI')) this.scene.stop('UI');
    this.scene.launch('UI', { label: def.label });
    this.scene.bringToTop('UI');
    this.timeLeft = this.meta.timeLimit || 200;
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });
    this.time.delayedCall(50, () => {
      this.ui = this.scene.get('UI');
      if (this.ui && this.ui.setTime) this.ui.setTime(this.timeLeft);
      if (this.ui && this.ui.flash && !this.fromCheckpoint) this.ui.flash(`${t('level_start')} ${def.label}\n${t(def.nameKey)}`, '#f2c14e', 1600);
      if (!this.fromCheckpoint) this.time.delayedCall(900, () => this.narrator.say(`start_${def.id}`, { priority: 2 }));
    });

    this.onPickupEv = ({ kind }) => {
      // a bag next to a story spot (meta.narration entry with "on": "bag") gets its own line
      const spot = (this.meta.narration || []).find((z) => z.on === 'bag' && Math.abs((this.lastPickupX || 0) / TILE - z.col) < 4);
      if (kind === 'money_bag' && spot && this.narrator.say(spot.key, { priority: 2 })) return;
      if (kind === 'money_bag') this.narrator.say(this.narrator.played.has('first_bag') ? 'bag' : 'first_bag');
      else if (kind === 'coin') this.narrator.say(this.narrator.played.has('first_coin') ? 'coin' : 'first_coin', { priority: 0 });
      else if (kind === 'question_block') this.narrator.say('question_block', { priority: 0 });
    };
    this.onHeatEv = ({ tier, prevTier }) => { if (tier > prevTier) this.narrator.say(`tier_${tier}`, { priority: 1 }); };
    GameState.events.on('pickup', this.onPickupEv);
    GameState.events.on('heat', this.onHeatEv);
    this.events.once('shutdown', () => {
      GameState.events.off('pickup', this.onPickupEv);
      GameState.events.off('heat', this.onHeatEv);
      this.director.destroy();
      if (this.timerEvent) this.timerEvent.remove();
    });
  }

  // ------------------------------------------------------------------ building
  /**
   * Parallax layers. Sky (`y`, no anchor) is screen-fixed. Strips are world-anchored vertically:
   * `bottomRow` puts the strip's lower edge on that map row (minus `lift` px); legacy `bottom`
   * (screen px on the old 32 px grid, ground at 448) is converted. `zone: [fromCol, toCol]` shows a
   * layer only while the camera centre is inside those columns (street -> park cross-fade).
   */
  buildParallax() {
    this.parallax = [];
    // meta.sky: a living sky (gradient + drifting clouds) instead of a painted sky image
    this.sky = this.meta.sky ? new Sky(this, this.meta.sky) : null;
    for (const l of this.meta.parallax || []) {
      if (!this.textures.exists(l.key)) continue;
      if (this.sky && l.key === `${this.meta.id}_sky`) continue;
      const src = this.textures.get(l.key).getSourceImage();
      let ts;
      if (l.bottomRow !== undefined || l.bottom !== undefined) {
        const bottom = l.bottomRow !== undefined
          ? l.bottomRow * TILE - (l.lift || 0)
          : 14 * TILE - (448 - l.bottom) * S;
        ts = this.add.tileSprite(0, bottom - src.height, GAME_W, src.height, l.key).setOrigin(0).setScrollFactor(0, 1);
      } else {
        ts = this.add.tileSprite(0, l.y || 0, GAME_W, src.height, l.key).setOrigin(0).setScrollFactor(0);
      }
      ts.setDepth(l.scroll < 0.1 ? DEPTH.parallaxSky : l.scroll < 0.4 ? DEPTH.parallaxFar : DEPTH.parallaxMid);
      ts.scrollRate = l.scroll;
      ts.zone = l.zone || null;
      ts.lockLast = l.lockLast || 0;
      this.parallax.push(ts);
    }
    this.cameras.main.setBackgroundColor(this.meta.bgColor || '#6fb6ec');
  }

  updateParallax() {
    const cam = this.cameras.main;
    const col = (cam.scrollX + GAME_W / 2) / TILE;
    for (const ts of this.parallax) {
      if (ts.lockLast) {
        // slow parallax until the last `lockLast` px of camera travel, then glued to the world (rate 1)
        const L = Math.max(0, this.widthPx - GAME_W - ts.lockLast);
        ts.tilePositionX = cam.scrollX < L ? cam.scrollX * ts.scrollRate : L * ts.scrollRate + (cam.scrollX - L);
      } else {
        ts.tilePositionX = cam.scrollX * ts.scrollRate;
      }
      if (!ts.zone) continue;
      // zone: [from, to] or several ranges [[from, to], ...]
      const ranges = Array.isArray(ts.zone[0]) ? ts.zone : [ts.zone];
      const inside = ranges.some(([a, b]) => col >= a && col < b);
      const target = inside ? 1 : 0;
      if (ts.targetAlpha !== target) {
        ts.targetAlpha = target;
        this.tweens.killTweensOf(ts);
        if (ts.zoneInit) this.tweens.add({ targets: ts, alpha: target, duration: 700 });
        else ts.setAlpha(target);
      }
      ts.zoneInit = true;
    }
  }

  /**
   * Decor props. Anchor = bottom of the cell (col,row); with `w` (tiles) the column is the left edge.
   * solid: 'full' -> solid block `w` x `top` tiles (pipes, bins, pedestal)
   * solid: 'top'  -> one-way platform `top` tiles above the anchor (balconies, roofs, benches)
   * front: true  -> drawn in front of characters (balcony railings)
   */
  /**
   * Shaded back wall below street level, so trenches and flooded pits show brick/soil instead of
   * the sky. meta.backfill: [{ tile, from, to, row, tint }] (columns, first underground row).
   * Levels with open water under bridges (1-2) simply leave it out.
   */
  buildBackfill(texKey) {
    const index = this.cache.json.get(`${texKey}_index`);
    if (!index || !this.textures.exists(texKey)) return;
    const tex = this.textures.get(texKey);
    for (const b of this.meta.backfill || []) {
      const id = index.tiles[b.tile];
      if (id === undefined) continue;
      const frame = `back_${b.tile}`;
      if (!tex.has(frame)) tex.add(frame, 0, (id % index.columns) * TILE, Math.floor(id / index.columns) * TILE, TILE, TILE);
      const x0 = b.from * TILE;
      const x1 = Math.min(this.widthPx, (b.to ?? 9999) * TILE);
      const y0 = b.row * TILE;
      this.add.tileSprite(x0, y0, x1 - x0, this.heightPx - y0, texKey, frame).setOrigin(0)
        .setDepth(DEPTH.parallaxMid + 2).setTint(Phaser.Display.Color.HexStringToColor(b.tint || '#5a5a6e').color);
    }
  }

  placeDecor(d) {
    if (!this.textures.get('props').has(d.frame)) return null;
    if (d.shop) {
      const cx0 = d.w ? (d.col + d.w / 2) * TILE : d.col * TILE + TILE / 2;
      this.shops.push({ x: cx0, y: (d.row + 1) * TILE, item: d.shop, hinted: false });
    }
    const bottom = (d.row + 1) * TILE;
    const cx = d.w ? (d.col + d.w / 2) * TILE : d.col * TILE + TILE / 2;
    const img = this.add.image(cx, bottom, 'props', d.frame).setOrigin(0.5, 1)
      .setDepth(d.front ? DEPTH.player + 1 : (d.solid ? DEPTH.props : DEPTH.decorBack));
    if (d.flip) img.setFlipX(true);
    if (d.solid) {
      const w = (d.w || Math.max(1, Math.round(img.width / TILE))) * TILE;
      this.addDecorSolid(d, cx - w / 2, bottom, w, (d.top ?? img.height / TILE) * TILE, d.solid);
    }
    // Shaped props (monument: wide low steps + narrow tall pedestal): parts in tiles from d.col.
    for (const p of d.solids || []) {
      this.addDecorSolid(d, (d.col + (p.dx || 0)) * TILE, bottom, (p.w || 1) * TILE, p.top * TILE, p.solid || 'full');
    }
    return img;
  }

  addDecorSolid(d, x, bottom, w, top, kind) {
    const h = kind === 'full' ? top : 14;
    const z = this.add.zone(x, bottom - top, w, h).setOrigin(0);
    this.decorSolids.add(z);
    z.body.updateFromGameObject();
    if (kind === 'top') z.body.checkCollision = { none: false, up: true, down: false, left: false, right: false };
    z.decor = d;
    return z;
  }

  spawnObject(o) {
    const cx = o.col * TILE + TILE / 2;
    const feetY = (o.row + 1) * TILE;
    switch (o.type) {
      case 'player': return { x: cx, y: feetY };
      case 'goal': {
        const z = this.add.zone(o.col * TILE, o.row * TILE - TILE, TILE, TILE * 2).setOrigin(0);
        this.triggers.add(z); z.body.updateFromGameObject(); z.kind = 'goal';
        this.add.text(cx, o.row * TILE - 20, t('goal_hint'), textStyle(7, '#f2c14e', { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5).setDepth(DEPTH.signs);
        if (!this.meta.goal && !this.meta.boss) this.add.image(cx, feetY, 'props', 'caution_sign').setOrigin(0.5, 1).setDepth(DEPTH.signs);
        return null;
      }
      case 'checkpoint': {
        const z = this.add.zone(o.col * TILE, o.row * TILE - TILE * 2, TILE, TILE * 3).setOrigin(0);
        this.triggers.add(z); z.body.updateFromGameObject(); z.kind = 'checkpoint'; z.used = false;
        z.flag = this.add.image(cx, feetY, 'props', this.textures.get('props').has('checkpoint_flag') ? 'checkpoint_flag' : 'traffic_cone').setOrigin(0.5, 1).setDepth(DEPTH.signs);
        return null;
      }
      case 'sting': {
        const frame = this.textures.get('props').has('manhole') ? 'manhole' : 'metal_block';
        this.add.image(cx, feetY, 'props', frame).setOrigin(0.5, 1).setDepth(DEPTH.decorBack).setScale(1, 0.35);
        return null;
      }
      case 'sign': {
        const s = (this.meta.signs || [])[o.index];
        if (!s) return null;
        if (s.sprite === 'plaque') {
          // plain plaque on two posts: the caption is the only text (board sprites carry baked English text)
          const w = 196; const h = 64; const top = feetY - 40 - h;
          const g = this.add.graphics().setDepth(DEPTH.signs);
          g.fillStyle(0x3a2a1a).fillRect(cx - w / 2 + 16, top + h, 8, 40).fillRect(cx + w / 2 - 24, top + h, 8, 40);
          g.fillStyle(0x0b0f14).fillRect(cx - w / 2, top, w, h);
          g.lineStyle(4, 0x8a8f9b).strokeRect(cx - w / 2 + 2, top + 2, w - 4, h - 4);
          this.add.text(cx, top + h / 2, t(s.caption), textStyle(7, '#ffffff', { align: 'center', wordWrap: { width: w - 20 }, lineSpacing: 4 }))
            .setOrigin(0.5).setDepth(DEPTH.signs);
          return null;
        }
        const frame = this.textures.get('props').has(s.sprite) ? s.sprite : 'sign_facts';
        const img = this.add.image(cx, feetY, 'props', frame).setOrigin(0.5, 1).setDepth(DEPTH.signs);
        if (s.caption) this.add.text(cx, feetY - img.height - 4, t(s.caption), textStyle(6, '#ffffff', { stroke: '#000', strokeThickness: 3, align: 'center', wordWrap: { width: 140 } })).setOrigin(0.5, 1).setDepth(DEPTH.signs);
        return null;
      }
      case 'coin': this.spawnPickup('coin', cx, o.row * TILE + TILE / 2); return null;
      case 'trap': this.spawnPickup('trap', cx, o.row * TILE + TILE / 2); return null;
      case 'money_bag': this.spawnPickup('money_bag', cx, o.row * TILE + TILE / 2); return null;
      case 'question_block': this.blocks.add(new QuestionBlock(this, cx, o.row * TILE + TILE / 2)); return null;
      case 'bridge': {
        // meta.bridgeTile: use a tile of the level's tileset as the deck (the wave footbridge)
        const deck = this.meta.bridgeStyle === 'wave' ? [waveDeckTexture(this), '__BASE'] : this.bridgeDeck();
        // a long bridge is a chain of short segments, each with its own collapse timer
        const seg = this.meta.bridgeSegment || BALANCE.collapse.segment;
        for (let c = o.col; c < o.col + o.len; c += seg) {
          const n = Math.min(seg, o.col + o.len - c);
          const br = deck ? new CrumblingBridge(this, c, o.row, n, deck[0], deck[1]) : new CrumblingBridge(this, c, o.row, n);
          // the district's footbridge only gives way under a corrupt politician
          if (this.meta.bridgeHostileOnly && !districtHostile()) br.safe = true;
          if (this.meta.bridgeStyle === 'wave') dressWaveBridge(this, br, c, o.row, n, c === o.col, c + n >= o.col + o.len);
          this.bridges.add(br);
        }
        return null;
      }
      case 'hook': {
        const h = new HangingHook(this, o.col, o.row, o.depth);
        this.hooks.add(h); this.hookZones.add(h.zone); h.zone.body.updateFromGameObject();
        return null;
      }
      case 'mover': {
        const vertical = o.toCol === o.col;
        const m = new MovingPlatform(this, cx, feetY, o.toCol * TILE + TILE / 2, (o.toRow + 1) * TILE, vertical);
        this.movers.add(m);
        return null;
      }
      case 'journalist': case 'detective': case 'cop': case 'voter': case 'guest': case 'guard':
      case 'oldlady': case 'kid': case 'rat': case 'assistant': case 'oppmp': case 'journalist_f': case 'seatedmp':
      case 'bandit': case 'gopnik': case 'citizen': case 'dog': case 'dogwalker': case 'mp':
        if (o.gateTier === undefined) this.spawnEnemy(o.type, cx, feetY, o);
        return null;
      case 'tree':
        // alternate green / golden crowns along the level
        this.trees.push(new ChestnutTree(this, o.col, o.row, this.trees.length % 2 ? 'gold' : 'green'));
        return null;
      case 'chestnut': case 'book':
        this.spawnPickup(o.type, cx, feetY - 14);
        return null;
      case 'secret': this.secrets.push(new SecretHatch(this, o.col, o.row)); return null;
      case 'whiskey': case 'vodka': this.spawnPickup(o.type, cx, feetY - 22); return null;
      case 'debris': this.debris.push(new FallingDebris(this, o.col, o.row, debrisHostile())); return null;
      case 'boss': this.spawnBoss((this.meta.boss && this.meta.boss.type) || 'animator', cx, feetY); return null;
      default: return null;
    }
  }

  spawnPickup(kind, x, y, opts = {}) {
    const p = new Pickup(this, x, y, kind, opts);
    this.pickups.add(p);
    if (opts.falling) { p.body.allowGravity = true; p.body.setImmovable(false); }
    return p;
  }

  spawnEnemy(type, x, y, opts = {}) {
    const o = { dir: opts.dir, emerge: opts.emerge, patrolMin: x - 170, patrolMax: x + 170 };
    let e;
    switch (type) {
      case 'journalist': e = new Journalist(this, x, y, o); break;
      case 'detective': e = new Detective(this, x, y, o); break;
      case 'cop': e = new Cop(this, x, y, o); break;
      case 'voter': e = new Voter(this, x, y, o); break;
      case 'guest': e = new PartyGuest(this, x, y, o); break;
      case 'guard': e = new BorderGuard(this, x, y, o); break;
      case 'oldlady': e = new OldLady(this, x, y, o); break;
      case 'kid': e = new Kid(this, x, y, o); break;
      case 'rat': e = new Rat(this, x, y, { ...o, patrolMin: x - 120, patrolMax: x + 120 }); break;
      case 'assistant': e = new Assistant(this, x, y, o); break;
      case 'oppmp': e = new OppositionMP(this, x, y, o); break;
      case 'journalist_f': e = new Journalist(this, x, y, { ...o, skin: 'journalist_f' }); break;
      case 'seatedmp': e = new SeatedMP(this, x, y, o); break;
      case 'bandit': e = new Bandit(this, x, y, o); break;
      case 'mafioso': e = new Bandit(this, x, y, { ...o, always: true }); break;
      case 'gopnik': e = new Gopnik(this, x, y, o); break;
      case 'citizen': e = new Citizen(this, x, y, o); break;
      case 'dog': e = new Dog(this, x, y, o); break;
      case 'dogwalker': e = new DogWalker(this, x, y, o); break;
      case 'mp': e = new Assistant(this, x, y, { ...o, skin: 'mp' }); break;
      default: return null;
    }
    this.enemies.add(e);
    return e;
  }

  spawnBoss(type, x, y) {
    const Cls = { animator: AnimatorBoss, ratboss: RatBoss, speaker: SpeakerBoss, mafia: MafiaBoss, gopboss: GangBoss }[type];
    if (!Cls || !this.textures.get('chars').has(`${type}_idle`)) return null;
    const b = new Cls(this, x, y, { patrolMin: x - 400, patrolMax: x + 400 });
    this.enemies.add(b);
    this.boss = b;
    return b;
  }

  // ------------------------------------------------------------------ chestnuts & bosses
  throwNut() {
    const P = this.player;
    const now = this.time.now;
    if (P.dead || now < this.nutReadyAt) return;
    const kind = GameState.takeAmmo();
    if (!kind) {
      this.ui.flash(t('no_nuts'), '#e8b06a', 700);
      audio.playDenied();
      this.nutReadyAt = now + 300;
      return;
    }
    this.nutReadyAt = now + BALANCE.nuts.cooldownMs;
    P.throwLock = now + 250;
    audio.playThrowCash();
    this.wobble(this.projectiles.throwNut(P.x + P.facing * 30, P.y - 60, P.facing, kind));
  }

  onNutHitEnemy(nut, enemy) {
    if (!nut.active || !enemy.active) return;
    const wasFree = !enemy.stunned && !enemy.bribed && !enemy.isBoss;
    if (enemy.onNutHit(nut.kind)) {
      if (wasFree && ['oldlady', 'kid', 'assistant'].includes(enemy.type)) {
        GameState.addConscience('stun_civilian');
        this.narrator.say('stun_civilian', { priority: 0 });
      } else if (wasFree && enemy.type === 'journalist') {
        GameState.addConscience('stun_press');
        this.narrator.say('stun_journalist', { priority: 0 });
      }
      this.projectiles.burst(nut.x, nut.y, 0x8a5a2b, 5);
      nut.destroy();
    }
  }

  onBossWake(boss) {
    this.bossAwake = true;
    this.narrator.say(`${this.def.id}_boss`, { priority: 2 });
    if (this.ui && this.ui.setBoss) this.ui.setBoss(t(`boss_${boss.type}`), boss.hp, boss.maxHp);
  }

  onBossHit(boss) {
    if (this.ui && this.ui.setBoss) this.ui.setBoss(t(`boss_${boss.type}`), boss.hp, boss.maxHp);
  }

  onBossDefeated(boss, how) {
    if (boss.type === 'mafia') {
      // the 10%: you beat the mafia boss… and still wake up in the district (the party had consequences)
      this.mafiaFight = false;
      this.cutscene('mafia_won', 'e32', () => { GameState.jacketless = true; GameState.emit(); });
    }
    this.bossAwake = false;
    if (this.ui && this.ui.hideBoss) this.ui.hideBoss();
    this.cameras.main.shake(250, 0.006);
    if (how !== 'bribed') GameState.addScore(5000);
    this.ui.flash(t(how === 'bribed' ? 'boss_bribed' : 'boss_beaten'), how === 'bribed' ? '#f2c14e' : '#7ddf7d', 2200);
    this.narrator.say(how === 'bribed' ? 'boss_bribed' : 'boss_beaten', { priority: 2 });
    // the hall applauds the winner
    for (const e of this.enemies.getChildren()) if (e instanceof SeatedMP && e.active) e.bribed = true;
  }

  /** Speaker's vote: every seated MP throws. */
  speakerVote() {
    for (const e of this.enemies.getChildren()) if (e instanceof SeatedMP && e.active && !e.stunned && !e.bribed) e.volley();
  }

  /** Climb into the secret hatch: straight to the bonus level. */
  enterSecret() {
    if (this.finished) return;
    const target = levelIndexById(this.meta.secret || 'p21b');
    if (target < 0) return;
    this.finished = true;
    audio.playCheckpoint();
    this.ui.flash(t('secret_found'), '#ffe66d', 1400);
    this.narrator.say('secret_found', { priority: 2 });
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.time.delayedCall(1000, () => {
      this.scene.stop('UI');
      GameState.clearCheckpoint();
      GameState.levelIndex = target;
      const before = LEVELS[target].cardsBefore && STORY[LEVELS[target].cardsBefore];
      if (before) this.scene.start('Story', { cards: before, title: t(LEVELS[target].nameKey), next: { scene: 'Level', data: { levelIndex: target } } });
      else this.scene.start('Level', { levelIndex: target });
    });
  }

  interactWorld() {
    const P = this.player;
    for (const h of this.secrets) if (h.near(P)) { this.enterSecret(); return true; }
    for (const tr of this.trees) if (tr.near(P) && tr.shake()) return true;
    for (const sh of this.shops) {
      if (Math.abs(P.x - sh.x) < BALANCE.alcohol.shopRange && Math.abs(P.y - sh.y) < 120) { this.buyAtShop(sh); return true; }
    }
    return false;
  }

  /** One-time hints when you first stand next to a tree or a hatch. */
  worldHints() {
    const P = this.player;
    for (const tr of this.trees) if (!tr.hinted && tr.near(P)) { tr.hinted = true; this.ui.flash(t('hint_tree'), '#e8b06a', 1400); }
    for (const h of this.secrets) if (!h.hinted && h.near(P)) { h.hinted = true; this.ui.flash(t('hint_secret'), '#ffe66d', 1600); }
    for (const sh of this.shops) {
      if (!sh.hinted && Math.abs(P.x - sh.x) < BALANCE.alcohol.shopRange && Math.abs(P.y - sh.y) < 120) {
        sh.hinted = true;
        if (sh.item === 'ticket') this.ui.flash(`${t('hint_ticket')} (${BALANCE.world3.ticketPrice} $)`, '#ffcf6b', 1600);
        else this.ui.flash(`${t('hint_shop')} (${BALANCE.alcohol[sh.item].price} $)`, '#ffcf6b', 1600);
      }
    }
  }

  /** The parliament door: the front entrance (the corridor) or the basement door (the secret bunker). */
  askDoor() {
    this.doorAsked = true;
    this.player.body.setVelocityX(0);
    this.scene.pause();
    this.scene.launch('Choice', {
      titleKey: 'choice_door_title', textKey: 'choice_door_text', from: 'Level',
      options: [{ labelKey: 'choice_door_front', value: 'front' }, { labelKey: 'choice_door_basement', value: 'basement' }],
      onPick: (v) => { if (v === 'basement') this.enterSecret(); else this.completeLevel(); },
    });
    this.scene.bringToTop('Choice');
  }

  /** Whoever stands on a moving platform travels with it (Arcade does not carry riders by itself). */
  carryRiders() {
    const riders = [this.player, ...this.enemies.getChildren()];
    for (const m of this.movers.getChildren()) {
      const dx = m.x - (m.prevX ?? m.x);
      const dy = m.y - (m.prevY ?? m.y);
      m.prevX = m.x; m.prevY = m.y;
      if (!dx && !dy) continue;
      const top = m.body.top;
      for (const r of riders) {
        if (!r || !r.active || !r.body || r.dead) continue;
        const b = r.body;
        const standing = b.bottom >= top - 6 && b.bottom <= top + 10 && b.right > m.body.left + 4 && b.left < m.body.right - 4
          && b.velocity.y >= -1;
        if (!standing) continue;
        r.x += dx;
        if (dy > 0) r.y += dy;          // follow a descending platform (rising ones push by collision)
      }
    }
  }

  // ------------------------------------------------------------------ world 3: mafia, taxi, train
  bridgeDeck() {
    const name = this.meta.bridgeTile;
    const key = this.layer && this.layer.tileset && this.layer.tileset[0] && this.layer.tileset[0].name;
    const index = key && this.cache.json.get(`${key}_index`);
    if (!name || !index || index.tiles[name] === undefined) return null;
    const tex = this.textures.get(key);
    const frame = `deck_${name}`;
    const id = index.tiles[name];
    if (!tex.has(frame)) tex.add(frame, 0, (id % index.columns) * TILE, Math.floor(id / index.columns) * TILE, TILE, TILE);
    return [key, frame];
  }

  /** Cut scene (story cards) and then the next level. `setup` mutates the state in between. */
  cutscene(cardsKey, nextId, setup) {
    if (this.cutsceneStarted) return;
    this.cutsceneStarted = true;
    this.finished = true;
    this.cameras.main.setRotation(0);
    this.time.delayedCall(900, () => {
      if (setup) setup();
      const idx = levelIndexById(nextId);
      GameState.levelIndex = idx;
      GameState.clearCheckpoint();
      this.scene.stop('UI');
      this.scene.start('Story', {
        cards: STORY[cardsKey] || [], title: t(`cut_${cardsKey}`),
        next: { scene: 'Level', data: { levelIndex: idx } },
      });
    });
  }

  /** The mafia boss makes his offer: a Yes / No choice with the level paused. */
  mafiaOffer(boss) {
    this.narrator.say('mafia_offer', { priority: 2 });
    this.time.delayedCall(1400, () => {
      this.scene.pause();
      this.scene.launch('Choice', {
        titleKey: 'choice_mafia_title', textKey: 'choice_mafia_text', from: 'Level',
        options: [{ labelKey: 'choice_mafia_yes', value: 'yes' }, { labelKey: 'choice_mafia_no', value: 'no' }],
        onPick: (v) => this.onMafiaChoice(boss, v),
      });
      this.scene.bringToTop('Choice');
    });
  }

  onMafiaChoice(boss, v) {
    GameState.mafiaChoice = v;
    if (v === 'yes') {
      this.scene.get('Level').lastPickupX = boss.x;
      GameState.addPickup('mafia_bribe');
      boss.say('bubble_mafia_deal', 2000, '#f2c14e');
      this.narrator.say('mafia_yes', { priority: 2 });
      this.cutscene('mafia_yes', 'e32', () => { GameState.jacketless = true; GameState.wallet = 0; GameState.emit(); });
      return;
    }
    // refused: the boss and his men attack; three hits and you are knocked out
    this.narrator.say('mafia_no', { priority: 2 });
    this.mafiaFight = true;
    this.mafiaHits = 0;
    boss.startFight();
    for (const dx of [-260, 200, 320]) this.spawnEnemy('mafioso', boss.x + dx, boss.y);
  }

  /** Player.hurt hook: counts the hits in the mafia fight. */
  onPlayerHurt() {
    if (!this.mafiaFight || this.cutsceneStarted) return;
    this.mafiaHits += 1;
    if (this.mafiaHits >= BALANCE.world3.mafiaKnockoutHits) {
      this.mafiaFight = false;
      this.player.remorse(3);
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cutscene('mafia_lost', 'e32', () => { GameState.jacketless = true; GameState.wallet = 0; GameState.emit(); });
    }
  }

  /** Goal conditions of world 3: pay the taxi, show the train ticket. Returns true to proceed. */
  goalAllowed() {
    const goal = this.meta.goal;
    const w = BALANCE.world3;
    const nag = (key) => {
      if (this.lockedHintAt && this.time.now < this.lockedHintAt) return false;
      this.lockedHintAt = this.time.now + 2000;
      this.ui.flash(t(key), '#ff6b6b', 1400);
      return false;
    };
    if (goal === 'taxi') {
      if (GameState.cleanRun) { this.narrator.say('taxi_free', { priority: 2 }); return true; }
      if (GameState.wallet < w.taxiPrice && GameState.tier.id <= w.salaryMaxTier) {
        // a nearly clean MP (a stray coin, no real heat) pays with his salary instead of getting stuck at the rank
        if (!this.salaryTaxiSaid) { this.salaryTaxiSaid = true; this.ui.flash(t('taxi_salary'), '#7ddf7d', 1400); }
        this.narrator.say('taxi_salary', { priority: 2 });
        return true;
      }
      if (!GameState.spendWallet(w.taxiPrice)) { this.narrator.say('taxi_no_money'); return nag('taxi_need_money'); }
      this.narrator.say('taxi_paid', { priority: 2 });
      return true;
    }
    if (goal === 'train') {
      if (!GameState.hasTicket) { this.narrator.say('train_no_ticket'); return nag('train_need_ticket'); }
      return true;
    }
    return true;
  }

  buyTicket() {
    const w = BALANCE.world3;
    if (GameState.hasTicket) { this.ui.flash(t('ticket_have'), '#7ddf7d', 900); return; }
    if ((GameState.cleanRun || GameState.tier.id <= w.salaryMaxTier) && GameState.wallet < w.ticketPrice) {
      // an honest MP lives on his official salary: it arrives just in time for a third-class ticket
      GameState.hasTicket = true;
      GameState.emit();
      this.ui.flash(t('ticket_salary'), '#7ddf7d', 1600);
      this.narrator.say('ticket_salary', { priority: 2 });
      return;
    }
    if (!GameState.spendWallet(w.ticketPrice)) {
      audio.playDenied();
      this.ui.flash(`${t('shop_price')} ${w.ticketPrice} $`, '#ff6b6b', 900);
      this.narrator.say('ticket_no_money');
      return;
    }
    GameState.hasTicket = true;
    GameState.emit();
    audio.playCheckpoint();
    this.ui.flash(t('ticket_bought'), '#7ddf7d', 1200);
    this.narrator.say('ticket_bought', { priority: 1 });
  }

  // ------------------------------------------------------------------ conscience & alcohol
  drinkBottle(kind) {
    const P = this.player;
    GameState.drink(kind, this.time.now);
    P.drinkUntil = this.time.now + 700;
    audio.playCoin();
    this.ui.popValue(P.x, P.y - 100, t(kind === 'vodka' ? 'drink_vodka_pop' : 'drink_whiskey_pop'), '#ffcf6b');
    this.narrator.say(kind === 'vodka' ? 'drink_vodka' : 'drink_whiskey', { priority: 2 });
    this.hangoverSaid = false;
  }

  /** E next to a shop: buy a bottle with bribe money and drink it on the spot. */
  buyAtShop(shop) {
    if (shop.item === 'ticket') { this.buyTicket(); return; }
    const price = BALANCE.alcohol[shop.item].price || 3;
    if (!GameState.spendWallet(price)) {
      audio.playDenied();
      this.ui.flash(`${t('shop_price')} ${price} $`, '#ff6b6b', 900);
      this.narrator.say('shop_no_money');
      return;
    }
    this.narrator.say('shop_buy', { priority: 0 });
    this.drinkBottle(shop.item);
  }

  updateConscience(time, delta) {
    const P = this.player;
    const c = BALANCE.conscience;
    if (GameState.conscience >= c.warnAt && !this.warned) { this.warned = true; this.narrator.say('conscience_warn'); }
    if (GameState.conscience < c.warnAt - 20) this.warned = false;
    // check before the decay: a gain that just hit 100 must not slip back to 99.99 unnoticed
    const full = GameState.conscience >= c.max - 0.01;
    GameState.decayConscience(delta / 1000);
    if (full && time >= this.nextConscienceAt && P.onGround) {
      this.nextConscienceAt = time + c.freezeCooldownSec * 1000;
      GameState.conscience = c.afterFreeze;
      GameState.emit();
      P.remorse(c.freezeSec, time);
      this.cameras.main.flash(200, 120, 90, 200);
      this.narrator.say('conscience_freeze', { priority: 2 });
      this.showConscienceAngel(c.freezeSec);
    }
    // drunk: the world sways a little; hangover line when it wears off
    const drunk = GameState.drunkProfile(time);
    const cam = this.cameras.main;
    if (drunk) {
      cam.setRotation(Math.sin(time / 520) * drunk.sway);
      if (Math.random() < delta / 25000) this.narrator.say('drunk_walk', { priority: 0 });
    } else if (cam.rotation !== 0) {
      cam.setRotation(0);
      if (!this.hangoverSaid) { this.hangoverSaid = true; this.narrator.say('hangover', { priority: 0 }); }
    }
  }

  showConscienceAngel(sec) {
    if (!this.textures.get('props').has('conscience_angel')) return;
    const P = this.player;
    const a = this.add.image(P.x + 40, P.y - 130, 'props', 'conscience_angel').setDepth(DEPTH.fx).setAlpha(0);
    this.tweens.add({ targets: a, alpha: 0.9, y: a.y - 10, duration: 300 });
    this.tweens.add({ targets: a, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: Math.ceil(sec * 2) });
    this.time.delayedCall(sec * 1000, () => this.tweens.add({ targets: a, alpha: 0, y: a.y - 30, duration: 400, onComplete: () => a.destroy() }));
  }

  /** Drunk throws: speed and angle wobble. */
  wobble(proj) {
    const d = GameState.drunkProfile(this.time.now);
    if (!d || !proj || !proj.body) return;
    const v = proj.body.velocity;
    proj.body.setVelocity(v.x * (1 + (Math.random() * 2 - 1) * d.spread), v.y + (Math.random() * 2 - 1) * d.spread * 420);
  }

  setupColliders() {
    const P = this.player;
    this.physics.add.collider(P, this.layer);
    this.physics.add.collider(P, this.blocks, (p, b) => {
      if (b instanceof QuestionBlock && p.body.touching.up && b.body.touching.down) b.hit();
    });
    this.physics.add.collider(P, this.bridges, (p, b) => { if (p.body.touching.down) b.onStep(); });
    this.physics.add.collider(P, this.movers);
    this.physics.add.collider(P, this.decorSolids);
    this.physics.add.collider(this.enemies, this.decorSolids);
    this.physics.add.collider(this.pickups, this.decorSolids);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.enemies, this.blocks);
    this.physics.add.collider(this.enemies, this.bridges);
    this.physics.add.collider(this.enemies, this.movers);
    this.physics.add.collider(this.pickups, this.layer);
    this.physics.add.collider(this.pickups, this.blocks);
    this.physics.add.collider(this.pickups, this.bridges);
    this.physics.add.collider(this.projectiles.cash, this.layer, (c) => c.destroy());
    // chestnuts thrown at you by kids and MPs often stay on the floor: free ammo for the fight back
    this.physics.add.collider(this.projectiles.hostile, this.layer, (c) => {
      if (c.kind === 'chestnut' && c.active && Math.random() < 0.7) this.spawnPickup('chestnut', c.x, c.y - 12, { falling: true });
      c.destroy();
    }, (c) => !c.noWallDestroy);
    this.physics.add.collider(this.projectiles.nuts, this.layer, (c) => c.destroy());
    this.physics.add.overlap(this.projectiles.nuts, this.enemies, (n, e) => this.onNutHitEnemy(n, e));
    this.physics.add.overlap(this.projectiles.cash, this.enemies, (c, e) => this.bribes.onCashHitEnemy(c, e));
    this.physics.add.overlap(this.projectiles.pr, this.enemies, (c, e) => this.bribes.onPRHitEnemy(c, e));
    this.physics.add.overlap(P, this.projectiles.hostile, (p, proj) => { if (proj.active && p.hurt(proj.x, proj.kind)) proj.destroy(); });
    this.physics.add.overlap(P, this.enemies, (p, e) => this.onEnemyContact(p, e));
    this.physics.add.overlap(P, this.pickups, (p, pk) => pk.collect(p));
    this.physics.add.overlap(P, this.hazards, (p, z) => this.killPlayer(z.kind));
    this.physics.add.overlap(P, this.triggers, (p, z) => this.onTrigger(z));
    this.physics.add.overlap(P, this.hookZones, (p, z) => z.hook.trigger());
    this.physics.add.overlap(P, this.hooks, (p, h) => { if (h.dangerous) p.hurt(h.x, 'hook'); });
    this.physics.add.collider(this.enemies, this.enemies);
  }

  setupCamera() {
    const cam = this.cameras.main;
    // the last map row stays below the screen edge (pits read as bottomless)
    cam.setBounds(0, 0, this.widthPx, Math.max(GAME_H, this.heightPx - TILE * 2));
    cam.startFollow(this.player, true, 0.12, 0.12, 0, 40);
    cam.setDeadzone(180, 90);
    cam.setRoundPixels(true);
  }

  setupKeys() {
    const kb = this.input.keyboard;
    const mk = (names) => names.map((n) => kb.addKey(Phaser.Input.Keyboard.KeyCodes[n]));
    this.keys = { left: mk(KEYS.left), right: mk(KEYS.right), jump: mk(KEYS.jump), bribe: mk(KEYS.bribe), blackPR: mk(KEYS.blackPR), interact: mk(KEYS.interact), nut: mk(KEYS.nut) };
    kb.on('keydown-P', () => this.togglePause());
    kb.on('keydown-ESC', () => this.togglePause());
    kb.on('keydown-F1', () => this.togglePause(true));
    kb.on('keydown-R', () => { if (!this.finished) this.scene.restart({ levelIndex: this.levelIndex, fromCheckpoint: true }); });
    kb.on('keydown-M', () => { Save.muted = audio.toggleMute(); });
    if (GameState.devMode) {
      kb.on('keydown-N', () => this.completeLevel());
      kb.on('keydown-H', () => GameState.devSetHeat(Math.min(100, GameState.heat + 15)));
      kb.on('keydown-G', () => { this.player.invulnUntil = this.player.invulnUntil > 1e12 ? 0 : 1e13; });
    }
  }

  /** P / Esc: open the pause menu (resume, save, load, help, main menu). */
  togglePause(help = false) {
    if (this.finished || this.scene.isPaused()) return;
    this.scene.pause();
    this.scene.launch('Pause', { levelIndex: this.levelIndex, openHelp: help });
    this.scene.bringToTop('Pause');
  }

  // ------------------------------------------------------------------ loop
  update(time, delta) {
    if (!this.player || this.finished) return;
    const cam = this.cameras.main;
    this.updateParallax();
    if (this.sky) this.sky.update(time);

    if (!this.player.dead) {
      this.player.handleInput(this.keys, time, delta);
      if (this.keys.bribe.some((k) => Phaser.Input.Keyboard.JustDown(k))) this.bribes.throwCash(this.player);
      if (this.keys.blackPR.some((k) => Phaser.Input.Keyboard.JustDown(k))) this.bribes.throwPR(this.player);
      if (this.keys.nut.some((k) => Phaser.Input.Keyboard.JustDown(k))) this.throwNut();
      if (this.keys.interact.some((k) => Phaser.Input.Keyboard.JustDown(k))) { if (!this.interactWorld()) this.interact(); }
      this.worldHints();
      this.narrator.update();
      for (const d of this.debris) d.update(this.player);
      this.updateConscience(time, delta);
      if (this.player.y > this.heightPx + TILE * 2) this.killPlayer('pit');
    } else if (this.player.y > this.heightPx + TILE * 6) {
      this.afterDeath();
    }
    for (const e of this.enemies.getChildren()) {
      if (e.active && (e.y > this.heightPx + TILE * 4)) e.destroy();
    }
    this.carryRiders();
    this.director.update(time);
  }

  interact() {
    for (const e of this.enemies.getChildren()) {
      if (e.active && e.interact && Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 105) {
        if (e.interact()) return;
      }
    }
  }

  onEnemyContact(player, enemy) {
    if (player.dead || !enemy.active) return;
    enemy.onPlayerContact(player);
  }

  onTrigger(z) {
    if (z.kind === 'goal') {
      if (this.boss && !this.boss.defeated) {
        if (!this.lockedHintAt || this.time.now > this.lockedHintAt) {
          this.lockedHintAt = this.time.now + 2000;
          this.ui.flash(t(`goal_locked_${this.boss.type}`), '#ff6b6b', 1400);
          this.boss.wake();
        }
        return;
      }
      if (!this.goalAllowed()) return;
      if (this.meta.doorChoice && !this.doorAsked) { this.askDoor(); return; }
      this.completeLevel();
    }
    else if (z.kind === 'checkpoint' && !z.used) {
      z.used = true;
      GameState.setCheckpoint(this.def.id, z.x + TILE / 2, z.y + z.height);
      if (z.flag) z.flag.setTint(0x7ddf7d);
      audio.playCheckpoint();
      this.ui.flash(t('checkpoint'), '#7ddf7d', 900);
      this.narrator.say('checkpoint', { priority: 0 });
      if (GameState.tier.id >= BALANCE.spawn.checkpointAmbushTier) this.director.sting(this.player.x, this.player.y, true);
    }
  }

  tick() {
    if (this.finished || this.player.dead) return;
    this.timeLeft -= 1;
    if (this.ui && this.ui.setTime) this.ui.setTime(this.timeLeft);
    if (this.timeLeft === 30) this.narrator.say('time_low', { priority: 1 });
    if (this.timeLeft <= 0) { this.ui.flash(t('time_up'), '#ff6b6b', 1200); this.killPlayer('time'); }
  }

  penalizeTime(sec) {
    this.timeLeft = Math.max(1, this.timeLeft - sec);
    if (this.ui && this.ui.setTime) this.ui.setTime(this.timeLeft);
    this.ui.flash(`-${sec}s`, '#ff6b6b', 900);
  }

  killPlayer(reason) {
    if (this.player.dead || this.finished) return;
    this.player.die();
    this.cameras.main.shake(200, 0.006);
    this.cameras.main.flash(120, 200, 40, 40);
    this.ui.flash(t(`die_${reason}`), '#ff6b6b', 1000);
    this.time.delayedCall(1100, () => this.afterDeath());
  }

  afterDeath() {
    if (this.finished) return;
    this.finished = true;
    const left = GameState.loseLife();
    if (left <= 0) {
      this.scene.stop('UI');
      this.scene.start('GameOver', { reason: 'lives' });
    } else {
      this.ui.flash(t('lost_life'), '#ff6b6b', 900);
      this.time.delayedCall(700, () => this.scene.restart({ levelIndex: this.levelIndex, fromCheckpoint: true }));
    }
  }

  arrest() {
    if (this.finished) return;
    this.finished = true;
    GameState.ending = 'arrest';
    this.player.stun(99);
    audio.playNABUSiren();
    this.time.delayedCall(1200, () => { this.scene.stop('UI'); this.scene.start('Finale', {}); });
  }

  completeLevel() {
    if (this.finished) return;
    this.finished = true;
    this.player.body.setVelocityX(0);
    const honest = (GameState.levelStats[this.levelIndex]?.pickups || 0) === 0;
    const bonus = GameState.levelFinished(this.levelIndex, this.timeLeft, honest);
    this.ui.flash(`${t('level_clear')}\n${t('level_bonus')} +${bonus}${honest && GameState.cleanRun ? `  ★ ${t('honest_bonus')}` : ''}`, '#7ddf7d', 1800);
    this.narrator.say('level_clear', { priority: 2 });
    this.cameras.main.setRotation(0);
    if (this.player.anims.exists && this.anims.exists('politician_victory')) this.player.play('politician_victory');
    this.time.delayedCall(2000, () => {
      this.scene.stop('UI');
      if (this.def.finale) { this.scene.start('Finale', {}); return; }
      const nextIndex = this.def.next ? levelIndexById(this.def.next) : this.levelIndex + 1;
      const next = LEVELS[nextIndex];
      GameState.levelIndex = nextIndex;
      // cut scenes: this level's "after" cards, else the new world's intro, then the next level's own cards
      const newWorld = next.world !== this.def.world;
      const cards = this.def.cardsAfter ? [...STORY[this.def.cardsAfter]]
        : [...(newWorld ? STORY[`world${next.world}`] || [] : []), ...(next.cardsBefore ? STORY[next.cardsBefore] || [] : [])];
      const title = newWorld ? t(`world_${next.world}`) : t(next.nameKey);
      if (cards.length) this.scene.start('Story', { cards, title, next: { scene: 'Level', data: { levelIndex: nextIndex } } });
      else this.scene.start('Level', { levelIndex: nextIndex });
    });
  }
}
