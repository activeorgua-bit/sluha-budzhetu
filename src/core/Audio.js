// Procedural 8-bit synthesizer (Web Audio). Ported from the original draft's
// js/engine/audio.js — same twelve sounds, same envelopes — with a lazy
// AudioContext that is created on the first user gesture (browser autoplay rules).

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Create/resume the AudioContext. Safe to call on every input event. */
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _ready() {
    return !this.muted && this.ctx && this.ctx.state === 'running';
  }

  _tone(type, f0, f1, dur, gain0 = 0.2, ramp = 'exp', when = 0) {
    const now = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now);
    if (f1 !== null) {
      if (ramp === 'exp') osc.frequency.exponentialRampToValueAtTime(f1, now + dur);
      else osc.frequency.linearRampToValueAtTime(f1, now + dur);
    }
    gain.gain.setValueAtTime(gain0, now);
    gain.gain.linearRampToValueAtTime(0.01, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  _arpeggio(type, notes, step, dur, gain0) {
    notes.forEach((f, i) => this._tone(type, f, null, dur, gain0, 'lin', i * step));
  }

  playJump() {
    if (!this._ready()) return;
    this._tone('square', 150, 450, 0.15, 0.15);
  }

  playCoin() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playBribe() {
    if (!this._ready()) return;
    this._arpeggio('triangle', [1046.5, 1318.51, 1567.98, 2093.0], 0.05, 0.18, 0.2);
  }

  playThrowCash() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const size = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(400, now + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playCopBribed() {
    if (!this._ready()) return;
    this._arpeggio('sine', [523.25, 659.25, 783.99, 1046.5], 0.06, 0.15, 0.18);
  }

  playCameraFlash() {
    if (!this._ready()) return;
    this._tone('square', 1800, 400, 0.1, 0.3);
  }

  playNABUSiren() {
    if (!this._ready()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.6);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.7);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  playBridgeCrack() {
    if (!this._ready()) return;
    this._tone('sawtooth', 120, 30, 0.25, 0.25);
  }

  playHurt() {
    if (!this._ready()) return;
    this._tone('sawtooth', 220, 80, 0.2, 0.3, 'lin');
  }

  playVictoryHonest() {
    if (!this._ready()) return;
    this._arpeggio('square', [523.25, 659.25, 783.99, 1046.5, 1318.51], 0.12, 0.25, 0.18);
  }

  playVictoryCorrupt() {
    if (!this._ready()) return;
    this._arpeggio('triangle', [659.25, 830.61, 987.77, 1318.51, 1567.98], 0.08, 0.2, 0.2);
  }

  /** Short "denied" buzz used when a bribe attempt fails. */
  playDenied() {
    if (!this._ready()) return;
    this._tone('square', 200, 120, 0.22, 0.2, 'lin');
  }

  /** Checkpoint chime. */
  playCheckpoint() {
    if (!this._ready()) return;
    this._arpeggio('sine', [783.99, 1046.5], 0.08, 0.2, 0.15);
  }
}

export const audio = new SoundEngine();
