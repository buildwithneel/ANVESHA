/**
 * Speech Service - Native Browser SpeechSynthesis API for "Read Alert" accessibility.
 * Zero external dependencies; operates fully offline and locally in the operator browser.
 */
class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
  }

  /**
   * Reads alert text aloud using the best matching system voice.
   * @param {string} text - The alert text/description to speak.
   * @param {string} langCode - Language code ('en', 'hi', 'gu').
   * @param {Function} onStart - Callback when audio begins.
   * @param {Function} onEnd - Callback when audio finishes.
   */
  readAlert(text, langCode = 'en', onStart = null, onEnd = null) {
    if (!this.synth) {
      console.warn('[speechService] Browser SpeechSynthesis is not supported in this environment.');
      return false;
    }

    // Stop any ongoing speech
    this.stop();

    if (!text || !text.trim()) return false;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Select voice based on language code
      const voices = this.synth.getVoices() || [];
      const langPrefix = langCode === 'hi' ? 'hi' : langCode === 'gu' ? 'gu' : 'en';

      const matchedVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) ||
        voices.find((v) => v.lang && v.lang.toLowerCase().includes('in')) ||
        null;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.lang = langCode === 'hi' ? 'hi-IN' : langCode === 'gu' ? 'gu-IN' : 'en-IN';
      utterance.rate = 0.92; // Calm, clear railway announcement pace
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (onStart) {
        utterance.onstart = onStart;
      }
      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };
      utterance.onerror = (err) => {
        console.warn('[speechService] Speech error:', err);
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
      return true;
    } catch (err) {
      console.error('[speechService] Failed to speak alert:', err);
      return false;
    }
  }

  /**
   * Immediately stops any active speech announcement.
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Check if speech synthesis is currently active.
   */
  isSpeaking() {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new SpeechService();
export default speechService;
