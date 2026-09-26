import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { t, textStyle } from '../core/i18n.js';
import { IS_TOUCH } from '../core/touch.js';

/**
 * One screen before 1-1: controls on the left (keys, or the on-screen buttons on phones), and on the
 * right how things "work here". The rules stay ironic on purpose: consequences are only rumoured.
 * data: { next: { scene, data } }
 */
export class BriefingScene extends Phaser.Scene {
  constructor() { super('Briefing'); }

  init(data) { this.next = data.next || { scene: 'Level', data: { levelIndex: 0 } }; }

  create() {
    this.cameras.main.setBackgroundColor('#05060a');
    for (const bg of ['story_intro_crossroads', 'story_intro']) {
      if (this.textures.exists(bg)) { this.add.image(GAME_W / 2, GAME_H / 2, bg).setDisplaySize(GAME_W, GAME_H).setAlpha(0.16); break; }
    }
    this.add.text(GAME_W / 2, 34, t('brief_title'), textStyle(15, '#f2c14e', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5);

    // left: controls
    const lx = 40;
    this.add.text(lx, 70, t('brief_keys'), textStyle(10, '#9fd1ff'));
    const rows = IS_TOUCH
      ? [['◀ ▶', 'brief_t_move'], ['▲', 'brief_t_jump'], ['icon:ui:hud_chestnut', 'brief_nut'], ['icon:props:newspaper', 'brief_pr'],
        ['icon:ui:hud_bag', 'brief_bribe'], [t('brief_t_act').toUpperCase(), 'brief_act'], ['II', 'brief_pause']]
      : [['← → / A D', 'brief_move'], ['SPACE / ↑', 'brief_jump'], ['K', 'brief_nut'], ['L', 'brief_pr'],
        ['J', 'brief_bribe'], ['E', 'brief_act'], ['P / ESC', 'brief_pause']];
    rows.forEach(([key, label], i) => {
      const y = 104 + i * 40;
      const box = this.add.rectangle(lx, y, 112, 30, 0x1a1d26, 0.95).setOrigin(0, 0.5).setStrokeStyle(2, 0xe8b62a);
      if (key.startsWith('icon:')) {
        const [, atlas, frame] = key.split(':');
        if (this.textures.exists(atlas) && this.textures.get(atlas).has(frame)) {
          const img = this.add.image(box.x + 56, y, atlas, frame);
          img.setScale(Math.min(26 / img.height, 60 / img.width));
        }
      } else {
        this.add.text(box.x + 56, y, key, textStyle(9, '#e8b62a')).setOrigin(0.5);
      }
      this.add.text(lx + 126, y, t(label), textStyle(8, '#ffffff', { wordWrap: { width: 290 }, lineSpacing: 4 })).setOrigin(0, 0.5);
    });

    // right: how things work (with a little sprite each)
    const rx = 500;
    this.add.text(rx, 70, t('brief_rules'), textStyle(10, '#9fd1ff'));
    const rules = [['props', 'money_bag', 'brief_r1'], ['ui', 'hud_thermo', 'brief_r2'], ['ui', 'hud_chestnut', 'brief_r3'], ['ui', 'hud_conscience', 'brief_r4']];
    let y = 96;
    for (const [atlas, frame, key] of rules) {
      if (this.textures.exists(atlas) && this.textures.get(atlas).has(frame)) {
        const img = this.add.image(rx + 16, y + 14, atlas, frame);
        img.setScale(Math.min(28 / img.height, 30 / img.width));
      }
      const txt = this.add.text(rx + 42, y, t(key), textStyle(8, key === 'brief_r4' ? '#f2c14e' : '#e6e6e6',
        { wordWrap: { width: 410 }, lineSpacing: 6, fontStyle: key === 'brief_r4' ? 'italic' : 'normal' }));
      y += Math.max(40, txt.height + 18);
    }

    const go = this.add.text(GAME_W / 2, GAME_H - 30, t('brief_go'), textStyle(11, '#7ddf7d', { stroke: '#000', strokeThickness: 4 })).setOrigin(0.5);
    this.tweens.add({ targets: go, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
    const start = () => { if (!this.leaving) { this.leaving = true; this.scene.start(this.next.scene, this.next.data || {}); } };
    this.time.delayedCall(600, () => {             // no accidental skip from the key that closed the cut scene
      for (const k of ['ENTER', 'SPACE', 'ESC']) this.input.keyboard.on(`keydown-${k}`, start);
      this.input.on('pointerdown', start);
    });
  }
}
