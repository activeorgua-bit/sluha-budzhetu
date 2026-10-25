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
 * The pixel font is drawn on an 8 px grid. Small text (8 px and below) snaps to 8 px and renders 1:1, so
 * its glyphs stay on whole pixels (6-7 px text smeared once the canvas was scaled up). Bigger text keeps
 * its own size and a 2x texture, as it always had.
 */
export function crispSize(size) {
  return size <= 8 ? 8 : size;
}

export function textStyle(size = 12, color = '#ffffff', extra = {}) {
  const small = size <= 8;
  return {
    fontFamily: FONT,
    color,
    resolution: small ? 1 : 2,
    ...extra,
    fontSize: `${crispSize(size)}px`,
  };
}
