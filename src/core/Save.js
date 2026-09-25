const KEY = 'sluha.v1';
const RANK = { gameover: 0, arrest: 1, train_nabu: 1, train_karma: 1, extradited: 2, austria_mafia: 2, front_case: 2, front_serve: 5, escape: 3, abroad_happy: 3, austria_happy: 4, honest: 5 };
export const SLOT_IDS = ['auto', '1', '2', '3'];

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; /* private mode or blocked storage */
  }
}

export const Save = {
  get lang() { return read().lang || 'uk'; },
  set lang(v) { write({ ...read(), lang: v }); },

  get muted() { return !!read().muted; },
  set muted(v) { write({ ...read(), muted: !!v }); },

  get best() { return read().best || null; },

  /** Keep the best result: honest > escape > arrest > gameover, then score. */
  recordResult(result) {
    const data = read();
    const prev = data.best;
    const better = !prev
      || RANK[result.ending] > RANK[prev.ending]
      || (RANK[result.ending] === RANK[prev.ending] && result.score > prev.score);
    if (better) data.best = { ...result, at: new Date().toISOString() };
    data.runs = (data.runs || 0) + 1;
    write(data);
    return better;
  },

  get runs() { return read().runs || 0; },

  // ------------------------------------------------------------------ save slots
  /** slot: 'auto' | '1' | '2' | '3'. entry: {levelIndex, label, state, savedAt} */
  writeSlot(slot, entry) {
    const data = read();
    data.slots = data.slots || {};
    data.slots[slot] = { ...entry, savedAt: new Date().toISOString() };
    return write(data);
  },

  readSlot(slot) {
    const s = (read().slots || {})[slot];
    return s && s.state ? s : null;
  },

  deleteSlot(slot) {
    const data = read();
    if (data.slots) delete data.slots[slot];
    write(data);
  },

  /** Most recent slot of any kind (for "Continue"). */
  latest() {
    const slots = read().slots || {};
    let best = null;
    for (const id of SLOT_IDS) {
      const s = slots[id];
      if (s && s.state && (!best || s.savedAt > best.savedAt)) best = { ...s, id };
    }
    return best;
  },
};
