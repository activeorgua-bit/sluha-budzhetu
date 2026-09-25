import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { GameState } from '../core/GameState.js';
import { STORY } from '../config/levels.js';
import { t, textStyle } from '../core/i18n.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) { this.reason = data.reason || 'lives'; }

  create() {
    GameState.ending = 'gameover';
    this.cameras.main.setBackgroundColor('#05060a');
    const bg = Math.random() < 0.7 && this.textures.exists('story_gameover_v2') ? 'story_gameover_v2' : 'story_gameover';
    if (this.textures.exists(bg)) this.add.image(GAME_W / 2, GAME_H / 2, bg).setDisplaySize(GAME_W, GAME_H).setAlpha(0.3);
    this.add.text(GAME_W / 2, 150, t('ending_gameover'), textStyle(26, '#ff6b6b', { stroke: '#000', strokeThickness: 6 })).setOrigin(0.5);
    const props = this.textures.get('props');
    const f = GameState.jacketless ? 'mpshirt_dead_top' : 'politician_dead_top';
    if (props.has(f)) this.add.image(GAME_W / 2, 335, 'props', f).setOrigin(0.5, 1).setScale(1.1);
    else this.add.image(GAME_W / 2, 300, 'chars', 'politician_idle').setOrigin(0.5, 1).setScale(1.8).setTint(0x888888);
    this.add.text(GAME_W / 2, 372, t('story_gameover'), textStyle(9, '#ddd', { wordWrap: { width: 700 }, align: 'center', lineSpacing: 6 })).setOrigin(0.5);
    this.add.text(GAME_W / 2, 440, t('play_again'), textStyle(10, '#f2c14e')).setOrigin(0.5);
    const go = () => this.scene.start('Finale', { phase: 'result' });
    this.input.keyboard.on('keydown-ENTER', go);
    this.input.keyboard.on('keydown-SPACE', go);
    this.cards = STORY.gameover;
  }
}
