import Phaser from 'phaser';
import { TILE, DEPTH } from '../../config/constants.js';
import { BALANCE, collapseSeconds } from '../../config/balance.js';
import { GameState } from '../../core/GameState.js';
import { audio } from '../../core/Audio.js';

/**
 * Crumbling bridge: a run of girder segments. The first step starts a timer that gets
 * shorter the more the politician has stolen (draft formula max(0.32, 2.6 - corruption*0.095)).
 */
export class CrumblingBridge extends Phaser.GameObjects.TileSprite {
  constructor(scene, col, row, len, texKey = 'props', frame = 'bridge_girder') {
    const w = len * TILE;
    super(scene, col * TILE + w / 2, row * TILE + TILE / 2, w, TILE, texKey, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.tiles + 1);
    this.body.setSize(w, TILE - 4).setOffset(0, 0);
    this.stepped = false;
    this.falling = false;
    this.baseX = this.x;
  }

  onStep() {
    if (this.stepped || this.safe) return;
    this.stepped = true;
    let secs = Math.max(collapseSeconds(GameState.corruption), (this.scene.meta && this.scene.meta.collapseMin) || 0);
    if (this.scene.luckyBridges) {
      secs = Math.max(secs, BALANCE.collapse.luckyMin);   // a lucky day: real rebar
      if (GameState.corruption > 20 && !this.scene.luckySaid && this.scene.narrator) { this.scene.luckySaid = true; this.scene.narrator.say('bridge_lucky', { priority: 2 }); }
    }
    audio.playBridgeCrack();
    this.shake = this.scene.tweens.add({
      targets: this, x: this.baseX + BALANCE.collapse.shakeAmp, duration: 45, yoyo: true, repeat: -1,
    });
    this.scene.time.delayedCall(secs * 1000, () => this.collapse());
  }

  collapse() {
    if (this.falling || !this.scene) return;
    this.falling = true;
    if (this.shake) this.shake.remove();
    this.body.enable = false;
    this.scene.cameras.main.shake(180, 0.004);
    audio.playBridgeCrack();
    // attached pieces (the footbridge railing) fall with the deck
    for (const a of this.attached || []) {
      this.scene.tweens.add({ targets: a, y: a.y + 220, alpha: 0, duration: 700, ease: 'Quad.easeIn', onComplete: () => a.destroy() });
    }
    this.scene.tweens.add({
      targets: this, y: this.y + 220, alpha: 0, angle: Phaser.Math.Between(-6, 6),
      duration: 700, ease: 'Quad.easeIn', onComplete: () => this.destroy(),
    });
  }
}

// ------------------------------------------------------------------ the riverside footbridge (block district)
const WB = { outline: 0x23232c, white: 0xf3f0e6, light: 0xd4d0c4, shade: 0xa9a59a, steel: 0x7d8b99, steelDark: 0x55616e };

/** 48x48 deck tile: white walking surface, light edge, steel side with bolts; open below (water shows). */
export function waveDeckTexture(scene) {
  if (scene.textures.exists('__wavedeck')) return '__wavedeck';
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(WB.outline).fillRect(0, 0, 48, 2);
  g.fillStyle(WB.white).fillRect(0, 2, 48, 7);
  g.fillStyle(WB.light).fillRect(0, 9, 48, 3);
  g.fillStyle(WB.outline).fillRect(0, 12, 48, 2);
  g.fillStyle(WB.steel).fillRect(0, 14, 48, 8);
  g.fillStyle(WB.steelDark).fillRect(0, 20, 48, 2);
  g.fillStyle(WB.light).fillRect(6, 16, 2, 2).fillRect(30, 16, 2, 2);   // bolts
  g.fillStyle(WB.outline).fillRect(0, 22, 48, 2);
  g.generateTexture('__wavedeck', 48, 48);
  g.destroy();
  return '__wavedeck';
}

/** 48x40 railing tile: white top rail, mid rail and posts with dark outlines. */
function waveRailTexture(scene) {
  if (scene.textures.exists('__waverail')) return '__waverail';
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const bar = (x, y, w, h) => { g.fillStyle(WB.outline).fillRect(x - 1, y - 1, w + 2, h + 2); };
  const fill = (x, y, w, h, c) => { g.fillStyle(c).fillRect(x, y, w, h); };
  bar(0, 3, 48, 4); bar(0, 20, 48, 2);
  for (const px of [4, 28]) bar(px, 3, 4, 37);
  fill(0, 3, 48, 4, WB.white); fill(0, 6, 48, 1, WB.shade);
  fill(0, 20, 48, 2, WB.light);
  for (const px of [4, 28]) { fill(px, 3, 4, 37, WB.white); fill(px + 3, 3, 1, 37, WB.shade); }
  g.generateTexture('__waverail', 48, 40);
  g.destroy();
  return '__waverail';
}

/**
 * Dress a bridge run as a simple footbridge: a straight railing along the deck (falls with it) and small
 * abutments at both ends. (The wave bridge itself is only in the background.)
 */
export function dressWaveBridge(scene, bridge, col, row, len, first = true, last = true) {
  const x0 = col * TILE;
  const w = len * TILE;
  const deckY = row * TILE;
  const rail = scene.add.tileSprite(x0, deckY - 40, w, 40, waveRailTexture(scene)).setOrigin(0).setDepth(DEPTH.tiles);
  bridge.attached = [rail];
  const g = scene.add.graphics().setDepth(DEPTH.decorBack);
  // abutments only at the two ends of the whole bridge
  for (const [on, x] of [[first, x0], [last, x0 + w]]) {
    if (!on) continue;
    g.fillStyle(WB.outline).fillRect(x - 10, deckY - 10, 20, 58);
    g.fillStyle(WB.light).fillRect(x - 8, deckY - 8, 16, 56);
  }
  return g;
}

/**
 * Steel crane cable from the top of the map down to a hanging object (pixel-art look: dark outline,
 * grey core, light highlight). Built once as a 4x8 texture and drawn as a vertical TileSprite.
 */
function makeCable(scene, depth) {
  if (!scene.textures.exists('__cable')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // 4 px wide like the cables painted on the props: outline, highlight, core, outline
    g.fillStyle(0x1b1b22).fillRect(0, 0, 4, 8);
    g.fillStyle(0x8a8f9b).fillRect(1, 0, 2, 8);
    g.fillStyle(0xc9ced8).fillRect(1, 0, 1, 8);
    g.fillStyle(0x3d414b).fillRect(1, 3, 2, 1).fillRect(1, 7, 2, 1);   // twisted-strand notches
    g.generateTexture('__cable', 4, 8);
    g.destroy();
  }
  return scene.add.tileSprite(0, 0, 4, 8, '__cable').setOrigin(0.5, 0).setDepth(depth);
}

/** Keep a cable hanging straight from y = 0 to `bottomY` at `x`. */
function hangCable(cable, x, bottomY) {
  cable.setPosition(Math.round(x), 0);
  cable.height = Math.max(0, Math.round(bottomY));
  cable.tilePositionY = -Math.round(bottomY);   // strands stay glued to the moving object
}

/**
 * Top of the walkable slab inside a platform frame: the first row (from the top) whose opaque span
 * covers >= 70 % of the frame width. Rods, railings and cables above it are decoration.
 */
const slabTopCache = new Map();
function slabTop(scene, frame) {
  if (slabTopCache.has(frame)) return slabTopCache.get(frame);
  const f = scene.textures.getFrame('props', frame);
  let top = Math.max(0, f.height - 24);
  for (let y = 0; y < f.height; y++) {
    let n = 0;
    for (let x = 0; x < f.width; x += 2) if (scene.textures.getPixelAlpha(x, y, 'props', frame) > 0) n++;
    if (n / Math.ceil(f.width / 2) >= 0.7) { top = y; break; }
  }
  slabTopCache.set(frame, top);
  return top;
}

/**
 * Where the art's own cable stubs leave the top of a frame: centres (px from the frame's left) of the
 * narrow opaque runs in the first opaque row near the top, and that row. The long code-drawn cables
 * continue exactly these stubs instead of doubling them.
 */
const anchorCache = new Map();
function cableAnchors(scene, frame) {
  if (anchorCache.has(frame)) return anchorCache.get(frame);
  const f = scene.textures.getFrame('props', frame);
  let res = { xs: [], row: 0 };
  for (let y = 0; y < Math.min(12, f.height); y++) {
    const runs = [];
    let start = -1;
    for (let x = 0; x <= f.width; x++) {
      const on = x < f.width && scene.textures.getPixelAlpha(x, y, 'props', frame) > 0;
      if (on && start < 0) start = x;
      if (!on && start >= 0) { runs.push([start, x - 1]); start = -1; }
    }
    if (!runs.length) continue;
    // a twisted cable can read as two runs a few px apart: merge them into one cable
    const merged = [];
    for (const r of runs) {
      const last = merged[merged.length - 1];
      if (last && r[0] - last[1] <= 8) last[1] = r[1]; else merged.push([...r]);
    }
    if (merged.every(([a, b]) => b - a < 16)) res = { xs: merged.map(([a, b]) => (a + b + 1) / 2), row: y };
    break;
  }
  anchorCache.set(frame, res);
  return res;
}

/** Moving platform (velocity driven so Arcade friction carries the rider). A Sprite so preUpdate runs. */
export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, fromX, fromY, toX, toY, vertical) {
    const frame = vertical ? 'hanging_rebar' : 'suspended_platform';
    super(scene, fromX, fromY, 'props', frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.tiles + 1);
    this.setOrigin(0.5, 1);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setFriction(1, 1);
    // rider stands on the slab; rods/railings above it are decoration
    this.slabY = slabTop(scene, frame);
    this.body.setSize(this.width, Math.min(27, this.height - this.slabY)).setOffset(0, this.slabY);
    // crane cables from the top of the map: continue the art's cable stubs, else hang from the corners
    this.anchors = cableAnchors(scene, frame);
    if (!this.anchors.xs.length) this.anchors = { xs: [10, this.width - 10], row: this.slabY + 4 };
    this.cables = this.anchors.xs.map(() => makeCable(scene, DEPTH.tiles));
    this.from = { x: fromX, y: fromY };
    this.to = { x: toX, y: toY };
    this.speed = vertical ? 90 : 120;
    this.target = this.to;
    this.setMove();
    this.updateCables();
    this.once('destroy', () => this.cables.forEach((c) => c.destroy()));
  }

  setMove() {
    this.scene.physics.moveTo(this, this.target.x, this.target.y, this.speed);
  }

  updateCables() {
    const left = this.x - this.width / 2;
    const bottom = this.y - this.height + this.anchors.row + 1;
    this.anchors.xs.forEach((ax, i) => hangCable(this.cables[i], left + ax, bottom));
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // adding the platform to an Arcade group resets its velocity: (re)start the motion if it stalled
    if (this.body.velocity.x === 0 && this.body.velocity.y === 0) this.setMove();
    const d = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (d < 4) {
      this.setPosition(this.target.x, this.target.y);
      this.target = this.target === this.to ? this.from : this.to;
      this.setMove();
    }
    this.updateCables();
  }
}

/**
 * Crane hook hazard: sways over the path; when the player walks under it, the hook drops
 * `depth` tiles, holds, and retracts. The block at its bottom hurts while dropping.
 */
export class HangingHook extends Phaser.Physics.Arcade.Image {
  constructor(scene, col, row, depth) {
    super(scene, col * TILE + TILE / 2, row * TILE, 'props', 'crane_hook');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0);
    this.setDepth(DEPTH.props);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    const bw = Math.max(48, this.width - 16);   // the hazard block spans the frame width
    this.body.setSize(bw, 56).setOffset((this.width - bw) / 2, this.height - 58);
    this.restY = this.y;
    this.dropY = this.y + depth * TILE;
    this.state = 'idle';
    this.cooldownUntil = 0;
    const h = BALANCE.hook;
    this.sway = scene.tweens.add({ targets: this, angle: h.swayDeg, duration: h.swayMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // trigger zone under the hook
    this.zone = scene.add.zone(this.x, this.y + this.height, 66, depth * TILE + 60).setOrigin(0.5, 0);
    scene.physics.add.existing(this.zone, true);
    this.zone.hook = this;
    // cable from the top of the map to the hook's own cable (the frame starts with a cable stub)
    this.cable = makeCable(scene, DEPTH.props - 1);
    const a = cableAnchors(scene, 'crane_hook');
    const dx = a.xs.length ? a.xs[0] - this.width / 2 : 0;
    const sync = () => hangCable(this.cable, this.x + dx, this.y + a.row + 1);
    sync();
    // Arcade Images get no preUpdate; follow the drop/retract tweens from the scene's update event
    scene.events.on('update', sync);
    this.once('destroy', () => { scene.events.off('update', sync); this.cable.destroy(); });
  }

  get dangerous() { return this.state === 'drop'; }

  trigger() {
    if (this.state !== 'idle' || this.scene.time.now < this.cooldownUntil) return;
    this.state = 'drop';
    this.sway.pause();
    this.setAngle(0);
    const h = BALANCE.hook;
    const dist = this.dropY - this.restY;
    this.scene.tweens.add({
      targets: this, y: this.dropY, duration: (dist / h.dropSpeed) * 1000, ease: 'Quad.easeIn',
      onComplete: () => {
        this.state = 'hold';
        this.scene.cameras.main.shake(80, 0.002);
        this.scene.time.delayedCall(h.holdMs, () => {
          this.state = 'retract';
          this.scene.tweens.add({
            targets: this, y: this.restY, duration: (dist / h.retractSpeed) * 1000,
            onComplete: () => { this.state = 'idle'; this.sway.resume(); this.cooldownUntil = this.scene.time.now + 600; },
          });
        });
      },
    });
  }
}
