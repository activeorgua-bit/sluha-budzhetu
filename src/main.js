import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config/constants.js';
import { BALANCE } from './config/balance.js';
import { BootScene } from './scenes/Boot.js';
import { PreloadScene } from './scenes/Preload.js';
import { MenuScene } from './scenes/Menu.js';
import { LevelScene } from './scenes/Level.js';
import { UIScene } from './scenes/UI.js';
import { StoryScene } from './scenes/Story.js';
import { FinaleScene } from './scenes/Finale.js';
import { GameOverScene } from './scenes/GameOver.js';
import { PauseScene } from './scenes/Pause.js';
import { HelpScene } from './scenes/Help.js';
import { SaveLoadScene } from './scenes/SaveLoad.js';
import { ChoiceScene } from './scenes/Choice.js';
import { IS_TOUCH, touchPad } from './core/touch.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0b0d12',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  // FIT fills the window (phones included) keeping 16:9; Phaser does the centering (the page adds none)
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: BALANCE.player.gravity },
      tileBias: 48,
      debug: new URLSearchParams(location.search).get('debug') === '1',
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, LevelScene, UIScene, StoryScene, FinaleScene, GameOverScene, PauseScene, HelpScene, SaveLoadScene, ChoiceScene],
};

const game = new Phaser.Game(config);
window.__game = game; // handy for automated tests and the browser console

// phones: on-screen controls; the browser bars coming and going change the visual viewport
if (IS_TOUCH) game.events.once('ready', () => touchPad.install(game));
window.visualViewport?.addEventListener('resize', () => game.scale.refresh());

export default game;
