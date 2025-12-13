/**
 * Pitch detection and note identification
 */

import { fft, computeMagnitudeSpectrum, findPeaks, binToFrequency, padToPowerOf2 } from "./fft";
import { applyHannWindow } from "./decode";

// Standard A4 frequency for tuning
const A4_FREQ = 440;
const A4_MIDI = 69;

// Note names
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface DetectedPitch {
  frequency: number;
  midi: number;
  note: string;
  octave: number;
  cents: number; // Deviation from perfect pitch
  magnitude: number;
}

/**
 * Convert frequency to MIDI note number
 */
export function frequencyToMidi(frequency: number): number {
  return 12 * Math.log2(frequency / A4_FREQ) + A4_MIDI;
}

/**
 * Convert MIDI note number to frequency
 */
export function midiToFrequency(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Get note name and octave from MIDI number
 */
export function midiToNoteName(midi: number): { note: string; octave: number } {
  const roundedMidi = Math.round(midi);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  return { note: NOTE_NAMES[noteIndex], octave };
}

/**
 * Calculate cents deviation from nearest note
 */
export function calculateCents(frequency: number): number {
  const midi = frequencyToMidi(frequency);
  const roundedMidi = Math.round(midi);
  return (midi - roundedMidi) * 100;
}

/**
 * Detect multiple pitches in audio samples
 */
export function detectPitches(
  samples: Float32Array,
  sampleRate: number,
  options: {
    minFrequency?: number;
    maxFrequency?: number;
    threshold?: number;
    maxPitches?: number;
  } = {}
): DetectedPitch[] {
  const {
    minFrequency = 50, // Below piano range
    maxFrequency = 5000, // Above most musical content
    threshold = 0.1,
    maxPitches = 12,
  } = options;

  // Pad and window the samples
  const padded = padToPowerOf2(samples);
  const windowed = applyHannWindow(padded);

  // Perform FFT
  const real = new Float32Array(windowed);
  const imag = new Float32Array(windowed.length);
  const { real: fftReal, imag: fftImag } = fft(real, imag);

  // Get magnitude spectrum
  const magnitude = computeMagnitudeSpectrum(fftReal, fftImag);

  // Find peaks
  const minBin = Math.floor((minFrequency * padded.length) / sampleRate);
  const maxBin = Math.ceil((maxFrequency * padded.length) / sampleRate);

  // Create a view of the relevant frequency range
  const relevantMagnitude = magnitude.slice(minBin, maxBin);
  const peakIndices = findPeaks(relevantMagnitude, threshold, 3);

  // Convert peaks to pitches
  const pitches: DetectedPitch[] = peakIndices.map((localIdx) => {
    const binIdx = localIdx + minBin;
    const frequency = binToFrequency(binIdx, padded.length, sampleRate);
    const midi = frequencyToMidi(frequency);
    const { note, octave } = midiToNoteName(midi);
    const cents = calculateCents(frequency);

    return {
      frequency,
      midi,
      note,
      octave,
      cents,
      magnitude: relevantMagnitude[localIdx],
    };
  });

  // Sort by magnitude and limit
  return pitches
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, maxPitches);
}

/**
 * Convert detected pitches to pitch classes (0-11)
 * This normalizes octave information for chord detection
 */
export function pitchesToPitchClasses(pitches: DetectedPitch[]): number[] {
  const classes = new Set<number>();

  for (const pitch of pitches) {
    const roundedMidi = Math.round(pitch.midi);
    const pitchClass = ((roundedMidi % 12) + 12) % 12;
    classes.add(pitchClass);
  }

  return Array.from(classes).sort((a, b) => a - b);
}

/**
 * Group detected pitches by note name
 * Useful for finding the strongest octave of each note
 */
export function groupByNoteName(
  pitches: DetectedPitch[]
): Map<string, DetectedPitch[]> {
  const groups = new Map<string, DetectedPitch[]>();

  for (const pitch of pitches) {
    const key = pitch.note;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(pitch);
  }

  return groups;
}
