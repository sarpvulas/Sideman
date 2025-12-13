/**
 * Simple Piano Synthesizer using Web Audio API
 * Plays piano-like sounds for chord voicings
 */

// Note frequencies (A4 = 440Hz)
const NOTE_FREQUENCIES: Record<string, number> = {
  "C": 261.63,
  "C#": 277.18, "Db": 277.18,
  "D": 293.66,
  "D#": 311.13, "Eb": 311.13,
  "E": 329.63,
  "F": 349.23,
  "F#": 369.99, "Gb": 369.99,
  "G": 392.00,
  "G#": 415.30, "Ab": 415.30,
  "A": 440.00,
  "A#": 466.16, "Bb": 466.16,
  "B": 493.88,
};

/**
 * Get frequency for a note with octave (e.g., "C4", "Eb3")
 */
function getNoteFrequency(noteWithOctave: string): number {
  const match = noteWithOctave.match(/^([A-G][#b]?)(\d)$/);
  if (!match) return 440;

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const baseFreq = NOTE_FREQUENCIES[note] || 440;

  // Adjust for octave (base frequencies are for octave 4)
  const octaveDiff = octave - 4;
  return baseFreq * Math.pow(2, octaveDiff);
}

/**
 * Piano synthesizer class
 */
export class PianoSynth {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  init(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    }

    // Resume if suspended
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  /**
   * Play a single note
   */
  playNote(noteWithOctave: string, duration: number = 1.5): void {
    if (!this.audioContext || !this.masterGain) {
      this.init();
    }

    const ctx = this.audioContext!;
    const freq = getNoteFrequency(noteWithOctave);
    const now = ctx.currentTime;

    // Create oscillators for richer sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Main tone (sine for clean sound)
    osc1.type = "sine";
    osc1.frequency.value = freq;

    // Slight detune for richness
    osc2.type = "triangle";
    osc2.frequency.value = freq * 2; // One octave up (harmonic)

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.1); // Decay
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Release

    // Connect
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain!);

    // Play
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Play multiple notes simultaneously (chord)
   */
  playChord(notes: string[], duration: number = 2): void {
    if (!this.audioContext || !this.masterGain) {
      this.init();
    }

    // Play all notes at once
    notes.forEach((note) => {
      this.playNote(note, duration);
    });
  }

  /**
   * Play notes as an arpeggio (one after another)
   */
  playArpeggio(notes: string[], noteDelay: number = 0.15, noteDuration: number = 1.5): void {
    if (!this.audioContext || !this.masterGain) {
      this.init();
    }

    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playNote(note, noteDuration);
      }, index * noteDelay * 1000);
    });
  }

  /**
   * Clean up
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// Singleton instance
let synthInstance: PianoSynth | null = null;

/**
 * Get the piano synth instance
 */
export function getPianoSynth(): PianoSynth {
  if (!synthInstance) {
    synthInstance = new PianoSynth();
  }
  return synthInstance;
}
