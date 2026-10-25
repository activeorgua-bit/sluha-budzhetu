import Phaser from 'phaser';
import { GAME_W, GAME_H, DEPTH } from '../config/constants.js';
import { GameState } from '../core/GameState.js';
import { t, textStyle } from '../core/i18n.js';
import { IS_TOUCH } from '../core/touch.js';

/** HUD overlay, laid out like the mockups: SCORE · LIVES · BRIBES · LEVEL · TIME + heat bar. */
export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  init(data) { this.levelLabel = data.label || '1-1'; }

  create() {
    // Compact black bar: small captions, half-size icons, and two gauges on the right:
    // CORRUPTION (public suspicion) and CONSCIENCE (the inner judge), each with its own caption.
    const H = 50;
    const bar = this.add.rectangle(0, 0, GAME_W, H, 0x05060a, 1).setOrigin(0);
    bar.setDepth(DEPTH.ui);
    const icon = (x, frame, size = 22) => (this.textures.get('ui').has(frame)
      ? this.add.image(x, 32, 'ui', frame).setScale(size / 48).setDepth(DEPTH.ui) : null);
    const head = (x, key) => this.add.text(x, 5, t(key), textStyle(8, '#9aa2b1')).setDepth(DEPTH.ui);
    const val = (x) => this.add.text(x, 25, '', textStyle(12, '#ffffff')).setDepth(DEPTH.ui);
    // SCORE · LIVES · BRIBES · CHESTNUTS · LEVEL · TIME · REPUTATION · CORRUPTION · CONSCIENCE
    head(10, 'hud_score'); this.score = val(10);
    head(94, 'hud_lives'); this.livesIcon = icon(104, 'hud_portrait');
    this.lives = val(118);
    head(176, 'hud_bribes'); this.bagIcon = icon(186, 'hud_bag');
    this.bribes = val(200);
    head(258, 'hud_nuts'); this.nutIcon = icon(268, 'hud_chestnut', 20);
    this.nuts = val(282);
    head(340, 'hud_level'); this.level = val(340);
    head(398, 'hud_time'); this.clockIcon = icon(408, 'hud_clock', 20);
    this.time = val(422);
    const gauge = (x, key, iconFrame, w) => {
      head(x, key);
      const ic = icon(x + 8, iconFrame, 20);
      if (ic) ic.setY(24);
      const bg = this.add.rectangle(x + 22, 24, w, 10, 0x2a2f3a).setOrigin(0, 0.5).setStrokeStyle(2, 0x888888).setDepth(DEPTH.ui);
      const fill = this.add.rectangle(x + 24, 24, 0, 6, 0x7ddf7d).setOrigin(0, 0.5).setDepth(DEPTH.ui);
      const label = this.add.text(x + 22, 34, '', textStyle(7, '#7ddf7d')).setDepth(DEPTH.ui);
      return { bg, fill, label, w: w - 4 };
    };
    const rep = gauge(484, 'hud_rep', 'hud_heart', 110);
    this.repFill = rep.fill; this.repLabel = rep.label; this.repW = rep.w;
    const heat = gauge(632, 'hud_heat', 'hud_thermo', 110);
    this.heatFill = heat.fill; this.tier = heat.label; this.heatW = heat.w;
    const cons = gauge(780, 'hud_conscience', 'hud_conscience', 110);
    this.consFill = cons.fill; this.consLabel = cons.label; this.consW = cons.w;
    this.consFill.setFillStyle(0xb48cff);
    this.drunkIcon = icon(930, 'hud_drunk', 22);
    if (this.drunkIcon) this.drunkIcon.setY(26).setVisible(false);   // right of the conscience bar it silences

    // the inner voice: a small parchment note in the top-left corner under the HUD, clear of the action;
    // its height follows the text, and [x] closes it (and drops the lines still waiting)
    const bw = IS_TOUCH ? 300 : 340;
    this.bookW = bw;
    // (on touch screens the pause / fullscreen buttons hold the corner: the note starts right of them)
    this.bookX = IS_TOUCH ? 120 : 8;
    this.book = this.add.container(this.bookX, 56).setDepth(DEPTH.ui).setVisible(false);
    this.bookPage = this.add.rectangle(0, 0, bw, 48, 0xf4e6c4, 0.95).setOrigin(0).setStrokeStyle(2, 0x6b4a2b);
    this.bookSpine = this.add.rectangle(10, 4, 4, 40, 0xc9a66b).setOrigin(0);
    this.bookIcon = this.textures.get('props').has('book_open') ? this.add.image(30, 24, 'props', 'book_open').setScale(0.42) : null;
    this.bookText = this.add.text(48, 8, '', textStyle(7, '#3b2412', { wordWrap: { width: bw - 48 - 26 }, lineSpacing: 5 })).setOrigin(0);
    const closeBg = this.add.rectangle(bw - 13, 4, 18, 18, 0xe2cfa3).setOrigin(0.5, 0).setStrokeStyle(1, 0x6b4a2b)
      .setInteractive({ useHandCursor: true });
    const closeX = this.add.text(bw - 13, 13, 'x', textStyle(8, '#6b4a2b')).setOrigin(0.5);
    closeBg.on('pointerdown', (ptr, lx, ly, ev) => { if (ev) ev.stopPropagation(); this.closeBook(); });
    this.bookClose = [closeBg, closeX];
    this.book.add([this.bookPage, this.bookSpine, ...(this.bookIcon ? [this.bookIcon] : []), this.bookText, closeBg, closeX]);
    this.bookQueue = [];
    this.bookBusyUntil = 0;
    this.bookPriority = -1;

    // boss bar (hidden until a boss wakes up)
    this.bossBox = this.add.container(GAME_W / 2, 84).setDepth(DEPTH.ui).setVisible(false);
    const bossBg = this.add.rectangle(0, 0, 404, 18, 0x05060a, 0.9).setStrokeStyle(2, 0xf2c14e);
    this.bossFill = this.add.rectangle(-199, 0, 398, 12, 0xd94141).setOrigin(0, 0.5);
    this.bossName = this.add.text(0, -18, '', textStyle(9, '#ffe66d', { stroke: '#000', strokeThickness: 4 })).setOrigin(0.5, 0.5);
    const crown = this.textures.get('ui').has('hud_crown') ? this.add.image(-214, 0, 'ui', 'hud_crown').setScale(0.6) : null;
    this.bossBox.add([bossBg, this.bossFill, this.bossName, ...(crown ? [crown] : [])]);

    this.msg = this.add.text(GAME_W / 2, 130, '', textStyle(14, '#ffffff', { stroke: '#000', strokeThickness: 5, align: 'center' }))
      .setOrigin(0.5).setDepth(DEPTH.ui).setAlpha(0);
    this.msgTween = null;

    this.refresh = () => this.render();
    GameState.events.on('change', this.refresh);
    this.events.once('shutdown', () => {
      GameState.events.off('change', this.refresh);
      // objects are destroyed with the scene; drop the references so late calls are ignored
      this.msg = null; this.score = null; this.time = null; this.tier = null; this.msgTween = null; this.bossBox = null; this.book = null; this.bookText = null;
    });
    this.render();
  }

  setLevel(label) { this.levelLabel = label; this.render(); }
  setTime(sec) {
    if (!this.time) return;
    this.time.setText(String(Math.max(0, Math.ceil(sec))).padStart(3, '0'));
    this.time.setColor(sec < 20 ? '#ff6b6b' : '#ffffff');
  }

  render() {
    if (!this.score) return;
    const s = GameState;
    this.score.setText(String(s.score).padStart(6, '0'));
    this.lives.setText(`x ${String(s.lives).padStart(2, '0')}`);
    this.bribes.setText(`x ${String(s.wallet).padStart(2, '0')}`);
    // books are thrown first: show them while you carry any
    const books = s.books > 0;
    if (this.nutIcon) {
      const f = books ? 'hud_book' : 'hud_chestnut';
      if (this.textures.get('ui').has(f) && this.nutIcon.frame.name !== f) this.nutIcon.setFrame(f);
    }
    this.nuts.setText(`x ${String(books ? s.books : s.chestnuts).padStart(2, '0')}`).setColor(books ? '#ff8f8f' : '#ffffff');
    this.level.setText(this.levelLabel);
    const rep = Math.max(0, Math.round(s.reputation));
    this.repFill.width = Math.round(this.repW * rep / 100);
    const repColor = rep >= 70 ? '#7ddf7d' : rep >= 35 ? '#f2c14e' : '#ff6b6b';
    this.repFill.setFillStyle(Phaser.Display.Color.HexStringToColor(repColor).color);
    this.repLabel.setText(`${t(rep >= 70 ? 'hud_rep_good' : rep >= 35 ? 'hud_rep_mid' : 'hud_rep_low')} ${rep}%`).setColor(repColor);
    const heat = s.heat;
    this.heatFill.width = Math.round(this.heatW * heat / 100);
    const cons = Math.round(s.conscience);
    this.consFill.width = Math.round(this.consW * cons / 100);
    const consColor = cons >= 75 ? '#ff5c8a' : cons >= 40 ? '#d7b8ff' : '#b48cff';
    this.consFill.setFillStyle(Phaser.Display.Color.HexStringToColor(consColor).color);
    const mood = cons >= 75 ? 'hud_cons_bite' : cons >= 40 ? 'hud_cons_uneasy' : 'hud_cons_calm';
    this.consLabel.setText(`${t(mood)} ${cons}%`).setColor(consColor);
    if (this.drunkIcon) this.drunkIcon.setVisible(!!s.drunk);
    const color = heat === 0 ? 0x7ddf7d : heat < 25 ? 0xd6df7d : heat < 55 ? 0xf2c14e : heat < 80 ? 0xf28c4e : 0xff5555;
    this.heatFill.setFillStyle(color);
    const label = s.cleanRun ? t('hud_clean') : t(`tier_${s.tier.key}`);
    this.tier.setText(`${label} ${heat}%`).setColor(`#${color.toString(16).padStart(6, '0')}`);
  }

  setBoss(name, hp, max) {
    if (!this.bossBox) return;
    this.bossBox.setVisible(true);
    this.bossName.setText(name);
    this.bossFill.width = Math.max(0, Math.round(398 * hp / max));
  }

  hideBoss() { if (this.bossBox) this.bossBox.setVisible(false); }

  /**
   * Inner-voice line. Returns false when a more important line is on screen. Lines type out and
   * stay long enough to read; lower-priority lines wait in a short queue.
   */
  narrate(text, priority = 1) {
    if (!this.book) return false;
    const now = this.sys.time.now;
    const busy = now < this.bookBusyUntil;
    const shownFor = now - (this.bookShownAt || 0);
    if (busy && (priority < this.bookPriority || (priority === this.bookPriority && shownFor < 3500))) {
      if (this.bookQueue.length < 2) { this.bookQueue.push({ text, priority, at: now }); return true; }
      return false;
    }
    this.showPage(text, priority);
    return true;
  }

  showPage(text, priority) {
    if (this.bookTimer) this.bookTimer.remove();
    if (this.bookHide) this.bookHide.remove();
    // size the note to the whole line before it types out; stay below the boss bar when one is up
    this.bookText.setText(text);
    const h = Math.max(36, Math.ceil(this.bookText.height) + 16);
    this.bookText.setText('');
    this.bookPage.setSize(this.bookW, h);
    this.bookSpine.setSize(4, h - 8);
    if (this.bookIcon) this.bookIcon.setY(h / 2);
    this.book.setY(this.bossBox && this.bossBox.visible ? 106 : 56);
    this.book.setVisible(true).setAlpha(1);
    this.bookPriority = priority;
    this.bookShownAt = this.sys.time.now;
    let i = 0;
    this.bookText.setText('');
    this.bookTimer = this.sys.time.addEvent({
      delay: 22, repeat: text.length - 1,
      callback: () => { i += 1; if (this.bookText) this.bookText.setText(text.slice(0, i)); },
    });
    const readMs = 2200 + text.length * 38;
    this.bookBusyUntil = this.sys.time.now + readMs;
    this.bookHide = this.sys.time.delayedCall(readMs, () => {
      if (!this.book) return;
      // lines that waited too long no longer match what is on screen
      while (this.bookQueue.length && this.sys.time.now - this.bookQueue[0].at > 7000) this.bookQueue.shift();
      const next = this.bookQueue.shift();
      if (next) { this.showPage(next.text, next.priority); return; }
      this.bookPriority = -1;
      this.tweens.add({ targets: this.book, alpha: 0, duration: 300, onComplete: () => this.book && this.book.setVisible(false) });
    });
  }

  /** [x] on the note: hide it now and drop the lines still waiting. */
  closeBook() {
    if (!this.book) return;
    if (this.bookTimer) this.bookTimer.remove();
    if (this.bookHide) this.bookHide.remove();
    this.bookQueue = [];
    this.bookBusyUntil = 0;
    this.bookPriority = -1;
    this.book.setVisible(false);
  }

  /** Big centred message that fades out. */
  flash(text, color = '#ffffff', ms = 1200) {
    if (!this.msg || !this.msg.active) return;
    this.msg.setText(text).setColor(color).setAlpha(1);
    if (this.msgTween) this.msgTween.remove();
    this.msgTween = this.tweens.add({ targets: this.msg, alpha: 0, delay: ms, duration: 300 });
  }

  /** Floating "+1$" near a world position (converted to screen space by the caller's camera). */
  popValue(worldX, worldY, text, color = '#ffe066') {
    if (!this.msg) return;
    const level = this.scene.get('Level');
    const cam = level && level.cameras ? level.cameras.main : null;
    const sx = cam ? worldX - cam.scrollX : worldX;
    const sy = cam ? worldY - cam.scrollY : worldY;
    const tx = this.add.text(sx, sy, text, textStyle(8, color, { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5).setDepth(DEPTH.ui);
    this.tweens.add({ targets: tx, y: sy - 30, alpha: 0, duration: 700, onComplete: () => tx.destroy() });
  }
}
