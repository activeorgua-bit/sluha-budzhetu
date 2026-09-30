// Balance test: plays whole campaigns with the play-test bot (tools/balance/bot.js) in headless Chrome
// against a running build of the game, one campaign after another, and writes the results.
//
//   npm run build && npx vite preview --port 4173        (in another terminal)
//   node tools/balance/run.mjs --campaigns "honest:0:honest1,greedy:12:light1" --maxsec 260
//
// Options (all optional):
//   --campaigns  mode:wallet:name, comma-separated. mode = honest | corrupt | greedy (corruption carries
//                over from level to level); wallet = bribes at the start. Default: 4 honest, 3 light, 3 heavy.
//   --levels     level indices to play (default 0-8: the whole game, 1-1 to 3-3)
//   --maxsec     real seconds the bot gets per level (default 260)
//   --url        where the game runs (default http://localhost:4173)
//   --out        results folder (default balance-results): <name>.json per campaign + summary.md
//   --shots      also save a screenshot at the end of every level
//   --renderer   canvas: force the 2D canvas renderer (faster on a machine without a GPU)
// Chrome: the `puppeteer` package if installed (CI), else `puppeteer-core` resolved from
// PUPPETEER_CORE_FROM with the browser at CHROME_PATH (a local Chrome install).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
  return acc;
}, []));
const DEFAULT_CAMPAIGNS = 'honest:0:honest1,greedy:12:light1,greedy:30:heavy1,honest:0:honest2,greedy:12:light2,'
  + 'greedy:30:heavy2,honest:0:honest3,greedy:12:light3,greedy:30:heavy3,honest:0:honest4';
const campaigns = String(args.campaigns || DEFAULT_CAMPAIGNS).split(',').map((c) => {
  const [mode, wallet, name] = c.trim().split(':');
  return { mode, wallet: Number(wallet) || 0, name: name || `${mode}${wallet}` };
});
const levels = String(args.levels || '0,1,2,3,4,5,6,7,8');
const maxsec = Number(args.maxsec || 260);
const url = String(args.url || 'http://localhost:4173');
const out = path.resolve(String(args.out || 'balance-results'));
const shots = !!args.shots;
const renderer = args.renderer === 'canvas' ? '&renderer=canvas' : '';
const fpsSeen = {};
fs.mkdirSync(out, { recursive: true });
const LEVEL_IDS = ['l11', 'l12', 'p21', 'p21b', 'p22', 'p23', 'e31', 'e32', 'e33', 'm11'];
const LEVEL_LABELS = ['1-1', '1-2', '2-1', '2-1B', '2-2', '2-3', '3-1', '3-2', '3-3', '1-1M'];
const LAST_ID = LEVEL_IDS[Number(levels.split(',').pop())];

async function loadPuppeteer() {
  try { return { lib: (await import('puppeteer')).default, exe: undefined }; } catch { /* not installed */ }
  const req = createRequire(process.env.PUPPETEER_CORE_FROM || import.meta.url);
  return { lib: req('puppeteer-core'), exe: process.env.CHROME_PATH };
}

async function playCampaign(puppeteer, c) {
  const body = fs.readFileSync(path.join(HERE, 'bot.js'), 'utf8')
    .replaceAll('__LEVELS__', `[${levels}]`).replaceAll('__MODE__', JSON.stringify(c.mode))
    .replaceAll('__WALLET__', String(c.wallet)).replaceAll('__MAXSEC__', String(maxsec)).replaceAll('__TAG__', c.name);
  const browser = await puppeteer.lib.launch({
    executablePath: puppeteer.exe,
    headless: true,
    protocolTimeout: 6 * 3600 * 1000,
    args: ['--no-sandbox', '--mute-audio', '--window-size=960,540', '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader'],
    defaultViewport: { width: 960, height: 540 },
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.exposeFunction('__shot', async (name) => {
      if (shots) await page.screenshot({ path: path.join(out, `${name}.png`) });
      return name;
    });
    // the bot saves its records after every level, so a crash still leaves the levels played so far
    await page.exposeFunction('__save', async (name, text) => {
      fs.writeFileSync(path.join(out, `${name.replace(/^res_/, '')}.json`), text);
      return true;
    });
    await page.goto(`${url}/?dev=1${renderer}`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu') && window.__dev, { timeout: 120000 });
    // how fast the game really runs here: the bot needs ~30+ fps to hit its jumps
    fpsSeen[c.name] = await page.evaluate(async () => {
      __dev.start(0);
      await new Promise((r) => setTimeout(r, 5000));
      return Math.round(__game.loop.actualFps);
    });
    console.log(`  game runs at ${fpsSeen[c.name]} fps (${renderer ? 'canvas' : 'auto'} renderer)`);
    await page.evaluate(`(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const shot = (n) => window.__shot(n);
      const level = () => __game.scene.getScene('Level');
      const startLevel = async (i) => { __dev.start(i); for (let k = 0; k < 80 && !(level().player && level().sys.settings.status === 5); k++) await sleep(100); await sleep(600); return level(); };
      ${body}
    })()`);
    if (errors.length) console.log(`  page errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
  } catch (e) {
    console.log(`  campaign ${c.name} stopped: ${e.message.split('\n')[0]}`);
  } finally {
    await browser.close().catch(() => {});
  }
}

/** One cell per level: ✔ finished, ✘ where it ended; deaths and the cause. */
function describe(rec) {
  const label = LEVEL_LABELS[LEVEL_IDS.indexOf(rec.level)] || rec.level;
  const causes = (rec.deathsAt || []).map((d) => d.split('@')[0]);
  const died = causes.length ? ` †${causes.length} (${[...new Set(causes)].join(', ')})` : '';
  const end = rec.done ? '✔' : rec.note === 'game over' ? '✘ game over' : `✘ ${rec.note || 'out of time (bot)'}`;
  const money = rec.walletAtBoss !== undefined ? ` [$${rec.walletStart}→boss $${rec.walletAtBoss}${rec.bossBribes ? `, paid ×${rec.bossBribes}` : ''}]` : '';
  return `${label} ${end}${died}${money}`;
}

function summarize() {
  const rows = [];
  for (const c of campaigns) {
    const file = path.join(out, `${c.name}.json`);
    if (!fs.existsSync(file)) { rows.push({ c, recs: [], won: false }); continue; }
    const recs = JSON.parse(fs.readFileSync(file, 'utf8'));
    const last = recs[recs.length - 1];
    rows.push({ c, recs, won: !!last && last.level === LAST_ID && last.done, lives: last ? last.livesLeft : 0 });
  }
  const fps = Object.values(fpsSeen);
  const fpsNote = fps.length ? ` Game speed ${Math.min(...fps)}–${Math.max(...fps)} fps${renderer ? ' (canvas renderer)' : ''}.` : '';
  const slow = fps.length && Math.min(...fps) < 40 ? ['', '> ⚠ The game ran slowly on this machine: the bot misses jumps below ~40 fps, so deaths may be the bot, not the game.'] : [];
  const lines = ['# Balance test', '', `Levels ${levels}, ${maxsec} s per level.${fpsNote} ✔ finished · ✘ where the run ended · † deaths (cause).`, ...slow, '',
    '| campaign | mode | start wallet | result | lives left | levels |', '|---|---|---|---|---|---|'];
  for (const r of rows) {
    const where = r.recs.length ? describe(r.recs[r.recs.length - 1]).split(' ')[0] : '—';
    const result = r.won ? '**won**' : r.recs.length ? `ended at ${where}` : 'no data';
    lines.push(`| ${r.c.name} | ${r.c.mode} | ${r.c.wallet} | ${result} | ${r.lives ?? '—'} | ${r.recs.map(describe).join(' · ')} |`);
  }
  const byMode = {};
  for (const r of rows) {
    const k = r.c.mode === 'honest' ? 'honest' : `corrupt (wallet ${r.c.wallet})`;
    (byMode[k] ||= { won: 0, n: 0 }).n += 1;
    if (r.won) byMode[k].won += 1;
  }
  lines.push('', ...Object.entries(byMode).map(([k, v]) => `- ${k}: won ${v.won} of ${v.n}`));
  const md = lines.join('\n') + '\n';
  fs.writeFileSync(path.join(out, 'summary.md'), md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  return md;
}

const puppeteer = await loadPuppeteer();
for (const c of campaigns) {
  const t0 = Date.now();
  console.log(`▶ ${c.name} (${c.mode}, wallet ${c.wallet})`);
  await playCampaign(puppeteer, c);
  console.log(`  done in ${Math.round((Date.now() - t0) / 60000)} min`);
  summarize();                      // keep summary.md current after every campaign
}
console.log('\n' + summarize());
