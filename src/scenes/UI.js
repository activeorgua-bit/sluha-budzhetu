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
    // Black bar like the mockups: big white pixel numbers, 48 px generated icons.
    const bar = this.add.rectangle(0, 0, GAME_W, 66, 0x05060a, 1).setOrigin(0);
    bar.setDepth(DEPTH.ui);
    const icon = (x, frame, scale = 1) => (this.textures.get('ui').has(frame)
      ? this.add.image(x, 40, 'ui', frame).setScale(scale).setDepth(DEPTH.ui) : null);
    const head = (x, key) => this.add.text(x, 6, t(key), textStyle(10, '#ffffff')).setDepth(DEPTH.ui);
    const val = (x) => this.add.text(x, 30, '', textStyle(16, '#ffffff')).setDepth(DEPTH.ui);
    // SCORE · LIVES · BRIBES · CHESTNUTS · LEVEL · TIME · HEAT
    head(14, 'hud_score'); this.score = val(14);
    head(150, 'hud_lives'); this.livesIcon = icon(170, 'hud_portrait');
    this.lives = val(198);
    head(292, 'hud_bribes'); this.bagIcon = icon(312, 'hud_bag');
    this.bribes = val(340);
    head(436, 'hud_nuts'); this.nutIcon = icon(456, 'hud_chestnut', 0.8);
    this.nuts = val(482);
    head(580, 'hud_level'); this.level = val(580);
    head(682, 'hud_time'); this.clockIcon = icon(694, 'hud_clock', 0.66);
    this.time = val(712);
    // HEAT (public suspicion) over CONSCIENCE (inner judge), tier label next to the header
    head(812, 'hud_heat');
    this.tier = this.add.text(812, 18, '', textStyle(7, '#7ddf7d')).setDepth(DEPTH.ui);
    this.thermoIcon = icon(822, 'hud_thermo', 0.5);
    if (this.thermoIcon) this.thermoIcon.setY(36);
    this.heatBg = this.add.rectangle(836, 36, 112, 12, 0x2a2f3a).setOrigin(0, 0.5).setStrokeStyle(2, 0x888888).setDepth(DEPTH.ui);
    this.heatFill = this.add.rectangle(838, 36, 0, 8, 0x7ddf7d).setOrigin(0, 0.5).setDepth(DEPTH.ui);
    this.consIcon = icon(822, 'hud_conscience', 0.4);
    if (this.consIcon) this.consIcon.setY(54);
    this.consBg = this.add.rectangle(836, 54, 112, 12, 0x2a2f3a).setOrigin(0, 0.5).setStrokeStyle(2, 0x888888).setDepth(DEPTH.ui);
    this.consFill = this.add.rectangle(838, 54, 0, 8, 0xb48cff).setOrigin(0, 0.5).setDepth(DEPTH.ui);
    this.drunkIcon = icon(792, 'hud_drunk', 0.55);
    if (this.drunkIcon) this.drunkIcon.setY(44).setVisible(false);

    // the inner voice: a parchment page at the bottom of the screen (over the underground rows)
    this.book = this.add.container(0, 0).setDepth(DEPTH.ui).setVisible(false);
    // on touch screens the page sits between the thumb controls (d-pad left, jump right)
    const pw = IS_TOUCH ? Math.round(GAME_W * 0.58) : GAME_W - 40;
    const ph = IS_TOUCH ? 84 : 76;
    const py = IS_TOUCH ? 490 : 494;
    const px0 = GAME_W / 2 - pw / 2;
    const page = this.add.rectangle(GAME_W / 2, py, pw, ph, 0xf4e6c4, 0.96).setStrokeStyle(3, 0x6b4a2b);
    const spine = this.add.rectangle(px0 + 20, py, 6, ph - 6, 0xc9a66b);
    const bookIcon = this.textures.get('props').has('book_open') ? this.add.image(px0 + 46, py, 'props', 'book_open').setScale(0.75) : null;
    this.bookText = this.add.text(px0 + 80, py, '', textStyle(8, '#3b2412', { wordWrap: { width: pw - 100 }, lineSpacing: 6 })).setOrigin(0, 0.5);
    this.book.add([page, spine, ...(bookIcon ? [bookIcon] : []), this.bookText]);
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
    const heat = s.heat;
    this.heatFill.width = Math.round(108 * heat / 100);
    const cons = Math.round(s.conscience);
    this.consFill.width = Math.round(108 * cons / 100);
    this.consFill.setFillStyle(cons >= 75 ? 0xff5c8a : 0xb48cff);
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
