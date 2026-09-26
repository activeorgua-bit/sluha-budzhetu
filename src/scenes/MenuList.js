import { textStyle } from '../core/i18n.js';

/**
 * Keyboard + mouse list used by Menu, Pause and SaveLoad.
 * items: [{ label: () => string, action: () => void, enabled?: () => bool }]
 */
export class MenuList {
  constructor(scene, x, y, items, opts = {}) {
    this.scene = scene;
    this.items = items;
    this.cursor = 0;
    this.gap = opts.gap || 28;
    this.size = opts.size || 12;
    this.labels = items.map((it, i) => scene.add.text(x, y + i * this.gap, '', textStyle(this.size, '#fff', { stroke: '#000', strokeThickness: 4 }))
      .setOrigin(0.5).setDepth(opts.depth || 10).setInteractive({ useHandCursor: true })
      .on('pointerover', () => { this.cursor = i; this.refresh(); })
      .on('pointerdown', () => this.activate(i)));
    this.hits = items.map((_, i) => scene.add.zone(x, y + i * this.gap, opts.hitW || 520, this.gap - 2).setDepth(opts.depth || 10)
      .setInteractive().on('pointerover', () => { this.cursor = i; this.refresh(); }).on('pointerdown', () => this.activate(i)));
    const kb = scene.input.keyboard;
    this.handlers = [
      ['keydown-UP', () => this.move(-1)], ['keydown-W', () => this.move(-1)],
      ['keydown-DOWN', () => this.move(1)], ['keydown-S', () => this.move(1)],
      ['keydown-ENTER', () => this.activate(this.cursor)], ['keydown-SPACE', () => this.activate(this.cursor)],
    ];
    for (const [ev, fn] of this.handlers) kb.on(ev, fn);
    this.skipDisabled(1);
    this.refresh();
  }

  enabled(i) { const it = this.items[i]; return !it.enabled || it.enabled(); }

  skipDisabled(dir) {
    for (let n = 0; n < this.items.length && !this.enabled(this.cursor); n++) {
      this.cursor = (this.cursor + dir + this.items.length) % this.items.length;
    }
  }

  move(d) {
    this.cursor = (this.cursor + d + this.items.length) % this.items.length;
    this.skipDisabled(d);
    this.refresh();
  }

  activate(i) {
    if (!this.enabled(i)) return;
    this.cursor = i;
    this.items[i].action();
  }

  refresh() {
    this.items.forEach((it, i) => {
      const sel = i === this.cursor;
      const on = this.enabled(i);
      this.labels[i].setText(`${sel ? '▶ ' : '  '}${it.label()}${sel ? ' ◀' : '  '}`)
        .setColor(!on ? '#666a73' : sel ? '#f2c14e' : '#ffffff');
    });
  }

  destroy() {
    const kb = this.scene.input.keyboard;
    for (const [ev, fn] of this.handlers) kb.off(ev, fn);
    this.labels.forEach((l) => l.destroy());
    this.hits.forEach((h) => h.destroy());
  }
}
