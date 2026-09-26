import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { t, textStyle } from '../core/i18n.js';

/** Help: controls, rules and a legend drawn with the real sprites. Two pages (← →). */
export class HelpScene extends Phaser.Scene {
  constructor() { super('Help'); }

  init(data) { this.from = data.from || 'Menu'; this.page = 0; }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05060a, 1).setOrigin(0);
    this.title = this.add.text(GAME_W / 2, 36, '', textStyle(20, '#f2c14e', { stroke: '#000', strokeThickness: 5 })).setOrigin(0.5);
    this.content = this.add.container(0, 0);
    this.footer = this.add.text(GAME_W / 2, GAME_H - 22, t('help_footer'), textStyle(8, '#9a9a9a')).setOrigin(0.5);
    const kb = this.input.keyboard;
    const PAGES = 4;
    kb.on('keydown-LEFT', () => this.show((this.page + PAGES - 1) % PAGES));
    kb.on('keydown-RIGHT', () => this.show((this.page + 1) % PAGES));
    kb.on('keydown-A', () => this.show((this.page + PAGES - 1) % PAGES));
    kb.on('keydown-D', () => this.show((this.page + 1) % PAGES));
    for (const k of ['ESC', 'ENTER', 'SPACE', 'H', 'F1']) kb.on(`keydown-${k}`, () => this.close());
    this.input.on('pointerdown', () => (this.page < PAGES - 1 ? this.show(this.page + 1) : this.close()));
    this.show(0);
  }

  show(page) {
    this.page = page;
    this.content.removeAll(true);
    if (page === 0) this.controlsPage();
    else if (page === 1) this.legendPage();
    else if (page === 2) this.legendPage2();
    else this.consciencePage();
  }

  controlsPage() {
    this.title.setText(t('help_title_controls'));
    const rows = [
      ['← → / A D', 'help_move'], ['SPACE / W / ↑', 'help_jump'], ['J / Z', 'help_bribe'],
      ['K / C', 'help_nut'], ['L / X', 'help_pr'], ['E / ENTER', 'help_interact'], ['P / ESC', 'help_pause'],
      ['R', 'help_restart'], ['M', 'help_mute'], ['F1 / H', 'help_help'],
    ];
    rows.forEach(([key, desc], i) => {
      const y = 80 + i * 28;
      const box = this.add.rectangle(230, y, 230, 24, 0x1c2433).setStrokeStyle(2, 0x4a5a78);
      const k = this.add.text(230, y, key, textStyle(10, '#f2c14e')).setOrigin(0.5);
      const d = this.add.text(370, y, t(desc), textStyle(10, '#ffffff')).setOrigin(0, 0.5);
      this.content.add([box, k, d]);
    });
    const rules = this.add.text(GAME_W / 2, 372, t('help_rules'), textStyle(8, '#cfe3ff', {
      align: 'center', wordWrap: { width: 860 }, lineSpacing: 8,
    })).setOrigin(0.5, 0);
    this.content.add(rules);
  }

  legendPage() {
    this.drawLegend([
      ['props', 'coin', 'help_coin'], ['props', 'money_bag', 'help_bag'], ['props', 'question_block', 'help_qblock'],
      ['chars', 'journalist_camera', 'help_journalist'], ['chars', 'detective_idle', 'help_detective'],
      ['chars', 'cop_idle', 'help_cop'], ['props', 'manhole', 'help_manhole'], ['props', 'checkpoint_flag', 'help_checkpoint'],
      ['ui', 'hud_thermo', 'help_heat'], ['props', 'pipe_short', 'help_pipes'],
    ]);
  }

  legendPage2() {
    this.drawLegend([
      ['props', 'chestnut_open', 'help_chestnut'], ['props', 'kapital_book', 'help_book'],
      ['chars', 'oldlady_idle', 'help_oldlady'], ['chars', 'kid_idle', 'help_kid'],
      ['props', 'chestnut_tree', 'hint_tree'], ['props', 'secret_hatch', 'hint_secret'],
    ]);
  }

  consciencePage() {
    this.drawLegend([
      ['ui', 'hud_conscience', 'help_conscience'], ['props', 'conscience_angel', 'help_angel'],
      ['props', 'bottle_whiskey', 'help_whiskey'], ['props', 'bottle_vodka', 'help_vodka'],
      ['props', 'book_open', 'help_voice'],
    ], 'help_title_conscience');
  }

  drawLegend(entries, titleKey = 'help_title_legend') {
    this.title.setText(t(titleKey));
    entries.forEach(([atlas, frame, key], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 70 + col * 450;
      const y = 104 + row * 78;
      if (this.textures.exists(atlas) && this.textures.get(atlas).has(frame)) {
        const img = this.add.image(x + 30, y, atlas, frame);
        const s = Math.min(1, 64 / Math.max(img.width, img.height));
        img.setScale(s);
        this.content.add(img);
      }
      const txt = this.add.text(x + 74, y, t(key), textStyle(8, '#ffffff', { wordWrap: { width: 350 }, lineSpacing: 5 })).setOrigin(0, 0.5);
      this.content.add(txt);
    });
  }

  close() {
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
