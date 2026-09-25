// Honest-path validator for ASCII levels (shares LevelParser.js with the game).
//
//   node tools/validate_levels.mjs            # all levels in src/levels/ascii
//   node tools/validate_levels.mjs l12_bridge # one level
//
// Two reachability passes over the tile grid with a physics jump model (src/levels/Reach.js):
//   corrupt: every cell is allowed, jumps are shorter (a heavy wallet slows you).
//   honest : coin / money bag / question-block cells and the two cells above them are forbidden,
//            so a zero-pickup route must exist from P to G (via every checkpoint).
// Support cells: solid tiles, one-way platforms, bridge segments, and every cell of a mover's path.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseLevel } from '../src/levels/LevelParser.js';
import { SOLID } from '../src/levels/legend.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'src', 'levels', 'ascii');
import { analyse as reachAnalyse } from '../src/levels/Reach.js';

// Jump limits come from the real physics (see src/levels/Reach.js JUMP_TABLE).
const analyse = (level, honest) => reachAnalyse(level, honest ? 'honest' : 'corrupt');

function coinsReachable(level, reach) {
  const out = [];
  for (const o of level.objects) {
    if (o.type !== 'coin' && o.type !== 'trap' && o.type !== 'money_bag') continue;
    let hit = false;
    for (let dy = -1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) {
      const y = o.row + dy, x = o.col + dx;
      if (reach[y] && reach[y][x]) hit = true;
    }
    if (!hit) out.push(`${o.type}@${o.col},${o.row}`);
  }
  return out;
}

const only = process.argv[2];
let failed = 0;
// Ground-standing decor (planters, benches, pipes, kiosks...) must have solid ground under every
// column it covers; only balconies and ceiling decor (chandeliers, disco balls) hang in the air.
function decorOverhangs(level) {
  const bad = [];
  for (const d of level.decor || []) {
    if (/^(balcony|chandelier|disco_ball|lamp_hanging|banner|poster|lenin_shelf|gas_mask|window|trident_panel|vote_screen|wave_rail)/.test(String(d.frame || ''))) continue;   // hangs on a wall / ceiling
    const below = d.row + 1;
    if (below >= level.rows) continue;
    for (let x = d.col; x < d.col + (d.w || 1); x++) {
      if (x >= level.cols || !SOLID.has(level.tiles[below][x])) { bad.push(`${d.frame}@${d.col},${d.row}`); break; }
    }
  }
  return bad;
}

for (const f of readdirSync(dir).filter((n) => n.endsWith('.txt')).sort()) {
  if (only && !f.startsWith(only)) continue;
  const level = parseLevel(readFileSync(path.join(dir, f), 'utf8'));
  const corrupt = analyse(level, false);
  const honest = analyse(level, true);
  const unreachableCoins = corrupt.reach ? coinsReachable(level, corrupt.reach) : [];
  const traps = level.objects.filter((o) => o.type === 'trap').length;
  const coins = level.objects.filter((o) => ['coin', 'trap', 'money_bag', 'question_block'].includes(o.type)).length;
  const overhangs = decorOverhangs(level);
  const status = corrupt.ok && honest.ok && !overhangs.length ? 'OK ' : 'FAIL';
  if (status === 'FAIL') failed++;
  console.log(`${status} ${f.padEnd(20)} ${level.cols}x${level.rows}  pickups=${coins} traps=${traps}` +
    `  corrupt:${corrupt.ok ? 'ok' : corrupt.reason}  honest:${honest.ok ? 'ok' : honest.reason}` +
    (unreachableCoins.length ? `  [warn] unreachable pickups: ${unreachableCoins.join(' ')}` : '') +
    (overhangs.length ? `  decor over a gap: ${overhangs.join(' ')}` : ''));
}
process.exit(failed ? 1 : 0);
