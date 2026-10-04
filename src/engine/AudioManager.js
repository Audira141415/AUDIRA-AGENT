/**
 * AudioManager.js - Enhanced Procedural Web Audio Engine
 * Features:
 * - Polyphonic Procedural Lo-Fi Ambient Chords (Zero MP3 files needed!)
 * - Realistic Mechanical Keyboard Switch Physics (Tactile bump + switch clack)
 * - Server Room Cooling Fan & Optical Hum
 * - Authentic Espresso Grinder & Steam Purge
 * - 8-Bit Chimes and Alert Soundscapes
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.3;
    this.masterGain = null;
    this.lofiGain = null;
    this.isLofiPlaying = false;
    this.lofiTimer = null;
    this.lastClickTime = 0;
    this.chordIndex = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Lo-Fi Sub-mix bus
      this.lofiGain = this.ctx.createGain();
      this.lofiGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.lofiGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  // ==========================================
  // PROCEDURAL LO-FI CHORD ENGINE
  // ==========================================
  toggleLofiMusic() {
    this.ensureContext();
    if (this.isLofiPlaying) {
      this.stopLofiMusic();
      return false;
    } else {
      this.startLofiMusic();
      return true;
    }
  }

  startLofiMusic() {
    if (this.isLofiPlaying || !this.ctx) return;
    this.isLofiPlaying = true;
    this.chordIndex = 0;
    this.playNextLofiChord();
  }

  stopLofiMusic() {
    this.isLofiPlaying = false;
    if (this.lofiTimer) {
      clearTimeout(this.lofiTimer);
      this.lofiTimer = null;
    }
  }

  playNextLofiChord() {
    if (!this.isLofiPlaying || !this.ctx) return;

    // Smooth jazz / lo-fi chord progressions: Fmaj7 -> Em7 -> Dm7 -> G13
    const progressions = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [164.81, 196.00, 246.94, 293.66], // Em7 (E3, G3, B3, D4)
      [146.83, 174.61, 220.00, 261.63], // Dm7 (D3, F3, A3, C4)
      [196.00, 246.94, 293.66, 370.00]  // G9 (G3, B3, D4, F#4)
    ];

    const chord = progressions[this.chordIndex % progressions.length];
    this.chordIndex++;

    const t = this.ctx.currentTime;
    const duration = 3.6; // seconds per chord

    // Low-pass filter to give vinyl / tape warmth
    const warmFilter = this.ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(650, t);
    warmFilter.frequency.exponentialRampToValueAtTime(800, t + 1.5);
    warmFilter.frequency.exponentialRampToValueAtTime(550, t + duration);
    warmFilter.connect(this.lofiGain);

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      // Slight detune for analog warmth
      osc.frequency.setValueAtTime(freq + (Math.random() * 0.8 - 0.4), t);

      // Smooth attack and release envelope
      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.linearRampToValueAtTime(0.08 / chord.length, t + 0.4);
      noteGain.gain.setValueAtTime(0.08 / chord.length, t + duration - 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(noteGain);
      noteGain.connect(warmFilter);

      osc.start(t);
      osc.stop(t + duration);
    });

    // Schedule next chord
    this.lofiTimer = setTimeout(() => {
      this.playNextLofiChord();
    }, (duration - 0.2) * 1000);
  }

  // ==========================================
  // REALISTIC MECHANICAL KEYBOARD SWITCH
  // ==========================================
  playKeyboardClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = Date.now();
    if (now - this.lastClickTime < 45) return;
    this.lastClickTime = now;

    const t = this.ctx.currentTime;
    const isSpaceOrEnter = Math.random() < 0.15;

    // 1. Initial High-Frequency Contact Snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    const snapFilter = this.ctx.createBiquadFilter();

    const baseFreq = isSpaceOrEnter ? 800 : (1600 + Math.random() * 600);
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(baseFreq, t);
    snapOsc.frequency.exponentialRampToValueAtTime(120, t + 0.035);

    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(baseFreq, t);
    snapFilter.Q.setValueAtTime(4.5, t);

    snapGain.gain.setValueAtTime(isSpaceOrEnter ? 0.22 : 0.14, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.masterGain);

    snapOsc.start(t);
    snapOsc.stop(t + 0.035);

    // 2. Plastic Bottom-Out Thud (Low-end resonance)
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(isSpaceOrEnter ? 110 : 220, t + 0.005);
    thudOsc.frequency.exponentialRampToValueAtTime(40, t + 0.03);

    thudGain.gain.setValueAtTime(0.12, t + 0.005);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);

    thudOsc.start(t + 0.005);
    thudOsc.stop(t + 0.03);
  }

  // ==========================================
  // ESPRESSO MACHINE SOUNDS
  // ==========================================
  playCoffee() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Steam release hiss
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.4);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);

    // Liquid drip drop
    setTimeout(() => {
      if (!this.ctx) return;
      const tDrop = this.ctx.currentTime;
      const dropOsc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();

      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(1200, tDrop);
      dropOsc.frequency.exponentialRampToValueAtTime(450, tDrop + 0.08);

      dropGain.gain.setValueAtTime(0.15, tDrop);
      dropGain.gain.exponentialRampToValueAtTime(0.001, tDrop + 0.08);

      dropOsc.connect(dropGain);
      dropGain.connect(this.masterGain);

      dropOsc.start(tDrop);
      dropOsc.stop(tDrop + 0.08);
    }, 280);
  }

  // ==========================================
  // SERVER RACK PULSE & DIAGNOSTIC SOUND
  // ==========================================
  playServerDiagnostic() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.15);
    osc.frequency.linearRampToValueAtTime(660, t + 0.3);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playClick() {
    this.playBlip(750);
  }

  playBeep(freq = 660, duration = 0.08, type = 'sine') {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  playBlip(freq = 660) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.setValueAtTime(freq * 1.45, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playSuccess() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.3);
      }, idx * 65);
    });
  }

  playAlert() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.setValueAtTime(220, t + 0.1);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playStep() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.03);

    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }
}

export const audio = new AudioManager();
