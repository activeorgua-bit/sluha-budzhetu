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

export function textStyle(size = 12, color = '#ffffff', extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    resolution: 2,
    ...extra,
  };
}
