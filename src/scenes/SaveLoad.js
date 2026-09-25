import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { LEVELS } from '../config/levels.js';
import { GameState } from '../core/GameState.js';
import { Save, SLOT_IDS } from '../core/Save.js';
import { t, textStyle } from '../core/i18n.js';
import { MenuList } from './MenuList.js';

/**
 * Save / load screen: an autosave (written at the start of every level) and three manual slots.
 * A save stores the state at the START of the current level, so re-collecting coins after a load
 * cannot inflate corruption, wallet or score.
 * data: { mode: 'save' | 'load', from: scene key to resume on close, levelIndex }
 */
export class SaveLoadScene extends Phaser.Scene {
  constructor() { super('SaveLoad'); }

  init(data) {
    this.mode = data.mode || 'load';
    this.from = data.from || 'Menu';
    this.levelIndex = data.levelIndex ?? GameState.levelIndex ?? 0;
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05060a, 0.98).setOrigin(0);
    this.add.text(GAME_W / 2, 90, t(this.mode === 'save' ? 'menu_save' : 'menu_load'),
      textStyle(22, '#f2c14e', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5);
    this.note = this.add.text(GAME_W / 2, 130, t(this.mode === 'save' ? 'save_note' : 'load_note'),
      textStyle(8, '#9fd1ff', { align: 'center', wordWrap: { width: 800 } })).setOrigin(0.5);
    const slots = this.mode === 'save' ? SLOT_IDS.filter((s) => s !== 'auto') : SLOT_IDS;
    const items = slots.map((id) => ({
      label: () => this.describe(id),
      action: () => this.pick(id),
      enabled: () => this.mode === 'save' || !!Save.readSlot(id),
    }));
    items.push({ label: () => t('back'), action: () => this.close() });
    this.menu = new MenuList(this, GAME_W / 2, 200, items, { gap: 44, size: 11 });
    this.status = this.add.text(GAME_W / 2, 470, '', textStyle(10, '#7ddf7d')).setOrigin(0.5);
    this.input.keyboard.on('keydown-ESC', () => this.close());
  }

  describe(id) {
    const s = Save.readSlot(id);
    const name = id === 'auto' ? t('slot_auto') : `${t('slot')} ${id}`;
    if (!s) return `${name}: ${t('slot_empty')}`;
    const when = new Date(s.savedAt);
    const pad = (n) => String(n).padStart(2, '0');
    const time = `${pad(when.getDate())}.${pad(when.getMonth() + 1)} ${pad(when.getHours())}:${pad(when.getMinutes())}`;
    const clean = s.state.cleanRun ? ` ${t('hud_clean')}` : ` ${t('hud_heat')} ${Math.round(Math.min(100, s.state.corruption * 0.6))}%`;
    return `${name}: ${t('hud_level')} ${s.label}  ${String(s.state.score).padStart(6, '0')}${clean}  ${time}`;
  }

  pick(id) {
    if (this.mode === 'save') {
      const snap = GameState.levelStartSnapshot || GameState.serialize();
      const ok = Save.writeSlot(id, { levelIndex: this.levelIndex, label: LEVELS[this.levelIndex].label, state: snap });
      this.status.setText(ok ? t('saved') : t('save_failed')).setColor(ok ? '#7ddf7d' : '#ff6b6b');
      this.menu.refresh();
      return;
    }
    const s = Save.readSlot(id);
    if (!s) return;
    GameState.restore(s.state);
    GameState.levelStartSnapshot = s.state;
    for (const key of ['Level', 'UI', 'Pause', 'Help', 'Menu']) if (this.scene.isActive(key) || this.scene.isPaused(key)) this.scene.stop(key);
    this.scene.start('Level', { levelIndex: s.levelIndex });
  }

  close() {
    this.scene.stop();
    if (this.from) this.scene.resume(this.from);
  }
}
