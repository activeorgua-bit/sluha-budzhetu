// Touch controls for phones and tablets (idea from fly-office-v2: DOM buttons that send the same
// keydown/keyup events as a keyboard, so every scene keeps its keyboard code unchanged).
//
//   left thumb:  ◀ ▶ (slide between them without lifting the finger)
//   right thumb: JUMP (big), chestnut, bribe, black PR, action
//   top left:    pause / back (Esc) and fullscreen
//
// Shown only on touch devices; `?touch=1` forces it on a desktop for testing.
import { getLang } from './i18n.js';

const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
export const IS_TOUCH = new URLSearchParams(location.search).get('touch') === '1'
  || mq('(pointer: coarse)') || (navigator.maxTouchPoints > 0 && !mq('(pointer: fine)'));

const KEY = {
  left: ['ArrowLeft', 37], right: ['ArrowRight', 39], jump: ['Space', 32],
  nut: ['KeyL', 76], bribe: ['KeyJ', 74], pr: ['KeyK', 75], act: ['KeyE', 69], esc: ['Escape', 27],
};
const LABEL = {
  uk: { pr: 'PR', act: 'ДІЯ', rotate: 'Поверніть телефон горизонтально', anyway: 'Грати так' },
  en: { pr: 'PR', act: 'USE', rotate: 'Turn your phone sideways', anyway: 'Play anyway' },
};

function send(type, [code, keyCode]) {
  const ev = new KeyboardEvent(type, { key: code === 'Space' ? ' ' : code, code, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => keyCode });   // Phaser reads keyCode
  Object.defineProperty(ev, 'which', { get: () => keyCode });
  window.dispatchEvent(ev);
}

const CSS = `
#touch { position: fixed; inset: 0; pointer-events: none; z-index: 10; font-family: PressStart2P, monospace;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
#touch .grp { position: absolute; display: flex; gap: var(--gap); align-items: flex-end; touch-action: none; }
#touch .btn { pointer-events: auto; touch-action: none; box-sizing: border-box; width: var(--b); height: var(--b);
  display: flex; align-items: center; justify-content: center; border-radius: 22%;
  background: rgba(26, 29, 38, 0.55); border: 3px solid rgba(232, 182, 42, 0.75); color: #e8b62a;
  font-size: calc(var(--b) * 0.2); image-rendering: pixelated; background-repeat: no-repeat; background-position: center;
  background-size: 62%; }
#touch .btn.small { width: var(--s); height: var(--s); font-size: calc(var(--s) * 0.22); border-color: rgba(85, 91, 106, 0.9); }
#touch .btn.jump { width: calc(var(--b) * 1.25); height: calc(var(--b) * 1.25); border-radius: 50%; }
#touch .btn.on { background-color: rgba(46, 67, 104, 0.85); border-color: #79e0e8; }
#touch .btn i { display: block; width: 30%; height: 30%; border-top: 4px solid currentColor; border-left: 4px solid currentColor; }
#touch .left i { transform: translateX(20%) rotate(-45deg); }
#touch .right i { transform: translateX(-20%) rotate(135deg); }
#touch .jump i { transform: translateY(25%) rotate(45deg); }
#touch .act { flex-direction: column; align-items: flex-end; }
#touch .minis { display: none; grid-template-columns: repeat(2, var(--s)); gap: var(--gap); }
#touch.playing .minis { display: grid; }
#touch .play { display: none; }
#touch.playing .play { display: flex; }
#touch .esc, #touch .fs { display: flex; }
#touch .esc b { display: block; width: 18%; height: 44%; border-left: 4px solid currentColor; border-right: 4px solid currentColor; box-sizing: content-box; }
#touch .esc.back b { width: 30%; height: 30%; border: 0; border-top: 4px solid currentColor; border-left: 4px solid currentColor; transform: translateX(20%) rotate(-45deg); }
#touch .fs b { display: block; width: 44%; height: 44%; border: 4px dashed currentColor; box-sizing: border-box; }
#touch .hidden { display: none !important; }
#rotate { position: fixed; inset: 0; z-index: 20; display: none; flex-direction: column; align-items: center; justify-content: center;
  gap: 28px; background: #0b0d12; color: #e8b62a; font: 12px/1.8 PressStart2P, monospace; text-align: center; padding: 24px; }
#rotate .phone { width: 52px; height: 86px; border: 4px solid #e8b62a; border-radius: 8px; animation: sb-turn 2.4s ease-in-out infinite; }
#rotate button { font: 10px PressStart2P, monospace; color: #9aa2b1; background: #1a1d26; border: 2px solid #555b6a; padding: 12px 16px; }
@keyframes sb-turn { 0%, 30% { transform: rotate(0); } 60%, 100% { transform: rotate(-90deg); } }
@media (orientation: portrait) { body:not(.rotate-ok) #rotate { display: flex; } }
`;

export const touchPad = {
  install(game) {
    if (!IS_TOUCH || document.getElementById('touch')) return;
    document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
    document.body.insertAdjacentHTML('beforeend', `
      <div id="rotate"><div class="phone"></div><div class="msg"></div><button type="button"></button></div>
      <div id="touch">
        <div class="grp top"><div class="btn small esc" data-k="esc"><b></b></div><div class="btn small fs"><b></b></div></div>
        <div class="grp pad"><div class="btn play left" data-k="left" data-slide="1"><i></i></div><div class="btn play right" data-k="right" data-slide="1"><i></i></div></div>
        <div class="grp act">
          <div class="minis">
            <div class="btn small play" data-k="act"></div><div class="btn small play" data-k="pr"></div>
            <div class="btn small play" data-k="bribe"></div><div class="btn small play" data-k="nut"></div>
          </div>
          <div class="btn play jump" data-k="jump"><i></i></div>
        </div>
      </div>`);
    this.root = document.getElementById('touch');
    this.game = game;
    const rotate = document.getElementById('rotate');
    rotate.querySelector('button').addEventListener('click', () => { document.body.classList.add('rotate-ok'); window.dispatchEvent(new Event('resize')); });

    // one finger = one button; a finger sliding across ◀ ▶ switches between them
    const held = new Map();   // pointerId -> button element
    const press = (b) => { b.classList.add('on'); send('keydown', KEY[b.dataset.k]); };
    const release = (b) => { b.classList.remove('on'); send('keyup', KEY[b.dataset.k]); };
    for (const b of this.root.querySelectorAll('.btn[data-k]')) {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        b.setPointerCapture?.(e.pointerId);
        held.set(e.pointerId, b); press(b);
      });
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    this.root.addEventListener('pointermove', (e) => {
      const cur = held.get(e.pointerId);
      if (!cur || !cur.dataset.slide) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const next = el && el.closest && el.closest('.btn[data-slide]');
      if (next && next !== cur) { release(cur); held.set(e.pointerId, next); press(next); }
    });
    const end = (e) => { const b = held.get(e.pointerId); if (b) { held.delete(e.pointerId); release(b); } };
    this.root.addEventListener('pointerup', end);
    this.root.addEventListener('pointercancel', end);
    // a tab switch or a scene change must never leave a key stuck down
    const releaseAll = () => { for (const [id, b] of held) { held.delete(id); release(b); } };
    window.addEventListener('blur', releaseAll);
    document.addEventListener('visibilitychange', releaseAll);

    this.root.querySelector('.fs').addEventListener('pointerdown', (e) => { e.preventDefault(); this.toggleFullscreen(); });

    const layout = () => this.layout();
    window.addEventListener('resize', layout);
    window.visualViewport?.addEventListener('resize', layout);
    this.lang = null;
    this.timer = setInterval(() => this.sync(), 200);
    this.sync();
    layout();
  },

  /** Sizes follow the canvas; clusters hug the screen corners (inside the safe area). */
  layout() {
    const c = this.game.canvas.getBoundingClientRect();
    const b = Math.round(Math.max(52, Math.min(96, c.height * 0.17)));
    const s = Math.round(b * 0.72);
    const gap = Math.round(b * 0.14);
    const r = this.root.style;
    r.setProperty('--b', `${b}px`); r.setProperty('--s', `${s}px`); r.setProperty('--gap', `${gap}px`);
    const edge = (side) => `max(${gap}px, env(safe-area-inset-${side}))`;
    const bottom = `${Math.max(gap, window.innerHeight - c.bottom + gap)}px`;
    const pad = this.root.querySelector('.pad').style;
    pad.left = edge('left'); pad.bottom = bottom;
    const act = this.root.querySelector('.act').style;
    act.right = edge('right'); act.bottom = bottom;
    const top = this.root.querySelector('.top').style;
    top.left = edge('left'); top.top = `${Math.round(c.top + c.height * 0.14)}px`;   // just below the HUD strip
  },

  /** Gameplay buttons only while a level runs; the Esc button doubles as "back" in menus. */
  sync() {
    const sm = this.game.scene;
    const has = (k) => sm.getScene(k) && (sm.isActive(k) || sm.isPaused(k));
    const playing = sm.isActive('Level') && !sm.isPaused('Level') && !sm.isActive('Choice');
    this.root.classList.toggle('playing', !!playing);
    const esc = this.root.querySelector('.esc');
    const overlay = ['Pause', 'Help', 'SaveLoad'].some((k) => sm.isActive(k));
    esc.classList.toggle('hidden', !(playing || overlay));
    esc.classList.toggle('back', overlay);
    this.root.querySelector('.fs').classList.toggle('hidden', !document.fullscreenEnabled && !document.webkitFullscreenEnabled);
    // icons straight from the game's own atlases, once Preload has loaded them
    if (!this.iconsDone && this.game.textures.exists('ui')) {
      this.iconsDone = true;
      for (const [k, frame] of [['nut', 'hud_chestnut'], ['bribe', 'hud_bag']]) {
        try {
          if (this.game.textures.get('ui').has(frame)) {
            this.root.querySelector(`[data-k="${k}"]`).style.backgroundImage = `url(${this.game.textures.getBase64('ui', frame)})`;
          }
        } catch (err) { /* keep the plain button */ }
      }
    }
    const lang = getLang();
    if (lang !== this.lang) {
      this.lang = lang;
      const L = LABEL[lang] || LABEL.en;
      this.root.querySelector('[data-k="pr"]').textContent = L.pr;
      this.root.querySelector('[data-k="act"]').textContent = L.act;
      document.querySelector('#rotate .msg').textContent = L.rotate;
      document.querySelector('#rotate button').textContent = L.anyway;
    }
  },

  async toggleFullscreen() {
    const d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) await (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else {
        const el = d.documentElement;
        await (el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen());
        try { await screen.orientation.lock('landscape'); } catch (err) { /* iOS: no orientation lock */ }
      }
    } catch (err) { /* fullscreen refused: nothing to do */ }
    setTimeout(() => { this.game.scale.refresh(); this.layout(); }, 300);
  },
};
