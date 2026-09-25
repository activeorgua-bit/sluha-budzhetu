import { TILE, DEPTH } from '../config/constants.js';
import { parseLevel } from './LevelParser.js';
import { SOLID, ONE_WAY } from './legend.js';

/**
 * Turns a parsed ASCII level into a Phaser tilemap layer (with collision faces) and
 * returns hazard rectangles + the parsed level for entity spawning.
 */
export function buildLevel(scene, text) {
  const level = parseLevel(text);
  const meta = level.meta;
  const world = meta.tileset || 'w1';
  const texKey = scene.textures.exists(`tiles_${world}`) ? `tiles_${world}` : 'tiles_w1';
  const index = scene.cache.json.get(`${texKey}_index`) || scene.cache.json.get('tiles_w1_index');
  const names = index.tiles;
  const has = (n) => names[n] !== undefined;
  const id = (n) => (names[n] ?? 0);

  const solidIds = new Set();
  const oneWayIds = new Set();
  const weakIds = new Set();
  const data = [];
  for (let y = 0; y < level.rows; y++) {
    const rowData = [];
    for (let x = 0; x < level.cols; x++) {
      const ch = level.tiles[y][x];
      const name = resolveTileName(level, x, y, ch, meta, has);
      const idx = name ? id(name) : 0;
      rowData.push(idx);
      if (SOLID.has(ch)) solidIds.add(idx);
      if (ONE_WAY.has(ch)) oneWayIds.add(idx);
      if (ch === '_') weakIds.add(idx);
    }
    data.push(rowData);
  }

  // decorative railings above one-way balcony platforms (family `<oneway>_rail_{l,m,r}`)
  const fam = meta.oneway;
  if (fam && has(`${fam}_rail_l`)) {
    for (let y = 1; y < level.rows; y++) for (let x = 0; x < level.cols; x++) {
      if (level.tiles[y][x] !== '-' || level.tiles[y - 1][x] !== '.' || data[y - 1][x] !== 0) continue;
      const first = !sameAt(level, x - 1, y, '-');
      const last = !sameAt(level, x + 1, y, '-');
      const pos = first ? 'l' : (last ? 'r' : 'm');
      data[y - 1][x] = id(has(`${fam}_rail_${pos}`) ? `${fam}_rail_${pos}` : `${fam}_rail_l`);
    }
  }

  const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
  const tileset = map.addTilesetImage(texKey, texKey, TILE, TILE, 0, 0);
  const layer = map.createLayer(0, tileset, 0, 0);
  layer.setDepth(DEPTH.tiles);
  layer.setCollision([...solidIds].filter((i) => i > 0), true, false);
  layer.forEachTile((tile) => {
    if (oneWayIds.has(tile.index) && tile.index > 0) tile.setCollision(false, false, true, false, false);
  });
  layer.calculateFacesWithin(0, 0, map.width, map.height);

  const hazards = collectHazards(level);
  return {
    level, meta, map, layer, hazards, weakIds, texKey,
    widthPx: level.cols * TILE, heightPx: level.rows * TILE,
  };
}

function solidAt(level, x, y) {
  if (y < 0 || y >= level.rows || x < 0 || x >= level.cols) return true;
  return SOLID.has(level.tiles[y][x]);
}

function sameAt(level, x, y, ch) {
  if (y < 0 || y >= level.rows || x < 0 || x >= level.cols) return false;
  return level.tiles[y][x] === ch;
}

const FALLBACK = {
  tl: ['tl', 't'], tr: ['tr', 't'], t: ['t'],
  l: ['l', 'c'], r: ['r', 'c'], c: ['c'],
  bl: ['bl', 'l', 'b', 'c'], br: ['br', 'r', 'b', 'c'], b: ['b', 'c'],
};

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return h ^ (h >>> 16);
}

/** 9-slice autotile with fallbacks and variants: t2 (1 in 4 tops), c2 every 6th column right under
 *  the surface (X braces like the mockup), c3/c4 scattered. */
function autotile(level, x, y, mat, has) {
  const same = (xx, yy) => solidAt(level, xx, yy);
  const up = same(x, y - 1);
  const down = same(x, y + 1);
  const left = same(x - 1, y);
  const right = same(x + 1, y);
  const v = !up ? 't' : (!down ? 'b' : '');
  const h = !left ? 'l' : (!right ? 'r' : '');
  const key = v && h ? `${v}${h}` : (v || h || 'c');
  const hv = hash2(x, y);
  for (const k of FALLBACK[key]) {
    if (!has(`${mat}_${k}`)) continue;
    if (k === 't' && has(`${mat}_t2`) && hv % 4 === 0) return `${mat}_t2`;
    if (k === 'c') {
      const depth = !same(x, y - 2) ? 1 : 2; // 1 = right under the surface row
      if (depth === 1 && x % 6 === 3 && has(`${mat}_c2`)) return `${mat}_c2`;
      if (hv % 13 === 0 && has(`${mat}_c3`)) return `${mat}_c3`;
      if (hv % 7 === 0 && has(`${mat}_c4`)) return `${mat}_c4`;
    }
    return `${mat}_${k}`;
  }
  return null;
}

function resolveTileName(level, x, y, ch, meta, has) {
  const par = x % 2 ? 'r' : 'l';
  switch (ch) {
    case '#':
    case '@': {
      let mat = ch === '#' ? (meta.material || 'stone') : (meta.material2 || meta.material || 'steel');
      // meta.materialZones: [{ from, to, ch, mat }] — e.g. the red sport-court surface in the district
      for (const z of meta.materialZones || []) if (z.ch === ch && x >= z.from && x < z.to) mat = z.mat;
      const up = solidAt(level, x, y - 1);
      // deep ground (two or more solid rows above) shows the level's subsoil texture
      if (meta.subsoil && up && solidAt(level, x, y - 2) && has(meta.subsoil)) return meta.subsoil;
      const auto = autotile(level, x, y, mat, has);
      if (auto) return auto;
      const base = !up ? `${mat}_top_${par}` : `${mat}_fill_${par}`;
      if (has(base)) return base;
      const fb = !up ? `stone_top_${par}` : `stone_fill_${par}`;
      return has(fb) ? fb : 'brick_block';
    }
    case 'g': return autotile(level, x, y, 'granite', has) || 'metal_block';
    case 'e': return autotile(level, x, y, 'hedge', has) || 'crate';
    case '=': return 'brick_block';
    case '[': return 'metal_block';
    case 'x': return 'crate';
    case 'w': return 'wood_box';
    case '%': {
      const up = sameAt(level, x, y - 1, '%');
      const n = `scaffold_${up ? 'fill' : 'top'}_${par}`;
      return has(n) ? n : null;
    }
    case '-':
    case '_': {
      // one-way platforms: the level's `oneway` family (balcony, bench, glass_plat …) with
      // left / middle / right pieces when the tileset has them, else wood planks
      const fam = ch === '_' && has('rebar_plat_l') ? 'rebar_plat' : (meta.oneway || 'wood_plat');
      const first = !sameAt(level, x - 1, y, ch);
      const last = !sameAt(level, x + 1, y, ch);
      const pos = first ? 'l' : (last ? 'r' : (has(`${fam}_m`) ? 'm' : par));
      if (has(`${fam}_${pos}`)) return `${fam}_${pos}`;
      if (has(`${fam}_${par}`)) return `${fam}_${par}`;
      return has(`wood_plat_${par}`) ? `wood_plat_${par}` : 'brick_block';
    }
    case '~': return sameAt(level, x, y - 1, '~') ? 'water_fill' : 'water_top';
    case '^': return 'spike';
    case '|': return sameAt(level, x, y - 1, '|') ? 'ladder_mid' : 'ladder_top';
    default: return null;
  }
}

/** Merge runs of hazard tiles into rectangles (world px). Water only hurts at its surface row. */
function collectHazards(level) {
  const out = [];
  for (let y = 0; y < level.rows; y++) {
    let x = 0;
    while (x < level.cols) {
      const ch = level.tiles[y][x];
      const isSpike = ch === '^';
      const isWaterTop = ch === '~' && !sameAt(level, x, y - 1, '~');
      if (!isSpike && !isWaterTop) { x++; continue; }
      let len = 1;
      while (x + len < level.cols && level.tiles[y][x + len] === ch
        && (isSpike || !sameAt(level, x + len, y - 1, '~'))) len++;
      if (isSpike) out.push({ kind: 'spike', x: x * TILE + 6, y: y * TILE + 18, w: len * TILE - 12, h: TILE - 18 });
      else out.push({ kind: 'water', x: x * TILE, y: y * TILE + 15, w: len * TILE, h: TILE - 15 });
      x += len;
    }
  }
  return out;
}
