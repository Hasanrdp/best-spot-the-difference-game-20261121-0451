// Synthesised sound effects through WebAudio: no audio files, no network.
// The context is created on the first user gesture, so browsers allow it.

export function createAudio() {
  const audio = {
    context: null,
    muted: false,
    ensure() {
      if (this.context) {
        if (this.context.state === 'suspended') void this.context.resume();
        return true;
      }
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return false;
        this.context = new Ctor();
        return true;
      } catch {
        return false;
      }
    },
    tone(freq, startIn, duration, type, volume) {
      if (!this.context || this.muted) return;
      const now = this.context.currentTime + startIn;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(this.context.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    },
    click() {
      if (!this.ensure()) return;
      this.tone(660, 0, 0.07, 'triangle', 0.12);
    },
    found() {
      if (!this.ensure()) return;
      this.tone(523.25, 0, 0.14, 'sine', 0.22);
      this.tone(659.25, 0.09, 0.14, 'sine', 0.22);
      this.tone(783.99, 0.18, 0.26, 'sine', 0.24);
    },
    wrong() {
      if (!this.ensure()) return;
      this.tone(160, 0, 0.22, 'sawtooth', 0.14);
      this.tone(110, 0.05, 0.26, 'sawtooth', 0.12);
    },
    hint() {
      if (!this.ensure()) return;
      this.tone(880, 0, 0.1, 'sine', 0.14);
      this.tone(1174.66, 0.08, 0.16, 'sine', 0.14);
    },
    clear() {
      if (!this.ensure()) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => this.tone(freq, i * 0.11, 0.22, 'triangle', 0.2));
    },
    victory() {
      if (!this.ensure()) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => this.tone(freq, i * 0.13, 0.3, 'triangle', 0.2));
    },
    over() {
      if (!this.ensure()) return;
      const notes = [392, 329.63, 261.63, 196];
      notes.forEach((freq, i) => this.tone(freq, i * 0.16, 0.3, 'sine', 0.16));
    },
  };
  return audio;
}
