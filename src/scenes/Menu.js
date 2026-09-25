import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { GameState } from '../core/GameState.js';
import { Save } from '../core/Save.js';
import { t, toggleLang, textStyle } from '../core/i18n.js';
import { STORY, LEVELS } from '../config/levels.js';
import { audio } from '../core/Audio.js';
import { MenuList } from './MenuList.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.setBackgroundColor('#0b0d12');
    if (this.textures.exists('title')) {
      // dedicated title illustration (generated); the lower third is kept dark for the menu
      // shift the illustration up so the characters sit in the upper half and the rooftop wall
      // becomes the band behind the title; darken the bottom for the menu text
      this.add.image(0, -30, 'title').setOrigin(0).setDisplaySize(GAME_W, GAME_H);
      const g = this.add.graphics();
      g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9);
      g.fillRect(0, 372, GAME_W, GAME_H - 372);
    } else {
      if (this.textures.exists('l12_sky')) this.add.image(0, 0, 'l12_sky').setOrigin(0).setAlpha(0.55);
      if (this.textures.exists('l12_far')) this.add.image(0, 120, 'l12_far').setOrigin(0).setAlpha(0.8);
      this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.35).setOrigin(0);
      this.add.image(GAME_W / 2 - 110, 150, 'chars', 'politician_idle').setScale(3);
      this.add.image(GAME_W / 2 + 110, 150, 'chars', 'journalist_camera').setScale(3).setFlipX(true);
    }

    this.title = this.add.text(GAME_W / 2, 338, t('title'), textStyle(28, '#f2c14e', { stroke: '#000', strokeThickness: 6 })).setOrigin(0.5);
    this.subtitle = this.add.text(GAME_W / 2, 368, t('subtitle'), textStyle(8, '#e8e8e8', { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5);

    this.menu = new MenuList(this, GAME_W / 2, 398, [
      { label: () => this.continueLabel(), action: () => this.continueGame(), enabled: () => !!Save.latest() },
      { label: () => t('menu_start'), action: () => this.start() },
      { label: () => t('menu_load'), action: () => this.open('SaveLoad', { mode: 'load' }) },
      { label: () => t('menu_help'), action: () => this.open('Help', {}) },
      { label: () => t('menu_lang'), action: () => { toggleLang(); this.refresh(); } },
    ], { gap: 23, size: 11 });
    this.bestLabel = this.add.text(GAME_W / 2, 512, '', textStyle(7, '#9fd1ff', { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5);
    this.hint = this.add.text(GAME_W / 2, 529, '', textStyle(6, '#f2c14e', { wordWrap: { width: 900 }, align: 'center', stroke: '#000', strokeThickness: 3 })).setOrigin(0.5);
    this.dev = this.add.text(8, 8, '', textStyle(7, '#ff6b6b', { stroke: '#000', strokeThickness: 3 }));
    this.refresh();
    this.events.on('resume', () => this.refresh());

    const kb = this.input.keyboard;
    kb.on('keydown-L', () => { toggleLang(); this.refresh(); });
    kb.on('keydown-M', () => { Save.muted = audio.toggleMute(); });
    kb.on('keydown-F1', () => this.open('Help', {}));
    kb.on('keydown-H', () => this.open('Help', {}));
    if (GameState.devMode) {
      for (let i = 1; i <= LEVELS.length; i++) {
        kb.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][i - 1]}`, () => this.startAt(i - 1));
      }
      kb.on('keydown-F', () => this.scene.start('Finale', { forced: 'honest' }));
    }
  }

  open(key, data) {
    this.scene.pause();
    this.scene.launch(key, { ...data, from: 'Menu' });
    this.scene.bringToTop(key);
  }

  continueLabel() {
    const s = Save.latest();
    return s ? `${t('menu_continue')} (${s.label})` : t('menu_continue');
  }

  continueGame() {
    const s = Save.latest();
    if (!s) return;
    audio.init();
    GameState.restore(s.state);
    GameState.levelStartSnapshot = s.state;
    this.scene.start('Level', { levelIndex: s.levelIndex });
  }

  refresh() {
    this.title.setText(t('title'));
    this.subtitle.setText(t('subtitle'));
    this.menu.refresh();
    const best = Save.best;
    this.bestLabel.setText(best
      ? `${t('menu_best')}: ${t('ending_' + best.ending)}  ${best.score}`
      : `${t('menu_best')}: ${t('menu_none')}`);
    this.hint.setText(t('menu_hint'));
    this.dev.setText(GameState.devMode ? t('dev_mode') : '');
  }

  start() {
    audio.init();
    GameState.reset();
    this.scene.start('Story', { cards: STORY.intro, next: { scene: 'Level', data: { levelIndex: 0 } } });
  }

  startAt(index) {
    audio.init();
    GameState.reset();
    GameState.levelIndex = index;
    this.scene.start('Level', { levelIndex: index });
  }
}
