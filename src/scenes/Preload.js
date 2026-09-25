import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { LEVELS, STORY } from '../config/levels.js';
import { textStyle } from '../core/i18n.js';

// Raw level files are bundled by Vite; new maps only need to be dropped into levels/ascii.
const LEVEL_FILES = import.meta.glob('../levels/ascii/*.txt', { query: '?raw', import: 'default', eager: true });

export function levelText(file) {
  return LEVEL_FILES[`../levels/ascii/${file}.txt`];
}

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    const missing = [];
    this.load.on('loaderror', (file) => missing.push(file.key));

    const bar = this.add.rectangle(GAME_W / 2, GAME_H / 2, 400, 12, 0x333944).setStrokeStyle(2, 0xf2c14e);
    const fill = this.add.rectangle(GAME_W / 2 - 198, GAME_H / 2, 0, 8, 0xf2c14e).setOrigin(0, 0.5);
    this.load.on('progress', (p) => { fill.width = 396 * p; });

    this.load.setPath('assets');
    this.load.atlas('chars', 'atlases/chars.png', 'atlases/chars.json');
    this.load.atlas('props', 'atlases/props.png', 'atlases/props.json');
    this.load.atlas('ui', 'atlases/ui.png', 'atlases/ui.json');
    this.load.json('anims', 'atlases/anims.json');
    this.load.image('tiles_w1', 'tilesets/w1.png');
    this.load.json('tiles_w1_index', 'tilesets/w1.json');

    // Optional files (later tilesets, parallax layers, story cards) are only requested when the
    // manifest written by tools/pack_atlas.py lists them — the dev server would otherwise answer
    // index.html for a missing path and the JSON loader would throw.
    this.load.json('manifest', 'manifest.json');
    this.load.once('filecomplete-json-manifest', (_key, _type, manifest) => {
      const files = new Set((manifest && manifest.files) || []);
      const want = (path) => files.has(path);
      // every packed tileset (w2, w3, k1 street, b1 bridge, p1 park/bunker, r1 parliament, ...)
      const worlds = [...files].map((f) => /^tilesets\/(\w+)\.png$/.exec(f)).filter(Boolean).map((m) => m[1]);
      for (const w of worlds.filter((x) => x !== 'w1')) {
        if (want(`tilesets/${w}.png`) && want(`tilesets/${w}.json`)) {
          this.load.image(`tiles_${w}`, `tilesets/${w}.png`);
          this.load.json(`tiles_${w}_index`, `tilesets/${w}.json`);
        }
      }
      for (const lvl of LEVELS) {
        const text = levelText(lvl.file);
        if (!text) continue;
        try {
          const meta = JSON.parse(text.split('===')[0]);
          for (const layer of meta.parallax || []) {
            const name = layer.key.replace(`${meta.id}_`, '');
            const path = `parallax/${meta.id}/${name}.png`;
            if (want(path)) this.load.image(layer.key, path);
          }
        } catch { /* bad frontmatter is reported by the parser later */ }
      }
      const cards = new Set();
      for (const seq of Object.values(STORY)) for (const c of seq) { cards.add(c.image); if (c.alt) cards.add(c.alt); }
      for (const img of cards) if (want(`story/${img}.png`)) this.load.image(img, `story/${img}.png`);
      if (want('story/title.png')) this.load.image('title', 'story/title.png');
    });

    this.load.on('complete', () => { this.missing = missing; bar.destroy(); fill.destroy(); });
  }

  create() {
    // register animation clips from anims.json (only clips whose atlas frames exist)
    const clips = this.cache.json.get('anims') || {};
    for (const [key, clip] of Object.entries(clips)) {
      if (this.anims.exists(key)) continue;
      const frames = clip.frames
        .filter((f) => this.textures.exists(clip.atlas) && this.textures.get(clip.atlas).has(f))
        .map((f) => ({ key: clip.atlas, frame: f }));
      if (!frames.length) continue;
      this.anims.create({ key, frames, frameRate: clip.fps, repeat: clip.repeat });
    }
    // Missing files are reported, never fatal: story cards and W2/W3 tilesets arrive with
    // later generation batches, and every consumer checks textures.exists() first.
    const missing = this.missing || [];
    const critical = missing.filter((k) => ['chars', 'props', 'ui', 'tiles_w1', 'anims'].includes(k));
    if (missing.length) console.warn('[preload] missing assets:', missing.join(', '));
    if (critical.length) {
      this.add.text(8, 8, `Missing critical assets: ${critical.join(', ')}\nRun: npm run assets:slice && npm run assets:pack`,
        textStyle(8, '#ff6b6b', { wordWrap: { width: GAME_W - 16 } })).setDepth(1000);
      return;
    }
    this.scene.start('Menu');
  }
}
