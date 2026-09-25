// Reachability over a parsed level (shared by tools/validate_levels.mjs and the play-test bot).
//
// Jump limits come from the real physics (BALANCE.player: speed 390 px/s, jump -735 px/s, gravity
// 1470 px/s², 48 px tiles) with one tile of safety margin:
//   honest  (empty wallet, full speed):            rise 0..3 tiles -> gap 7, 6, 5, 4
//   corrupt (wallet 25: -11% speed, -5.5% jump):   rise 0..3 tiles -> gap 5, 5, 4, 3
// A "gap" is the horizontal distance in tiles between the take-off and the landing cell.
import { SOLID, ONE_WAY, HAZARD } from './legend.js';

export const JUMP_TABLE = { honest: [7, 6, 5, 4], corrupt: [5, 5, 4, 3] };
const MAX_DROP = 14;

/**
 * mode: 'honest' (pickup cells forbidden, full jump) | 'corrupt' (everything allowed, greedy jump).
 * Returns { ok, reason, reach, parent } — parent[y][x] = { x, y, kind: 'walk'|'fall'|'jump', rise, gap }.
 */
export function analyse(level, mode = 'honest', from = null) {
  const honest = mode === 'honest';
  const gaps = JUMP_TABLE[honest ? 'honest' : 'corrupt'];
  const { cols, rows, tiles, objects } = level;
  const grid = () => Array.from({ length: rows }, () => new Array(cols).fill(false));
  const support = grid(); const blocked = grid(); const forbidden = grid();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const ch = tiles[y][x];
    if (SOLID.has(ch)) { support[y][x] = true; blocked[y][x] = true; }
    if (ONE_WAY.has(ch)) support[y][x] = true;
    if (HAZARD.has(ch)) blocked[y][x] = true;
  }
  const markSolid = (row, col, w, top, kind) => {
    const topRows = Math.max(1, Math.ceil(top ?? 1));
    const surface = row - topRows + 1;
    for (let x = Math.max(0, col); x < col + w && x < cols; x++) {
      if (surface >= 0) support[surface][x] = true;
      if (kind === 'full') for (let y = surface; y <= row; y++) if (y >= 0) { blocked[y][x] = true; support[y][x] = true; }
    }
  };
  for (const d of level.decor || []) {
    if (d.solid) markSolid(d.row, d.col, d.w || 1, d.top, d.solid);
    for (const p of d.solids || []) markSolid(d.row, d.col + (p.dx || 0), p.w || 1, p.top, p.solid || 'full');
  }
  for (const o of objects) {
    if (o.type === 'bridge') for (let i = 0; i < o.len; i++) support[o.row][o.col + i] = true;
    if (o.type === 'mover') {
      const x0 = Math.min(o.col, o.toCol), x1 = Math.max(o.col, o.toCol);
      const y0 = Math.min(o.row, o.toRow), y1 = Math.max(o.row, o.toRow);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        support[y][x] = true;
        if (x + 1 < cols) support[y][x + 1] = true;
      }
    }
    if (o.type === 'question_block') { blocked[o.row][o.col] = true; support[o.row][o.col] = true; }
    if (honest && (o.type === 'coin' || o.type === 'trap' || o.type === 'money_bag')) {
      for (let dy = 0; dy <= 2; dy++) if (o.row - dy >= 0) forbidden[o.row - dy][o.col] = true;
    }
  }
  const free = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows && !blocked[y][x] && !forbidden[y][x];
  const standable = (x, y) => free(x, y) && free(x, y - 1) && y + 1 < rows && support[y + 1][x];
  const start = from || objects.find((o) => o.type === 'player');
  const goal = objects.find((o) => o.type === 'goal');
  const checkpoints = objects.filter((o) => o.type === 'checkpoint');
  if (!start || !goal) return { ok: false, reason: 'missing P or G', reach: null, parent: null };

  // Dijkstra: walking costs 1 per tile, a jump costs 3 + its length, so routes walk where they can
  // (like a player) and jump only over obstacles. seen = reachable; parent = how each cell is reached.
  const seen = grid();
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(Infinity));
  const parent = Array.from({ length: rows }, () => new Array(cols).fill(null));
  const heap = [];
  const hpush = (d, x, y) => {
    heap.push([d, x, y]);
    let i = heap.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
  };
  const hpop = () => {
    const top = heap[0]; const last = heap.pop();
    if (heap.length) {
      heap[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
      }
    }
    return top;
  };
  dist[start.row][start.col] = 0;
  seen[start.row][start.col] = true;
  hpush(0, start.col, start.row);
  const relax = (x, y, from, d, kind, rise = 0, gap = 0, peak = 0) => {
    if (!standable(x, y) || d >= dist[y][x]) return;
    dist[y][x] = d; seen[y][x] = true;
    parent[y][x] = { x: from[0], y: from[1], kind, rise, gap, peak };
    hpush(d, x, y);
  };
  while (heap.length) {
    const [d0, x, y] = hpop();
    if (d0 > dist[y][x]) continue;
    const cur = [x, y];
    for (const dx of [-1, 1]) {
      const nx = x + dx;
      if (!free(nx, y) || !free(nx, y - 1)) continue;
      relax(nx, y, cur, d0 + 1, 'walk');
      if (!standable(nx, y)) {
        for (let d = 1; d <= MAX_DROP && y + d < rows; d++) {
          if (!free(nx, y + d) || !free(nx, y + d - 1)) break;
          if (standable(nx, y + d)) { relax(nx, y + d, cur, d0 + 1 + d * 0.2, 'fall', -d, dx, 0); break; }
        }
      }
    }
    for (let rise = 0; rise < gaps.length; rise++) {
      let clearUp = true;
      for (let r = 1; r <= rise; r++) if (!free(x, y - r) || !free(x, y - r - 1)) { clearUp = false; break; }
      if (!clearUp) break;
      for (const dir of [-1, 1]) {
        for (let g = 0; g <= gaps[rise]; g++) {
          const nx = x + dir * g;
          const ny = y - rise;
          if (!free(nx, ny) || !free(nx, ny - 1)) break;
          const cost = d0 + 3 + g + rise;
          if (standable(nx, ny)) relax(nx, ny, cur, cost, 'jump', rise, dir * g, rise);
          // landing lower after the apex
          for (let d = 1; d <= MAX_DROP && ny + d < rows; d++) {
            if (!free(nx, ny + d) || !free(nx, ny + d - 1)) break;
            if (standable(nx, ny + d)) { relax(nx, ny + d, cur, cost + d * 0.2, 'jump', rise - d, dir * g, rise); break; }
          }
        }
      }
    }
  }
  const at = (o) => seen[o.row][o.col] || seen[Math.min(rows - 1, o.row + 1)][o.col] || seen[Math.max(0, o.row - 1)][o.col];
  const missed = checkpoints.filter((c) => !at(c));
  const ok = at(goal) && missed.length === 0;
  return {
    ok, reach: seen, parent, goal,
    reason: ok ? '' : (!at(goal) ? 'goal unreachable' : `checkpoints unreachable: ${missed.map((c) => c.col).join(',')}`),
  };
}

/** Cell path (start -> target) from an analyse() result, each step with how it is reached. */
export function pathTo(result, tx, ty) {
  const { parent, reach } = result;
  let cell = null;
  for (const [x, y] of [[tx, ty], [tx, ty + 1], [tx, ty - 1]]) if (reach[y] && reach[y][x]) { cell = [x, y]; break; }
  if (!cell) return null;
  const out = [];
  let [x, y] = cell;
  while (parent[y][x]) {
    const p = parent[y][x];
    out.push({ x, y, kind: p.kind, rise: p.rise, gap: p.gap, peak: p.peak });
    [x, y] = [p.x, p.y];
  }
  out.push({ x, y, kind: 'start' });
  return out.reverse();
}
