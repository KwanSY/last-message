/**
 * Procedural Audio Synthesizer for 2010 Police Duty Room Experience
 * Emulates physical acoustics without external audio files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.humNode = null;
    this.humGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Low subtle CRT 50Hz electrical hum + 15.625kHz flyback transformer whine
  startCRTHum() {
    this.ensureContext();
    if (!this.ctx || this.humNode) return;

    try {
      // 50Hz power hum
      const osc50 = this.ctx.createOscillator();
      osc50.type = 'sine';
      osc50.frequency.setValueAtTime(50, this.ctx.currentTime);

      // 100Hz harmonic
      const osc100 = this.ctx.createOscillator();
      osc100.type = 'triangle';
      osc100.frequency.setValueAtTime(100, this.ctx.currentTime);

      // Very faint CRT flyback line frequency (15625Hz)
      const oscHigh = this.ctx.createOscillator();
      oscHigh.type = 'sine';
      oscHigh.frequency.setValueAtTime(15625, this.ctx.currentTime);

      const highGain = this.ctx.createGain();
      highGain.gain.setValueAtTime(0.008, this.ctx.currentTime);

      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      osc50.connect(this.humGain);
      osc100.connect(this.humGain);
      oscHigh.connect(highGain);
      highGain.connect(this.humGain);

      this.humGain.connect(this.ctx.destination);

      osc50.start();
      osc100.start();
      oscHigh.start();
      this.humNode = { osc50, osc100, oscHigh };
    } catch (e) {
      console.warn("Audio init error", e);
    }
  }

  stopCRTHum() {
    if (this.humGain && this.ctx) {
      try {
        this.humGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      } catch (e) {}
    }
  }

  // CRT Degauss & Power On Sound: Coil thump -> pitch sweep -> high frequency ring
  playCRTTurnOn() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Degauss coil relay click + low thump
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(t);

    // High frequency charging sweep
    const sweepOsc = this.ctx.createOscillator();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(120, t + 0.05);
    sweepOsc.frequency.exponentialRampToValueAtTime(15625, t + 0.6);

    const sweepGain = this.ctx.createGain();
    sweepGain.gain.setValueAtTime(0.001, t);
    sweepGain.gain.linearRampToValueAtTime(0.04, t + 0.2);
    sweepGain.gain.exponentialRampToValueAtTime(0.005, t + 0.7);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweepOsc.start(t + 0.05);
    sweepOsc.stop(t + 0.75);

    setTimeout(() => this.startCRTHum(), 600);
  }

  // Chinese Landline Phone Ring (450Hz pure tone burst)
  playPhoneRing() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);

    // Bell modulation (25Hz tremolo)
    const mod = this.ctx.createOscillator();
    mod.frequency.setValueAtTime(25, t);
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(0.3, t);
    mod.connect(modGain.gain);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.setValueAtTime(0.18, t + 0.95);
    gain.gain.linearRampToValueAtTime(0, t + 1.0);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.05);
  }

  // Phone Off-hook Click
  playPhonePickup() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Phone Busy Tone (Standard 450Hz, 350ms on / 350ms off)
  playBusyTone(durationSec = 2.5) {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const count = Math.floor(durationSec / 0.7);

    for (let i = 0; i < count; i++) {
      const startTime = t + i * 0.7;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.setValueAtTime(0.15, startTime + 0.33);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    }
  }

  // 2010 Mechanical/Membrane Keyboard Keystroke
  playKeyClick() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freq = 600 + Math.random() * 400;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.035);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Digital Clock Tick (subtle quartz tick)
  playClockTick() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.015);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
  }

  // Windows XP System Click / Button Click
  playButtonClick() {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

window.soundEngine = new SoundEngine();
