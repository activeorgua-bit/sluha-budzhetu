import Phaser from 'phaser';
import { GAME_W, GAME_H, DEPTH } from '../../config/constants.js';

// 4x4 ordered-dither matrix: soft pixel-art gradient without visible bands
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/**
 * Living sky for outdoor levels: a dithered vertical gradient plus two layers of drifting clouds
 * (atlas `clouds`, cut from the bridge sky by tools/make_clouds.py). Screen-fixed like the old sky
 * image; clouds move with the wind and a little with the camera (far layer slower than near one).
 *
 * meta.sky: { top: '#4f9fd8', bottom: '#a9d6ee', clouds: 9, wind: 1, horizon: 0.62 }
 *   horizon = fraction of the screen height where the bottom colour is reached
 */
export class Sky {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    const key = `sky_${scene.meta.id}`;
    if (!scene.textures.exists(key)) this.paint(key);
    scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.parallaxSky);
    this.clouds = [];
    if (scene.textures.exists('clouds')) this.spawnClouds();
  }

  paint(key) {
    const { top, bottom, horizon = 0.62 } = this.cfg;
    const a = Phaser.Display.Color.HexStringToColor(top);
    const b = Phaser.Display.Color.HexStringToColor(bottom);
    const tex = this.scene.textures.createCanvas(key, GAME_W, GAME_H);
    const ctx = tex.getContext();
    const img = ctx.createImageData(GAME_W, GAME_H);
    const STEP = 6;                                   // colour levels per channel step: chunky, retro bands…
    for (let y = 0; y < GAME_H; y++) {
      const t = Math.min(1, y / (GAME_H * horizon));
      const ch = [a.red + (b.red - a.red) * t, a.green + (b.green - a.green) * t, a.blue + (b.blue - a.blue) * t];
      for (let x = 0; x < GAME_W; x++) {
        const d = BAYER[(y & 3) * 4 + (x & 3)];       // …broken up by the dither so no hard line shows
        const i = (y * GAME_W + x) * 4;
        for (let c = 0; c < 3; c++) img.data[i + c] = Math.min(255, Math.floor(ch[c] / STEP + d) * STEP);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    tex.refresh();
  }

  spawnClouds() {
    const s = this.scene;
    const frames = s.textures.get('clouds').getFrameNames().sort((p, q) => +p.split('_')[1] - +q.split('_')[1]);
    const rng = new Phaser.Math.RandomDataGenerator([s.meta.id]);
    const n = this.cfg.clouds ?? 9;
    const wind = this.cfg.wind ?? 1;
    this.span = GAME_W + 480;                         // clouds wrap around this width
    for (let k = 0; k < n; k++) {
      const near = k % 3 === 0;                       // one in three is a big, close cloud
      const frame = near ? frames[rng.between(0, 6)] : frames[rng.between(5, frames.length - 1)];
      const img = s.add.image(0, 0, 'clouds', frame).setOrigin(0.5, 1).setScrollFactor(0)
        .setDepth(DEPTH.parallaxSky + 1 + (near ? 1 : 0)).setAlpha(near ? 0.96 : 0.8);
      if (!near) img.setScale(rng.pick([0.75, 1]));
      this.clouds.push({
        img,
        x0: rng.between(0, this.span),
        y: near ? rng.between(132, 176) : rng.between(104, 150),     // cloud bottoms: in the band above the roofs
        rate: near ? 0.09 : 0.04,                     // camera parallax
        drift: (near ? 7 : 3.5) * wind,               // px per second of wind
      });
    }
  }

  update(time) {
    const cam = this.scene.cameras.main;
    for (const c of this.clouds) {
      const x = Phaser.Math.Wrap(c.x0 + (time / 1000) * c.drift - cam.scrollX * c.rate, 0, this.span) - 240;
      c.img.setPosition(Math.round(x), c.y);
    }
  }
}
