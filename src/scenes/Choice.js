import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { t, textStyle } from '../core/i18n.js';
import { MenuList } from './MenuList.js';

/**
 * Interactive choice overlay (the mafia's offer, the country to flee to).
 * data = { titleKey, textKey, image?, options: [{ labelKey, value }], from: sceneKey, onPick: (value) => void }
 * The calling scene is paused while the choice is open and resumed before `onPick` runs.
 */
export class ChoiceScene extends Phaser.Scene {
  constructor() { super('Choice'); }

  init(data) { this.data0 = data; }

  create() {
    const d = this.data0;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05060a, d.image ? 1 : 0.8).setOrigin(0);
    if (d.image && this.textures.exists(d.image)) {
      const img = this.add.image(GAME_W / 2, 150, d.image);
      const src = this.textures.get(d.image).getSourceImage();
      img.setScale(Math.min((GAME_W - 200) / src.width, 250 / src.height));
    }
    const top = d.image ? 290 : 120;
    this.add.text(GAME_W / 2, top, t(d.titleKey), textStyle(16, '#f2c14e', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5);
    if (d.textKey) {
      this.add.text(GAME_W / 2, top + 36, t(d.textKey), textStyle(8, '#ffffff', { align: 'center', wordWrap: { width: 780 }, lineSpacing: 6 }))
        .setOrigin(0.5, 0);
    }
    const items = d.options.map((o) => ({ label: () => t(o.labelKey), action: () => this.pick(o.value) }));
    this.menu = new MenuList(this, GAME_W / 2, top + (d.textKey ? 100 : 60), items, { gap: 30, size: 11 });
  }

  pick(value) {
    const d = this.data0;
    this.scene.stop();
    if (d.from) this.scene.resume(d.from);
    if (d.onPick) d.onPick(value);
  }
}
