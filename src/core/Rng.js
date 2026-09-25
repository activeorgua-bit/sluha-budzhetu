/** Small seeded PRNG (mulberry32) so bribe rolls and trap coins are reproducible per run. */
export class Rng {
  constructor(seed = 1) {
    this.state = seed >>> 0 || 1;
  }

  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  chance(p) { return this.next() < p; }
  between(min, max) { return min + this.next() * (max - min); }
  int(min, max) { return Math.floor(this.between(min, max + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }

  /** Deterministic sub-generator for a given label (e.g. a level id). */
  fork(label) {
    let h = 2166136261;
    for (const ch of String(label)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return new Rng((h ^ this.state) >>> 0);
  }
}
