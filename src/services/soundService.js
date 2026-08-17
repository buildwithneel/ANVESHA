/**
 * RailGuard AI - Native Web Audio API Sound Synthesizer
 * Generates subtle, crisp operational auditory cues without external audio asset dependencies.
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.isEnabled = true;
    this.lastPlayedTime = 0;
    this.debounceMs = 2500;

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('railguard_sound_enabled');
      this.isEnabled = saved !== null ? saved === 'true' : true;
    }
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  isSoundEnabled() {
    return this.isEnabled;
  }

  setSoundEnabled(enabled) {
    this.isEnabled = Boolean(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('railguard_sound_enabled', String(enabled));
    }
  }

  toggleSound() {
    this.setSoundEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  /**
   * Plays a professional double-tone operational chime for CRITICAL safety threats.
   * High and Warning alerts use visual cues as per operational specification.
   */
  playAlertSound(severity = 'CRITICAL') {
    if (!this.isEnabled) return;
    const sev = (severity || '').toUpperCase();
    if (sev !== 'CRITICAL') return;

    const now = Date.now();
    if (now - this.lastPlayedTime < this.debounceMs) {
      return; // Suppress duplicate audio burst
    }
    this.lastPlayedTime = now;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const ctx = this.audioCtx;
      const t = ctx.currentTime;

      // Primary oscillator - 880Hz (A5) to 660Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, t);
      osc1.frequency.exponentialRampToValueAtTime(660, t + 0.15);

      gain1.gain.setValueAtTime(0.001, t);
      gain1.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.25);

      // Harmonic secondary chime - 1174Hz (D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174, t + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(880, t + 0.32);

      gain2.gain.setValueAtTime(0.001, t + 0.12);
      gain2.gain.linearRampToValueAtTime(0.14, t + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t + 0.12);
      osc2.stop(t + 0.40);
    } catch (e) {
      console.warn('[SoundService] Audio playback exception:', e);
    }
  }
}

export const soundService = new SoundService();
export default soundService;
