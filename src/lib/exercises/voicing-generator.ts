/**
 * Chord Voicing Exercise Generator
 * Generates different voicing types for jazz chords
 */

import type { NoteRole } from "@/types";

export type VoicingType = "shell" | "rootless-a" | "rootless-b" | "drop-2" | "full";

export interface VoicingExercise {
  type: VoicingType;
  name: string;
  description: string;
  notes: { note: string; role: NoteRole }[];
}

// Note names in chromatic order
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Enharmonic mappings (prefer flats for jazz)
const ENHARMONIC_TO_FLAT: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

// Chord quality intervals (semitones from root)
const CHORD_INTERVALS: Record<string, { third: number; fifth: number; seventh: number; ninth?: number }> = {
  // Major family
  "maj7": { third: 4, fifth: 7, seventh: 11, ninth: 14 },
  "M7": { third: 4, fifth: 7, seventh: 11, ninth: 14 },
  "Δ7": { third: 4, fifth: 7, seventh: 11, ninth: 14 },
  "Δ": { third: 4, fifth: 7, seventh: 11, ninth: 14 },
  "": { third: 4, fifth: 7, seventh: 11, ninth: 14 }, // Major triad treated as maj7

  // Dominant family
  "7": { third: 4, fifth: 7, seventh: 10, ninth: 14 },
  "9": { third: 4, fifth: 7, seventh: 10, ninth: 14 },
  "13": { third: 4, fifth: 7, seventh: 10, ninth: 14 },
  "7#11": { third: 4, fifth: 7, seventh: 10, ninth: 14 },
  "7alt": { third: 4, fifth: 6, seventh: 10, ninth: 13 },

  // Minor family
  "m7": { third: 3, fifth: 7, seventh: 10, ninth: 14 },
  "-7": { third: 3, fifth: 7, seventh: 10, ninth: 14 },
  "min7": { third: 3, fifth: 7, seventh: 10, ninth: 14 },
  "m9": { third: 3, fifth: 7, seventh: 10, ninth: 14 },
  "m": { third: 3, fifth: 7, seventh: 10, ninth: 14 },

  // Minor-major
  "mM7": { third: 3, fifth: 7, seventh: 11, ninth: 14 },
  "m(maj7)": { third: 3, fifth: 7, seventh: 11, ninth: 14 },

  // Half-diminished
  "m7b5": { third: 3, fifth: 6, seventh: 10, ninth: 13 },
  "ø7": { third: 3, fifth: 6, seventh: 10, ninth: 13 },
  "ø": { third: 3, fifth: 6, seventh: 10, ninth: 13 },

  // Diminished
  "dim7": { third: 3, fifth: 6, seventh: 9, ninth: 12 },
  "°7": { third: 3, fifth: 6, seventh: 9, ninth: 12 },
  "°": { third: 3, fifth: 6, seventh: 9, ninth: 12 },

  // Augmented
  "aug7": { third: 4, fifth: 8, seventh: 10, ninth: 14 },
  "+7": { third: 4, fifth: 8, seventh: 10, ninth: 14 },
  "7#5": { third: 4, fifth: 8, seventh: 10, ninth: 14 },
};

/**
 * Parse a chord symbol into root and quality
 */
function parseChordSymbol(chordSymbol: string): { root: string; quality: string } {
  // Handle flat and sharp roots
  const rootMatch = chordSymbol.match(/^([A-G][b#]?)/);
  if (!rootMatch) {
    return { root: "C", quality: "maj7" };
  }

  const root = rootMatch[1];
  const quality = chordSymbol.slice(root.length) || "maj7";

  return { root, quality };
}

/**
 * Convert root note to chromatic index
 */
function noteToIndex(note: string): number {
  // Handle flats
  const flatToSharp: Record<string, string> = {
    "Db": "C#",
    "Eb": "D#",
    "Gb": "F#",
    "Ab": "G#",
    "Bb": "A#",
  };

  const normalizedNote = flatToSharp[note] || note;
  return NOTES.indexOf(normalizedNote);
}

/**
 * Convert chromatic index to note name (with jazz-friendly enharmonics)
 */
function indexToNote(index: number, preferFlats: boolean = true): string {
  const note = NOTES[((index % 12) + 12) % 12];
  if (preferFlats && ENHARMONIC_TO_FLAT[note]) {
    return ENHARMONIC_TO_FLAT[note];
  }
  return note;
}

/**
 * Get chord tones from chord symbol
 */
function getChordTones(chordSymbol: string): { root: string; third: string; fifth: string; seventh: string; ninth: string } {
  const { root, quality } = parseChordSymbol(chordSymbol);
  const rootIndex = noteToIndex(root);

  // Find matching quality or default to maj7
  let intervals = CHORD_INTERVALS[quality];
  if (!intervals) {
    // Try to find partial match
    for (const [key, value] of Object.entries(CHORD_INTERVALS)) {
      if (quality.includes(key) || key.includes(quality)) {
        intervals = value;
        break;
      }
    }
  }
  if (!intervals) {
    intervals = CHORD_INTERVALS["maj7"];
  }

  // Jazz lead sheets spell with flats unless the root is written with a sharp
  const preferFlats = !root.includes("#");

  return {
    root: root,
    third: indexToNote(rootIndex + intervals.third, preferFlats),
    fifth: indexToNote(rootIndex + intervals.fifth, preferFlats),
    seventh: indexToNote(rootIndex + intervals.seventh, preferFlats),
    ninth: indexToNote(rootIndex + (intervals.ninth || 14), preferFlats),
  };
}

/**
 * Generate shell voicing (Root + 3rd + 7th)
 */
function generateShellVoicing(chordSymbol: string): VoicingExercise {
  const tones = getChordTones(chordSymbol);

  return {
    type: "shell",
    name: "Shell Voicing",
    description: "Root + 3rd + 7th - Essential chord tones that define the harmony",
    notes: [
      { note: `${tones.root}3`, role: "root" },
      { note: `${tones.third}4`, role: "third" },
      { note: `${tones.seventh}4`, role: "seventh" },
    ],
  };
}

/**
 * Generate rootless Type A voicing (3rd + 5th + 7th + 9th)
 * Common for left hand in ii-V-I progressions
 */
function generateRootlessA(chordSymbol: string): VoicingExercise {
  const tones = getChordTones(chordSymbol);

  return {
    type: "rootless-a",
    name: "Rootless Type A",
    description: "3rd + 5th + 7th + 9th - Left hand voicing, bassist plays root",
    notes: [
      { note: `${tones.third}3`, role: "third" },
      { note: `${tones.fifth}3`, role: "fifth" },
      { note: `${tones.seventh}3`, role: "seventh" },
      { note: `${tones.ninth}4`, role: "ninth" },
    ],
  };
}

/**
 * Generate rootless Type B voicing (7th + 9th + 3rd + 5th)
 * Alternative rootless voicing
 */
function generateRootlessB(chordSymbol: string): VoicingExercise {
  const tones = getChordTones(chordSymbol);

  return {
    type: "rootless-b",
    name: "Rootless Type B",
    description: "7th + 9th + 3rd + 5th - Alternative left hand voicing",
    notes: [
      { note: `${tones.seventh}3`, role: "seventh" },
      { note: `${tones.ninth}3`, role: "ninth" },
      { note: `${tones.third}4`, role: "third" },
      { note: `${tones.fifth}4`, role: "fifth" },
    ],
  };
}

/**
 * Generate drop-2 voicing
 * Take close position and drop 2nd voice down an octave
 */
function generateDrop2(chordSymbol: string): VoicingExercise {
  const tones = getChordTones(chordSymbol);

  return {
    type: "drop-2",
    name: "Drop-2 Voicing",
    description: "5th dropped an octave - Rich, spread voicing for comping",
    notes: [
      { note: `${tones.fifth}3`, role: "fifth" },
      { note: `${tones.root}4`, role: "root" },
      { note: `${tones.third}4`, role: "third" },
      { note: `${tones.seventh}4`, role: "seventh" },
    ],
  };
}

/**
 * Generate full voicing with all chord tones
 */
function generateFullVoicing(chordSymbol: string): VoicingExercise {
  const tones = getChordTones(chordSymbol);

  return {
    type: "full",
    name: "Full Voicing",
    description: "Root + 3rd + 5th + 7th + 9th - Complete chord with extension",
    notes: [
      { note: `${tones.root}3`, role: "root" },
      { note: `${tones.third}3`, role: "third" },
      { note: `${tones.fifth}3`, role: "fifth" },
      { note: `${tones.seventh}4`, role: "seventh" },
      { note: `${tones.ninth}4`, role: "ninth" },
    ],
  };
}

/**
 * Generate all voicing exercises for a chord
 */
export function generateVoicingExercises(chordSymbol: string): VoicingExercise[] {
  return [
    generateShellVoicing(chordSymbol),
    generateRootlessA(chordSymbol),
    generateRootlessB(chordSymbol),
    generateDrop2(chordSymbol),
    generateFullVoicing(chordSymbol),
  ];
}

/**
 * Generate a specific voicing exercise
 */
export function generateVoicing(chordSymbol: string, type: VoicingType): VoicingExercise {
  switch (type) {
    case "shell":
      return generateShellVoicing(chordSymbol);
    case "rootless-a":
      return generateRootlessA(chordSymbol);
    case "rootless-b":
      return generateRootlessB(chordSymbol);
    case "drop-2":
      return generateDrop2(chordSymbol);
    case "full":
      return generateFullVoicing(chordSymbol);
    default:
      return generateShellVoicing(chordSymbol);
  }
}
