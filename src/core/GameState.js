import Phaser from 'phaser';
import { BALANCE, tierFor } from '../config/balance.js';
import { Rng } from './Rng.js';

/**
 * Run state shared by every scene. A plain singleton with an event emitter:
 *   GameState.events.on('change', (state) => ...)   any field changed
 *   GameState.events.on('pickup', ({kind, value}) => ...)
 *   GameState.events.on('heat', ({heat, tier, prevTier}) => ...)
 */
class GameStateClass {
  constructor() {
    this.events = new Phaser.Events.EventEmitter();
    this.reset();
  }

  reset(seed) {
    this.seed = seed ?? (Date.now() % 2147483647);
    this.rng = new Rng(this.seed);
    this.corruption = 0;      // total value ever collected (never decreases)
    this.wallet = 0;          // spendable bribes
    this.score = 0;
    this.lives = BALANCE.lives.start;
    this.nextLifeAt = BALANCE.lives.extraEveryScore;
    this.cleanRun = true;     // false after the first pickup of any value
    this.failedBribes = 0;
    this.trapsTriggered = 0;
    this.chestnuts = BALANCE.nuts.start;   // honest ammo: never adds corruption
    this.books = 0;                       // 'Kapital' books from the bunker (stronger)
    this.reputation = BALANCE.reputation.max;   // health bar; carried between levels, refilled on a lost life
    this.conscience = 0;                  // inner judge 0..100 (see BALANCE.conscience)
    this.drunk = null;                    // { kind: 'whiskey'|'vodka', until: ms } while drunk
    this.drinks = 0;
    this.mafiaChoice = null;              // 'yes' | 'no' (party finale)
    this.jacketless = false;              // robbed after the party: torn shirt, no jacket
    this.hasTicket = false;
    this.levelIndex = 0;
    this.levelStats = {};     // levelId -> {pickups, time, deaths}
    this.checkpoint = null;   // {levelId, x, y}
    this.ending = null;       // 'honest' | 'escape' | 'arrest' | 'gameover'
    this.devMode = false;
    this._lastTier = 0;
    this.emit();
  }

  get heat() {
    const h = BALANCE.heat;
    const v = this.corruption * h.perCorruption + this.failedBribes * h.perFailedBribe
      + this.trapsTriggered * h.perTrap;
    return Math.min(h.max, Math.round(v));
  }

  get tier() { return tierFor(this.heat); }

  addPickup(kind) {
    const value = BALANCE.pickups[kind] ?? 0;
    this.corruption += value;
    this.wallet += value;
    this.cleanRun = false;
    this.addScore(BALANCE.score[kind] ?? 0, false);
    const ls = this._stats();
    ls.pickups += value;
    this.conscience = Math.min(BALANCE.conscience.max, this.conscience + (BALANCE.conscience.gain[kind] ?? 0));
    this.events.emit('pickup', { kind, value, state: this });
    this._afterHeatChange();
    this.emit();
    return value;
  }

  spendWallet(n) {
    if (this.wallet < n) return false;
    this.wallet -= n;
    this.emit();
    return true;
  }

  /** Chestnuts / books: free ammo, capped, no corruption. Returns the amount actually added. */
  addAmmo(kind, n = 1) {
    const key = kind === 'book' ? 'books' : 'chestnuts';
    const before = this[key];
    this[key] = Math.min(BALANCE.nuts.max, this[key] + n);
    this.emit();
    return this[key] - before;
  }

  /** Take one throwable: a book if you carry one, else a chestnut. Returns the kind or null. */
  takeAmmo() {
    if (this.books > 0) { this.books -= 1; this.emit(); return 'book'; }
    if (this.chestnuts > 0) { this.chestnuts -= 1; this.emit(); return 'chestnut'; }
    return null;
  }

  /** Bad deed: conscience rises. Emits 'conscience' so the level can react (warning, remorse). */
  addConscience(reason, n) {
    const c = BALANCE.conscience;
    const v = n ?? c.gain[reason] ?? 0;
    if (!v) return;
    this.conscience = Math.min(c.max, this.conscience + v);
    this.events.emit('conscience', { reason, value: this.conscience, state: this });
    this.emit();
  }

  /** Called every frame by the level: slow decay while nothing new happens. */
  decayConscience(dtSec) {
    if (this.conscience <= 0) return;
    const before = Math.floor(this.conscience);
    this.conscience = Math.max(0, this.conscience - BALANCE.conscience.decayPerSec * dtSec);
    if (Math.floor(this.conscience) !== before) this.emit();
  }

  /** A drink: conscience goes quiet, the legs get heavy. `now` is the scene clock. */
  drink(kind, now) {
    const a = BALANCE.alcohol[kind];
    this.conscience = Math.max(0, this.conscience - a.conscience);
    const stronger = !this.drunk || kind === 'vodka' || this.drunk.kind !== 'vodka';
    const until = Math.max(this.drunk ? this.drunk.until : 0, now) + a.drunkSec * 1000;
    this.drunk = { kind: stronger ? kind : this.drunk.kind, until };
    this.drinks += 1;
    this.events.emit('drink', { kind, state: this });
    this.emit();
  }

  /** Current drunk profile (BALANCE.alcohol entry) or null. */
  drunkProfile(now) {
    if (!this.drunk) return null;
    if (now >= this.drunk.until) { this.drunk = null; this.emit(); return null; }
    return BALANCE.alcohol[this.drunk.kind];
  }

  bribeFailed() { this.failedBribes += 1; this.addConscience('bribe_fail'); this._afterHeatChange(); this.emit(); }
  trapTriggered() { this.trapsTriggered += 1; this.addConscience('trap'); this._afterHeatChange(); this.emit(); }

  addScore(n, emit = true) {
    this.score += n;
    while (this.score >= this.nextLifeAt) {
      this.lives = Math.min(BALANCE.lives.max, this.lives + 1);
      this.nextLifeAt += BALANCE.lives.extraEveryScore;
      this.events.emit('extra-life', { source: 'score', state: this });
    }
    if (emit) this.emit();
  }

  /** A voters' thank-you: +1 life (capped) and a spotless reputation. */
  addLife() {
    this.lives = Math.min(BALANCE.lives.max, this.lives + 1);
    this.reputation = BALANCE.reputation.max;
    this.events.emit('extra-life', { source: 'letter', state: this });
    this.emit();
  }

  loseLife() {
    this.lives -= 1;
    this.reputation = BALANCE.reputation.max;   // the next life starts with a clean name
    this._stats().deaths += 1;
    this.emit();
    return this.lives;
  }

  setCheckpoint(levelId, x, y) { this.checkpoint = { levelId, x, y }; }
  clearCheckpoint() { this.checkpoint = null; }

  levelFinished(levelId, secondsLeft, honestLevel) {
    const s = this._stats(levelId);
    s.time = secondsLeft;
    let bonus = BALANCE.score.levelClear + Math.max(0, Math.floor(secondsLeft)) * BALANCE.score.timeBonusPerSec;
    if (honestLevel && this.cleanRun) bonus += BALANCE.score.honestLevelBonus;
    this.addScore(bonus);
    this.clearCheckpoint();
    return bonus;
  }

  _stats(levelId = this.levelIndex) {
    if (!this.levelStats[levelId]) this.levelStats[levelId] = { pickups: 0, time: 0, deaths: 0 };
    return this.levelStats[levelId];
  }

  _afterHeatChange() {
    const t = this.tier.id;
    if (t !== this._lastTier) {
      const prev = this._lastTier;
      this._lastTier = t;
      this.events.emit('heat', { heat: this.heat, tier: t, prevTier: prev, state: this });
    }
  }

  emit(type = 'change') { this.events.emit(type, this); }

  /** Plain snapshot for save slots (taken at the start of a level). */
  serialize() {
    return {
      seed: this.seed, corruption: this.corruption, wallet: this.wallet, score: this.score,
      lives: this.lives, nextLifeAt: this.nextLifeAt, cleanRun: this.cleanRun,
      failedBribes: this.failedBribes, trapsTriggered: this.trapsTriggered, levelIndex: this.levelIndex,
      levelStats: JSON.parse(JSON.stringify(this.levelStats)), guardPaid: !!this.guardPaid,
      chestnuts: this.chestnuts, books: this.books, conscience: this.conscience, drinks: this.drinks,
      mafiaChoice: this.mafiaChoice, jacketless: this.jacketless, hasTicket: this.hasTicket,
      reputation: this.reputation,
    };
  }

  restore(snap) {
    this.reset(snap.seed);
    Object.assign(this, {
      corruption: snap.corruption, wallet: snap.wallet, score: snap.score, lives: snap.lives,
      nextLifeAt: snap.nextLifeAt, cleanRun: snap.cleanRun, failedBribes: snap.failedBribes,
      trapsTriggered: snap.trapsTriggered, levelIndex: snap.levelIndex,
      levelStats: snap.levelStats || {}, guardPaid: !!snap.guardPaid,
      chestnuts: snap.chestnuts || 0, books: snap.books || 0, conscience: snap.conscience || 0, drinks: snap.drinks || 0,
      mafiaChoice: snap.mafiaChoice || null, jacketless: !!snap.jacketless, hasTicket: !!snap.hasTicket,
      reputation: snap.reputation ?? BALANCE.reputation.max,
    });
    this.checkpoint = null;
    this._lastTier = this.tier.id;
    this.emit();
  }

  /** Cheats used by ?dev=1 (menu shows extra keys). */
  devSetHeat(target) {
    // choose corruption so that heat ≈ target (keeps wallet in sync for testing bribes)
    const c = Math.max(0, Math.round(target / BALANCE.heat.perCorruption));
    this.corruption = c; this.wallet = Math.max(this.wallet, Math.min(c, 60));
    if (c > 0) this.cleanRun = false;
    this._afterHeatChange();
    this.emit();
  }
}

export const GameState = new GameStateClass();
