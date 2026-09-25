import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { t, textStyle } from '../core/i18n.js';

/**
 * Generic story-card player. data = { cards: [{image, textKey}], next: {scene, data}, title? }
 * Cards whose image is missing show a dark panel with the text only.
 */
export class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }

  init(data) {
    this.cards = data.cards || [];
    this.next = data.next || { scene: 'Menu' };
    this.titleText = data.title || '';
    this.index = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#05060a');
    this.image = this.add.image(GAME_W / 2, GAME_H / 2 - 40, '__DUMMY').setVisible(false);
    this.panel = this.add.rectangle(GAME_W / 2, GAME_H - 70, GAME_W - 80, 100, 0x000000, 0.75).setStrokeStyle(2, 0xf2c14e);
    this.text = this.add.text(60, GAME_H - 112, '', textStyle(10, '#ffffff', { wordWrap: { width: GAME_W - 120 }, lineSpacing: 6 }));
    this.title = this.add.text(GAME_W / 2, 24, this.titleText, textStyle(14, '#f2c14e', { stroke: '#000', strokeThickness: 4 })).setOrigin(0.5);
    this.hint = this.add.text(GAME_W - 40, GAME_H - 18, t('skip_hint'), textStyle(7, '#9a9a9a')).setOrigin(1, 0.5);
    this.show();
    const advance = () => this.advance();
    this.input.keyboard.on('keydown-SPACE', advance);
    this.input.keyboard.on('keydown-ENTER', advance);
    this.input.on('pointerdown', advance);
  }

  show() {
    const card = this.cards[this.index];
    if (!card) return this.finish();
    // two illustrations for one moment: the new one 70 % of the time, the older `alt` 30 %
    let img = card.image;
    if (card.alt && this.textures.exists(card.alt) && Math.random() < 0.3) img = card.alt;
    if (img && this.textures.exists(img)) {
      this.image.setTexture(img).setVisible(true);
      const tex = this.textures.get(img).getSourceImage();
      const scale = Math.min((GAME_W - 80) / tex.width, (GAME_H - 160) / tex.height);
      this.image.setScale(scale);
    } else {
      this.image.setVisible(false);
    }
    this.full = t(card.textKey);
    this.shown = 0;
    this.text.setText('');
    if (this.typer) this.typer.remove();
    this.typer = this.time.addEvent({
      delay: 22, repeat: this.full.length - 1,
      callback: () => { this.shown++; this.text.setText(this.full.slice(0, this.shown)); },
    });
  }

  advance() {
    if (this.shown < this.full.length) {
      this.shown = this.full.length;
      this.text.setText(this.full);
      if (this.typer) this.typer.remove();
      return;
    }
    this.index++;
    this.show();
  }

  finish() {
    this.scene.start(this.next.scene, this.next.data || {});
  }
}
