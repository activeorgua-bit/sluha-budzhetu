import { STRINGS } from '../config/strings.js';
import { Save } from './Save.js';

let current = Save.lang in STRINGS ? Save.lang : 'uk';

export function t(key, params) {
  let s = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function hasText(key) { return key in STRINGS[current] || key in STRINGS.en; }

export function getLang() { return current; }

export function setLang(lang) {
  if (STRINGS[lang]) {
    current = lang;
    Save.lang = lang;
  }
}

export function toggleLang() {
  setLang(current === 'uk' ? 'en' : 'uk');
  return current;
}

/** Shared text style helpers (Press Start 2P with a Cyrillic subset). */
export const FONT = 'PressStart2P, monospace';

/**
 * The pixel font is drawn on an 8 px grid: any other size (or a 2x text texture squeezed into the
 * 960x540 canvas) smears its glyphs once the canvas is scaled up. Every size snaps to 8 / 16 / 24 / 32
 * and renders 1:1, so each stroke sits on whole pixels.
 */
export function crispSize(size) {
  if (size < 12) return 8;
  if (size < 20) return 16;
  if (size < 28) return 24;
  return 32;
}

export function textStyle(size = 12, color = '#ffffff', extra = {}) {
  return {
    fontFamily: FONT,
    color,
    ...extra,
    fontSize: `${crispSize(size)}px`,
    resolution: 1,
  };
}
