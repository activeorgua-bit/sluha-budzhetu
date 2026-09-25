import Phaser from 'phaser';
import { GameState } from '../core/GameState.js';
import { Save } from '../core/Save.js';
import { audio } from '../core/Audio.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const params = new URLSearchParams(location.search);
    GameState.devMode = params.get('dev') === '1';
    if (GameState.devMode) import('../core/devtools.js').then((m) => m.installDevTools(this.game));
    if (Save.muted) audio.muted = true;
    // Automated/dev testing runs silent (add &sound=1 to hear it); the saved preference is untouched.
    if (GameState.devMode && params.get('sound') !== '1') audio.muted = true;

    // Unlock the procedural audio on the first gesture anywhere in the page.
    const unlock = () => audio.init();
    this.input.keyboard.once('keydown', unlock);
    this.input.once('pointerdown', unlock);

    const go = () => this.scene.start('Preload');
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('12px PressStart2P'), document.fonts.ready])
        .then(go)
        .catch(go);
      // never hang on a font
      this.time.delayedCall(2500, () => { if (this.scene.isActive('Boot')) go(); });
    } else {
      go();
    }
  }
}
