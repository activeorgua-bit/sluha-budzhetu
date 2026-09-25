import { ENTITY_CHARS, GATED_TIER, SIGN_CHARS, TILE_CHARS, SOLID, ONE_WAY, HAZARD } from './legend.js';

/**
 * Parse an ASCII level file (pure JS, no Phaser — shared with tools/validate_levels.mjs).
 *
 * File layout:
 *   { ...json frontmatter... }
 *   ===map
 *   <rows>
 *   ===decor          (optional)
 *   <rows>
 */
export function parseLevel(text) {
  const sections = splitSections(text);
  const meta = JSON.parse(sections.head.trim() || '{}');
  const mapRows = normalizeRows(sections.map);
  const rows = mapRows.length;
  const cols = Math.max(...mapRows.map((r) => r.length));
  const grid = mapRows.map((r) => r.padEnd(cols, '.').split(''));
  const decorRows = sections.decor ? normalizeRows(sections.decor) : [];
  const decor = [];
  for (let y = 0; y < rows; y++) {
    const r = (decorRows[y] || '').padEnd(cols, '.');
    for (let x = 0; x < cols; x++) {
      const ch = r[x];
      if (ch !== '.' && ch !== ' ' && meta.decor && meta.decor[ch]) {
        // "A": "lamp_park"  or  "D": {"frame": "pipe_short", "solid": "full", "w": 2, "top": 2}
        // w = width in tiles (anchor column = left edge), top = walkable surface height in tiles
        const def = meta.decor[ch];
        decor.push({ ...(typeof def === 'string' ? { frame: def } : def), col: x, row: y });
      }
    }
  }

  const objects = [];
  const used = new Set();
  const key = (x, y) => `${x},${y}`;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x];
      if (used.has(key(x, y))) continue;
      if (ch === 'B') {
        let len = 0;
        while (x + len < cols && grid[y][x + len] === 'B') { used.add(key(x + len, y)); len++; }
        objects.push({ type: 'bridge', col: x, row: y, len });
      } else if (ch === 'H') {
        let depth = 0;
        while (y + 1 + depth < rows && grid[y + 1 + depth][x] === ',') depth++;
        objects.push({ type: 'hook', col: x, row: y, depth: Math.max(1, depth) });
      } else if (ch === 'm') {
        let end = x;
        while (end + 1 < cols && grid[y][end + 1] !== '*' && end - x < 40) end++;
        if (grid[y][end + 1] === '*') end += 1;
        objects.push({ type: 'mover', col: x, row: y, toCol: end, toRow: y });
      } else if (ch === 'n') {
        let end = y;
        while (end + 1 < rows && grid[end + 1][x] === ':') end++;
        objects.push({ type: 'mover', col: x, row: y, toCol: x, toRow: end });
      } else if (SIGN_CHARS.has(ch)) {
        objects.push({ type: 'sign', col: x, row: y, index: Number(ch) - 1 });
      } else if (ENTITY_CHARS[ch]) {
        const o = { type: ENTITY_CHARS[ch], col: x, row: y, char: ch };
        if (GATED_TIER[ch] !== undefined) o.gateTier = GATED_TIER[ch];
        objects.push(o);
      }
    }
  }

  // tile matrix keeps only tile chars ('.' elsewhere) so builders/validators share one view
  const tiles = grid.map((r) => r.map((ch) => (TILE_CHARS.has(ch) ? ch : '.')));

  return { meta, cols, rows, grid, tiles, decor, objects };
}

export function isSolidChar(ch) { return SOLID.has(ch); }
export function isOneWayChar(ch) { return ONE_WAY.has(ch); }
export function isHazardChar(ch) { return HAZARD.has(ch); }

function splitSections(text) {
  const out = { head: '', map: '', decor: '' };
  let cur = 'head';
  for (const line of text.replace(/\r/g, '').split('\n')) {
    if (line.startsWith('===')) {
      const name = line.slice(3).trim().toLowerCase();
      cur = name === 'decor' ? 'decor' : 'map';
      continue;
    }
    out[cur] += line + '\n';
  }
  return out;
}

function normalizeRows(block) {
  const rows = block.split('\n');
  while (rows.length && rows[rows.length - 1].trim() === '') rows.pop();
  while (rows.length && rows[0].trim() === '') rows.shift();
  return rows;
}
