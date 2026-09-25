import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { t, textStyle } from '../core/i18n.js';
import { MenuList } from './MenuList.js';

/** Pause overlay above a paused Level: resume, save, load, help, main menu. */
export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) { this.levelIndex = data.levelIndex ?? 0; this.openHelp = !!data.openHelp; }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05060a, 0.72).setOrigin(0);
    this.add.rectangle(GAME_W / 2, GAME_H / 2 + 10, 420, 300, 0x0e1320, 0.95).setStrokeStyle(3, 0xf2c14e);
    this.add.text(GAME_W / 2, 150, t('paused'), textStyle(22, '#f2c14e', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5);
    this.menu = new MenuList(this, GAME_W / 2, 210, [
      { label: () => t('pause_resume'), action: () => this.resume() },
      { label: () => t('menu_save'), action: () => this.open('SaveLoad', { mode: 'save' }) },
      { label: () => t('menu_load'), action: () => this.open('SaveLoad', { mode: 'load' }) },
      { label: () => t('menu_help'), action: () => this.open('Help', {}) },
      { label: () => t('pause_quit'), action: () => this.quit() },
    ], { gap: 34, size: 13 });
    this.input.keyboard.on('keydown-ESC', () => this.resume());
    this.input.keyboard.on('keydown-P', () => this.resume());
    this.events.on('resume', () => this.menu.refresh());
    if (this.openHelp) this.time.delayedCall(10, () => this.open('Help', {}));
  }

  open(key, data) {
    this.scene.pause();
    this.scene.launch(key, { ...data, from: 'Pause', levelIndex: this.levelIndex });
    this.scene.bringToTop(key);
  }

  resume() {
    this.scene.stop();
    this.scene.resume('Level');
  }

  quit() {
    this.scene.stop('Level');
    this.scene.stop('UI');
    this.scene.stop();
    this.scene.start('Menu');
  }
}
