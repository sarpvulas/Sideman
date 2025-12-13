/**
 * Chord inference from detected pitches
 * Maps pitch classes to chord symbols with voicing classification
 */

import { DetectedPitch, pitchesToPitchClasses } from "./pitch";
import { ChordQuality, VoicingType } from "@/types";

export interface ChordInferenceResult {
  chord: string | null;
  root: string;
  quality: ChordQuality;
  voicingType: VoicingType;
  confidence: number;
  pitchClasses: number[];
  matchedTemplate: number[] | null;
}

// Note names for display
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Chord templates as intervals from root (pitch class sets)
// Each template is [root, ...intervals relative to root]
const CHORD_TEMPLATES: { quality: ChordQuality; intervals: number[]; symbol: string }[] = [
  // Seventh chords
  { quality: "major7", intervals: [0, 4, 7, 11], symbol: "maj7" },
  { quality: "dominant7", intervals: [0, 4, 7, 10], symbol: "7" },
  { quality: "minor7", intervals: [0, 3, 7, 10], symbol: "m7" },
  { quality: "half-diminished", intervals: [0, 3, 6, 10], symbol: "m7b5" },
  { quality: "diminished7", intervals: [0, 3, 6, 9], symbol: "dim7" },
  { quality: "augmented7", intervals: [0, 4, 8, 10], symbol: "aug7" },
  { quality: "minorMajor7", intervals: [0, 3, 7, 11], symbol: "mMaj7" },

  // Triads (for incomplete voicings)
  { quality: "major", intervals: [0, 4, 7], symbol: "" },
  { quality: "minor", intervals: [0, 3, 7], symbol: "m" },
  { quality: "diminished", intervals: [0, 3, 6], symbol: "dim" },
  { quality: "augmented", intervals: [0, 4, 8], symbol: "aug" },
];

// Shell voicing patterns (3rd and 7th only)
const SHELL_TEMPLATES: { quality: ChordQuality; intervals: number[] }[] = [
  { quality: "major7", intervals: [4, 11] },  // 3rd and maj7
  { quality: "dominant7", intervals: [4, 10] }, // 3rd and b7
  { quality: "minor7", intervals: [3, 10] },  // b3rd and b7
  { quality: "half-diminished", intervals: [3, 10] }, // b3rd and b7 (same as m7)
];

// Rootless voicing patterns (Type A and Type B)
const ROOTLESS_TYPE_A: { quality: ChordQuality; intervals: number[] }[] = [
  { quality: "major7", intervals: [4, 7, 11, 14] }, // 3, 5, 7, 9
  { quality: "dominant7", intervals: [4, 7, 10, 14] }, // 3, 5, 7, 9
  { quality: "minor7", intervals: [3, 7, 10, 14] }, // b3, 5, b7, 9
];

const ROOTLESS_TYPE_B: { quality: ChordQuality; intervals: number[] }[] = [
  { quality: "major7", intervals: [11, 14, 16, 19] }, // 7, 9, 3, 5 (upper structure)
  { quality: "dominant7", intervals: [10, 14, 16, 19] }, // b7, 9, 3, 5
  { quality: "minor7", intervals: [10, 14, 15, 19] }, // b7, 9, b3, 5
];

/**
 * Normalize pitch classes to start from a given root
 */
function normalizePitchClasses(pitchClasses: number[], root: number): number[] {
  return pitchClasses.map(pc => ((pc - root) % 12 + 12) % 12).sort((a, b) => a - b);
}

/**
 * Calculate how well a set of pitch classes matches a template
 * Returns a score from 0 to 1
 */
function matchScore(pitchClasses: number[], template: number[]): number {
  if (pitchClasses.length === 0 || template.length === 0) return 0;

  const pcSet = new Set(pitchClasses);
  const templateSet = new Set(template);

  // Count matches
  let matches = 0;
  for (const pc of pitchClasses) {
    if (templateSet.has(pc)) matches++;
  }

  // Penalize missing template notes
  let missing = 0;
  for (const t of template) {
    if (!pcSet.has(t)) missing++;
  }

  // Score based on matches and completeness
  const matchRatio = matches / pitchClasses.length;
  const completeness = (template.length - missing) / template.length;

  return matchRatio * 0.6 + completeness * 0.4;
}

/**
 * Detect voicing type from pitch configuration
 */
function detectVoicingType(
  pitchClasses: number[],
  root: number,
  quality: ChordQuality
): VoicingType {
  const normalized = normalizePitchClasses(pitchClasses, root);

  // Check for shell voicing (only 2 notes: 3rd and 7th)
  if (pitchClasses.length === 2) {
    for (const shell of SHELL_TEMPLATES) {
      if (shell.quality === quality) {
        const shellNorm = shell.intervals.map(i => i % 12);
        if (normalized.every(pc => shellNorm.includes(pc))) {
          return "shell";
        }
      }
    }
  }

  // Check for rootless voicing (no root present)
  if (!normalized.includes(0)) {
    // Could be rootless Type A or B
    return "rootless";
  }

  // Check for drop-2 voicing pattern
  // Drop-2 has wider spacing between voices
  if (pitchClasses.length >= 4) {
    // Simplified check: if second highest note is dropped an octave
    return "drop-2";
  }

  // Check for quartal voicing (built on 4ths)
  const hasQuartalSpacing = normalized.some((pc, i) => {
    if (i === 0) return false;
    const interval = pc - normalized[i - 1];
    return interval === 5 || interval === 6; // Perfect 4th or tritone
  });

  if (hasQuartalSpacing && pitchClasses.length >= 3) {
    return "quartal";
  }

  return "shell"; // Default to simplest
}

/**
 * Infer chord from detected pitches
 */
export function inferChord(pitches: DetectedPitch[]): ChordInferenceResult {
  const pitchClasses = pitchesToPitchClasses(pitches);

  if (pitchClasses.length === 0) {
    return {
      chord: null,
      root: "",
      quality: "major",
      voicingType: "shell",
      confidence: 0,
      pitchClasses: [],
      matchedTemplate: null,
    };
  }

  let bestMatch: {
    root: number;
    quality: ChordQuality;
    symbol: string;
    score: number;
    template: number[];
  } | null = null;

  // Try each pitch class as potential root
  for (const rootPc of pitchClasses) {
    const normalized = normalizePitchClasses(pitchClasses, rootPc);

    // Try each chord template
    for (const template of CHORD_TEMPLATES) {
      const score = matchScore(normalized, template.intervals);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          root: rootPc,
          quality: template.quality,
          symbol: template.symbol,
          score,
          template: template.intervals,
        };
      }
    }
  }

  if (!bestMatch || bestMatch.score < 0.5) {
    return {
      chord: null,
      root: "",
      quality: "major",
      voicingType: "shell",
      confidence: 0,
      pitchClasses,
      matchedTemplate: null,
    };
  }

  const rootName = NOTE_NAMES[bestMatch.root];
  const voicingType = detectVoicingType(pitchClasses, bestMatch.root, bestMatch.quality);

  return {
    chord: `${rootName}${bestMatch.symbol}`,
    root: rootName,
    quality: bestMatch.quality,
    voicingType,
    confidence: bestMatch.score,
    pitchClasses,
    matchedTemplate: bestMatch.template,
  };
}

/**
 * Compare detected chord with expected chord
 */
export function compareChords(
  detected: ChordInferenceResult,
  expectedChord: string,
  expectedVoicing: VoicingType
): {
  chordMatch: boolean;
  voicingMatch: boolean;
  feedback: string[];
} {
  const feedback: string[] = [];

  // Parse expected chord
  const expectedRoot = expectedChord.match(/^[A-G][#b]?/)?.[0] || "";

  // Check root match
  const rootMatch = detected.root === expectedRoot ||
    (detected.root === expectedRoot.replace("b", "#")); // Handle enharmonic

  if (!rootMatch && detected.chord) {
    feedback.push(`Root note: expected ${expectedRoot}, heard ${detected.root}`);
  }

  // Check chord quality match
  const chordMatch = detected.chord?.toLowerCase() === expectedChord.toLowerCase();

  if (!chordMatch && detected.chord) {
    feedback.push(`Chord quality: expected ${expectedChord}, heard ${detected.chord}`);
  }

  // Check voicing match
  const voicingMatch = detected.voicingType === expectedVoicing;

  if (!voicingMatch) {
    feedback.push(`Voicing: expected ${expectedVoicing}, detected ${detected.voicingType}`);
  }

  // Add helpful suggestions
  if (detected.confidence < 0.7) {
    feedback.push("Try playing the notes more clearly and evenly");
  }

  if (detected.pitchClasses.length < 3) {
    feedback.push("Not enough notes detected. Make sure all chord tones are audible");
  }

  return {
    chordMatch,
    voicingMatch,
    feedback,
  };
}
