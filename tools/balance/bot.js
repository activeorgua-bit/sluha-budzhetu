// Play-test bot (runs inside the page through tools/balance/run.mjs). Plays levels with real key presses:
// follows the route from src/levels/Reach.js, jumps with a real hold time, shakes chestnut trees,
// throws chestnuts at bosses (and at rats), pays enemies off in a corrupt run, answers the mafia's offer.
// No invulnerability, no teleports.
// Placeholders filled by tools/balance/run.mjs: __LEVELS__ (array of level indices), __MODE__
// ('honest' | 'corrupt' | 'greedy' = corrupt with corruption carried from level to level),
// __WALLET__ (bribes in the wallet at the start), __MAXSEC__ (real seconds per level), __TAG__ (result name).
const R = __dev.reach;
const G = __dev.GameState;
const K = { left: ['ArrowLeft', 37], right: ['ArrowRight', 39], jump: ['Space', 32], nut: ['KeyK', 75], e: ['KeyE', 69], cash: ['KeyJ', 74] };
const down = {};
const press = (k, on) => { if (!!down[k] === on) return; down[k] = on; __dev.key(K[k][0], K[k][1], on); };
const tap = async (k, ms = 90) => { press(k, true); await sleep(ms); press(k, false); };
const releaseAll = () => { for (const k of Object.keys(K)) press(k, false); };
const MODE = __MODE__;
const results = []; globalThis.__log = [];
G.events.on('extra-life', ({ source }) => { if (source === 'letter') G.lettersGot = (G.lettersGot || 0) + 1; });

for (const idx of __LEVELS__) {
  let L = await startLevel(idx);
  if (MODE === 'corrupt') { G.corruption = __WALLET__ * 1.6; G.wallet = __WALLET__; G.cleanRun = false; G.emit(); }
  // greedy: one continuous career, corruption carries over from level to level (set once at the start)
  if (MODE === 'greedy') {
    if (idx === __LEVELS__[0]) { globalThis.__carry = { corruption: __WALLET__ * 1.6, wallet: __WALLET__ }; }
    G.corruption = globalThis.__carry.corruption; G.wallet = globalThis.__carry.wallet; G.cleanRun = false;
    if (globalThis.__carry.mafiaChoice) G.mafiaChoice = globalThis.__carry.mafiaChoice;
    G.emit();
  }
  if (globalThis.__ammo) { G.chestnuts = globalThis.__ammo.chestnuts; G.books = globalThis.__ammo.books; G.emit(); }
  // campaign: lives and score carry over (extra lives from letters and score count)
  if (globalThis.__camp) { G.lives = globalThis.__camp.lives; G.score = globalThis.__camp.score; G.nextLifeAt = globalThis.__camp.nextLifeAt; if (!['l11', 'p21', 'e31'].includes(L.def.id)) G.reputation = globalThis.__camp.reputation ?? 100; G.emit(); }   // a new world refills it (as in the game)
  const livesAt = G.lives;
  const rec = { level: L.def.id, mode: MODE, deaths: 0, hits: 0, stuck: 0, replans: 0, done: false, secs: 0, note: '' };
  rec.livesAtStart = G.lives;
  const origHurt = L.player.constructor.prototype.hurt;
  rec.hitBy = {}; rec.deathsAt = [];
  L.player.constructor.prototype.hurt = function (...a) { const r = origHurt.apply(this, a); if (r) { rec.hits += 1; rec.hitBy[a[1] || 'hit'] = (rec.hitBy[a[1] || 'hit'] || 0) + 1; } return r; };
  const origKill = L.constructor.prototype.killPlayer;
  L.constructor.prototype.killPlayer = function (reason) {
    if (!this.player.dead && !this.finished) rec.deathsAt.push(`${reason}@${Math.floor(this.player.x / 48)}`);
    return origKill.call(this, reason);
  };
  const t0 = performance.now();
  let path = null; let i = 1; let lastProgress = performance.now(); let lastCell = '';
  let jumpUntil = 0; let steerTo = null; let throwAt = 0; let shaken = new Set(); let lastLives = G.lives; let replanFails = 0;

  const plan = () => {
    L = level();
    const P = L.player;
    const cx = Math.floor(P.x / 48);
    const cy = Math.floor((P.body.bottom - 30) / 48);
    const res = R.analyse(L.level, MODE === 'honest' ? 'honest' : 'corrupt', { col: cx, row: cy });
    const goal = L.level.objects.find((o) => o.type === 'goal');
    path = res.reach ? R.pathTo(res, goal.col, goal.row) : null;
    i = 1; rec.replans += 1;
    if (!path) replanFails += 1; else replanFails = 0;
  };

  while ((performance.now() - t0) / 1000 < __MAXSEC__) {
    await sleep(30);
    // scene transitions: choices, cut scenes, finishing
    if (__game.scene.isActive('Choice')) { __game.scene.getScene('Choice').menu.activate(MODE === 'honest' ? 1 : 0); await sleep(300); continue; }
    if (__game.scene.isActive('GameOver')) { rec.note = 'game over'; rec.deaths = rec.deathsAt.length; break; }
    L = level();
    if (!L || !L.player || L.sys.settings.status !== 5) {
      if (__game.scene.isActive('Story') || __game.scene.isActive('Finale')) { rec.done = true; rec.note = 'cut scene / finale'; break; }
      continue;
    }
    if (L.def.id !== rec.level) { rec.done = true; break; }       // next level started
    if (L.finished) {
      if (L.player.dead) { await sleep(200); continue; }
      rec.done = true; await sleep(1500); break;
    }
    const P = L.player;
    if (G.lives < lastLives) { rec.trail = (rec.trail || []).concat([globalThis.__log.slice(-14).join(' | ')]); rec.deaths += lastLives - G.lives; lastLives = G.lives; path = null; releaseAll(); await sleep(1500); continue; }
    if (P.dead) { releaseAll(); continue; }
    if (!path) { plan(); if (!path) { if (replanFails > 20) { rec.note = 'no route from here'; break; } await sleep(200); continue; } }

    const now = performance.now();
    const onGround = P.body.blocked.down || P.body.touching.down;
    const cx = Math.floor(P.x / 48);
    const cy = Math.floor((P.body.bottom - 30) / 48);

    // boss: stand and throw chestnuts while in range
    const B = L.boss;
    if (B && !B.defeated && B.awake && Math.abs(B.x - P.x) < 620) {
      const ammo = G.chestnuts + G.books;
      // a corrupt politician out of chestnuts simply pays the boss off (when the boss takes bribes)
      if (MODE !== 'honest' && ammo === 0 && G.wallet >= 8 && now > throwAt && onGround && Math.abs(B.x - P.x) < 400) {
        const dir = Math.sign(B.x - P.x) || 1;
        press('left', dir < 0); press('right', dir > 0); await sleep(40); press('left', false); press('right', false);
        await tap('cash'); throwAt = now + 900; rec.bossBribes = (rec.bossBribes || 0) + 1;
        continue;
      }
      if (ammo > 0 && now > throwAt && onGround) {
        const dir = Math.sign(B.x - P.x) || 1;
        press('left', dir < 0); press('right', dir > 0); await sleep(40); press('left', false); press('right', false);
        await tap('nut'); throwAt = now + 320;
        // step back from the boss when he comes close
        if (Math.abs(B.x - P.x) < 150) { press(dir > 0 ? 'left' : 'right', true); await sleep(250); releaseAll(); }
        continue;
      }
    }
    // ordinary enemies in the way: an honest politician throws chestnuts, a corrupt one pays them off
    // (rats take no money: chestnuts for them too)
    if (now > throwAt && onGround && !(B && B.awake && !B.defeated)) {
      const threat = L.enemies.getChildren().find((e) => e.active && !e.leaving && !e.isBoss && !e.harmless
        && Math.abs(e.y - P.y) < 70 && Math.abs(e.x - P.x) < 280 && Math.abs(e.x - P.x) > 30 && (e.__botThrows || 0) < 3);
      if (threat) {
        const dir = Math.sign(threat.x - P.x) || 1;
        const pay = MODE !== 'honest' && !threat.bribeProof && G.wallet >= 13;   // keep 8 for the boss
        const ammo = G.chestnuts + G.books;
        // keep a reserve for the bosses; a rat at your heels is always worth a chestnut
        // (an honest player only bothers with rats; the rest of the ammo is for the bosses)
        const spare = threat.type === 'rat' ? ammo > 0 && Math.abs(threat.x - P.x) < 160 : MODE !== 'honest' && ammo > 12;
        if (pay || spare) {
          if (P.facing !== dir) { press('left', dir < 0); press('right', dir > 0); await sleep(40); press('left', false); press('right', false); }
          threat.__botThrows = (threat.__botThrows || 0) + 1;
          await tap(pay ? 'cash' : 'nut');
          throwAt = now + (pay ? 700 : 400);
          rec[pay ? 'cashThrown' : 'nutsThrown'] = (rec[pay ? 'cashThrown' : 'nutsThrown'] || 0) + 1;
          continue;
        }
      }
    }
    if (L.trees && G.chestnuts < 20) {
      for (const tr of L.trees) {
        // shake until the tree is empty (a careful player stocks up); wait out the tree cooldown between shakes
        while (tr.shakesLeft > 0 && tr.near(L.player) && G.chestnuts < 20 && !L.player.dead) { releaseAll(); await tap('e'); await sleep(1300); }
      }
    }
    // search a hidden stash on the way (E): a first-aid kit pops out
    for (const st of L.stashes || []) if (st.near(P) && onGround) { releaseAll(); await tap('e'); await sleep(900); }
    // buy a ticket at the station
    if (L.meta.goal === 'train' && !G.hasTicket) {
      for (const sh of L.shops || []) if (sh.item === 'ticket' && Math.abs(P.x - sh.x) < 90) { releaseAll(); await tap('e'); await sleep(300); }
    }

    // progress along the path
    if (onGround && now > jumpUntil) {
      let j = -1;
      for (let k = Math.max(0, i - 3); k < Math.min(path.length, i + 30); k++) if (path[k].x === cx && path[k].y === cy) { j = k; }
      if (j >= 0) {
        if (j + 1 > i || `${cx},${cy}` !== lastCell) { lastProgress = now; lastCell = `${cx},${cy}`; }
        i = j + 1;
      } else if (now - lastProgress > 600) { path = null; continue; }   // knocked off the route
    }
    if (now - lastProgress > 4000) { rec.stuck += 1; lastProgress = now; path = null; releaseAll(); if (rec.stuck > 8) { rec.note = `stuck near col ${cx}`; break; } continue; }
    if (i >= path.length) { const d = Math.sign((path[path.length - 1].x * 48 + 24) - P.x); press('right', d > 0); press('left', d < 0); continue; }
    // in the air towards a moving platform: steer onto it
    if (steerTo) {
      if (onGround && now > jumpUntil) { steerTo = null; path = null; continue; }
      const d = steerTo.x - P.x; press('right', d > 10); press('left', d < -10); continue;
    }
    const nxt = path[i];
    if (globalThis.__log) { if (globalThis.__log.length > 300) globalThis.__log.shift(); globalThis.__log.push(`${Math.round(P.x)},${cx},${cy},g${onGround ? 1 : 0},i${i}:${nxt.kind}${nxt.x},${nxt.y}p${nxt.peak || 0},vy${Math.round(P.body.velocity.y)},vx${Math.round(P.body.velocity.x)}`); }
    const tx = nxt.x * 48 + 24;
    const dir = Math.sign(tx - P.x) || Math.sign(nxt.gap || 0);
    // the landing cell rests on a moving platform: wait until the platform is under it
    const moverFor = (x, y) => (L.movers ? L.movers.getChildren() : []).find((m) => {
      const x0 = Math.min(m.from.x, m.to.x) - 48, x1 = Math.max(m.from.x, m.to.x) + 48;
      const topRow = Math.floor((m.y - m.height + (m.slabY || 0)) / 48);
      return x * 48 + 24 >= x0 && x * 48 + 24 <= x1 && Math.abs(topRow - (y + 1)) <= Math.abs(m.from.y - m.to.y) / 48 + 1;
    });
    const staticSupport = (x, y) => { const t = L.layer.getTileAt(x, y + 1); return (t && t.collides) || (L.level.tiles[y + 1] && ['-', '_'].includes(L.level.tiles[y + 1][x])); };
    // riding a moving platform: stand still and let it carry us until the next solid cell of the route is close
    const riding = onGround && L.movers && L.movers.getChildren().some((m) => P.body.touching.down && Math.abs(P.body.bottom - m.body.top) < 6 && P.x > m.body.left - 10 && P.x < m.body.right + 10);
    const offMover = (c) => staticSupport(c.x, c.y) || !moverFor(c.x, c.y);
    if (riding && !offMover(nxt)) {
      let k = i; while (k < path.length && !offMover(path[k])) k++;
      if (k >= path.length) { releaseAll(); lastProgress = now; continue; }
      // like a player: walk to the platform's front edge, then jump when it reaches the far end of its run
      const rm = L.movers.getChildren().find((m) => Math.abs(P.body.bottom - m.body.top) < 6 && P.x > m.body.left - 10 && P.x < m.body.right + 10);
      const d = Math.sign(path[k].x * 48 + 24 - P.x) || 1;
      if (rm) {
        const endX = d > 0 ? Math.max(rm.from.x, rm.to.x) : Math.min(rm.from.x, rm.to.x);
        const edge = d > 0 ? rm.body.right - 24 : rm.body.left + 24;
        lastProgress = now;
        if ((edge - P.x) * d > 20) { press('right', d > 0); press('left', d < 0); continue; }
        if (Math.abs(rm.x - endX) < 30) {
          i = k;
          press('jump', true); setTimeout(() => press('jump', false), 460); jumpUntil = now + 460;
          press('right', d > 0); press('left', d < 0); rec.moverJumps = (rec.moverJumps || 0) + 1;
          continue;
        }
      }
      releaseAll(); lastProgress = now; continue;
    }
    const nxt2 = path[i];
    if (nxt2 !== nxt) { continue; }
    if ((nxt.kind === 'jump' || nxt.kind === 'walk' || nxt.kind === 'fall') && onGround && !staticSupport(nxt.x, nxt.y)) {
      const m = moverFor(nxt.x, nxt.y);
      const onMover = m && P.body.touching.down && Math.abs(P.body.bottom - m.body.top) < 6;
      if (m && !onMover && nxt.y > cy && Math.abs(nxt.x - cx) <= 1) {
        // dropping down onto it: step off when it will be right below
        const dd = Math.sign(nxt.x * 48 + 24 - P.x) || 1;
        const mx = m.x + m.body.velocity.x * 0.35;
        if (Math.abs(mx - (P.x + dd * 40)) < 50) { steerTo = m; jumpUntil = now + 250; press('right', dd > 0); press('left', dd < 0); continue; }
        releaseAll(); lastProgress = now; continue;
      }
      if (m && !onMover) {
        // jump when the platform will be within reach after ~0.6 s, then steer onto it in the air
        const dir0 = Math.sign((m.from.x + m.to.x) / 2 - P.x) || 1;
        const baseCol = path[i - 1] ? path[i - 1].x : cx;          // the last standing cell of the route, not wherever we slid to
        const edgeX = baseCol * 48 + 24 + dir0 * 14;
        if ((P.x - edgeX) * dir0 > 4) { press('right', dir0 < 0); press('left', dir0 > 0); lastProgress = now; continue; }   // overshot: step back
        if (Math.abs(P.x - edgeX) > 30 && !(dir0 > 0 ? P.body.blocked.right : P.body.blocked.left)) {
          const braking = Math.abs(P.body.velocity.x) > 120 && Math.abs(P.x - edgeX) < 60;
          press('right', dir0 > 0 && !braking); press('left', dir0 < 0 && !braking); lastProgress = now; continue;
        }
        const mx = m.x + m.body.velocity.x * 0.6;
        const dx = (mx - P.x) * dir0;
        if (dx > 60 && dx < 260) {
          press('jump', true); setTimeout(() => press('jump', false), 460); jumpUntil = now + 460;
          steerTo = m; press('right', dir0 > 0); press('left', dir0 < 0); continue;
        }
        releaseAll(); lastProgress = now; continue;   // wait for it
      }
    }
    if (nxt.kind === 'jump' && onGround && now > jumpUntil && path[i - 1] && path[i - 1].x === cx && path[i - 1].y === cy) {
      // take off from the edge of the current cell (or straight up for a vertical hop)
      const edge = cx * 48 + 24 + Math.sign(nxt.gap || 0) * 14;
      const blocked = Math.sign(nxt.gap) > 0 ? P.body.blocked.right || P.body.touching.right : P.body.blocked.left || P.body.touching.left;
      const ready = nxt.gap === 0 || blocked || Math.abs(P.x - (cx * 48 + 24 + Math.sign(nxt.gap) * 24)) < 26 || (Math.sign(nxt.gap) > 0 ? P.x >= edge - 6 : P.x <= edge + 6)
        || (Math.abs(P.body.velocity.x) < 5 && Math.abs(P.x - (cx * 48 + 24)) > 10 && now - lastProgress > 400);
      if (ready) {
        const holdMs = (nxt.peak || 0) >= 1 ? 460 : (Math.abs(nxt.gap) >= 3 ? 300 : 160);
        press('jump', true); jumpUntil = now + holdMs;
        setTimeout(() => press('jump', false), holdMs);
      }
      press('right', (nxt.gap || 0) > 0 || (nxt.gap === 0 && dir > 0 && !ready)); press('left', (nxt.gap || 0) < 0 || (nxt.gap === 0 && dir < 0 && !ready));
      continue;
    }
    // walk / fall / in the air: head for the next cell, brake when close
    const close = Math.abs(tx - P.x) < 8;
    press('right', !close && dir > 0); press('left', !close && dir < 0);
  }
  releaseAll();
  L.player && (L.player.constructor.prototype.hurt = origHurt);
  L && (L.constructor.prototype.killPlayer = origKill);
  rec.secs = Math.round((performance.now() - t0) / 1000);
  try { rec.gone = L.enemies.getChildren().filter((e) => !e.active).length; } catch (e) { rec.gone = '?'; }
  try { rec.endCol = Math.floor(level().player.x / 48); } catch (e) { rec.endCol = '?'; }
  rec.livesLeft = G.lives; rec.heat = G.heat; rec.corruption = G.corruption; rec.timeLeft = L && L.timeLeft;
  if (MODE === 'greedy') globalThis.__carry = { corruption: G.corruption, wallet: G.wallet, mafiaChoice: G.mafiaChoice };
  globalThis.__ammo = { chestnuts: G.chestnuts, books: G.books };
  try { rec.lettersGot = G.lettersGot || 0; } catch (e) { rec.lettersGot = '?'; }
  globalThis.__camp = { lives: G.lives, score: G.score, nextLifeAt: G.nextLifeAt, reputation: G.reputation };
  rec.repEnd = Math.round(G.reputation);
  if (rec.note === 'game over') { results.push(rec); await window.__save('res___TAG__', JSON.stringify(results, null, 1)); break; }
  rec.mafia = G.mafiaChoice || ''; rec.conscienceFreezes = G.freezes || 0;
  results.push(rec);
  await window.__save('res___TAG__', JSON.stringify(results, null, 1));
  await shot(`__TAG___${rec.level}`);
}
return { results, log: globalThis.__log.filter((_, k) => k % 3 === 0) };
