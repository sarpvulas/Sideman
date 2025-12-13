import type { ChordSymbol, ChordQuality } from "@/types";

const ROOT_PATTERN = /^([A-G][#b]?)/;
const QUALITY_PATTERNS: { pattern: RegExp; quality: ChordQuality }[] = [
  { pattern: /maj7|M7|Δ7?/, quality: "major7" },
  { pattern: /ø7?|m7b5|min7b5|-7b5/, quality: "half-diminished" }, // Must be before m7
  { pattern: /m7|min7|-7/, quality: "minor7" },
  { pattern: /dim7|°7/, quality: "diminished7" },
  { pattern: /dim|°/, quality: "diminished" },
  { pattern: /aug|\+/, quality: "augmented" },
  { pattern: /7/, quality: "dominant7" },
  { pattern: /m|min|-/, quality: "minor" },
];

const EXTENSION_PATTERN = /([b#]?(?:9|11|13))/g;
const BASS_PATTERN = /\/([A-G][#b]?)$/;

export function parseChordSymbol(symbol: string): ChordSymbol | null {
  if (!symbol || typeof symbol !== "string") {
    return null;
  }

  const trimmed = symbol.trim();
  if (!trimmed) {
    return null;
  }

  // Extract root
  const rootMatch = trimmed.match(ROOT_PATTERN);
  if (!rootMatch) {
    return null;
  }
  const root = rootMatch[1];

  // Extract bass note (slash chord)
  const bassMatch = trimmed.match(BASS_PATTERN);
  const bass = bassMatch ? bassMatch[1] : null;

  // Remove root and bass for quality analysis
  let remainder = trimmed.slice(root.length);
  if (bass) {
    remainder = remainder.slice(0, -bass.length - 1);
  }

  // Extract quality
  let quality: ChordQuality = "major";
  for (const { pattern, quality: q } of QUALITY_PATTERNS) {
    if (pattern.test(remainder)) {
      quality = q;
      remainder = remainder.replace(pattern, "");
      break;
    }
  }

  // Extract extensions
  const extensions: string[] = [];
  let extMatch;
  while ((extMatch = EXTENSION_PATTERN.exec(remainder)) !== null) {
    extensions.push(extMatch[1]);
  }

  return {
    root,
    quality,
    extensions,
    bass,
  };
}

export function getChordNotes(
  chordSymbol: string,
  options?: { voicing?: "shell" | "rootless-a" | "rootless-b" | "full" }
): string[] {
  const parsed = parseChordSymbol(chordSymbol);
  if (!parsed) return [];

  const { root, quality } = parsed;
  const voicing = options?.voicing ?? "full";

  // Note intervals (semitones from root)
  const intervals: Record<ChordQuality, number[]> = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    dominant7: [0, 4, 7, 10],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    "half-diminished": [0, 3, 6, 10],
    diminished7: [0, 3, 6, 9],
    augmented7: [0, 4, 8, 10],
    minorMajor7: [0, 3, 7, 11],
  };

  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootIndex = notes.indexOf(root.replace("b", "#").replace("Db", "C#").replace("Eb", "D#").replace("Gb", "F#").replace("Ab", "G#").replace("Bb", "A#"));

  if (rootIndex === -1) return [];

  const chordIntervals = intervals[quality] || intervals.major;

  // Apply voicing
  let finalIntervals = chordIntervals;
  if (voicing === "shell" && chordIntervals.length >= 4) {
    // Root, 3rd, 7th
    finalIntervals = [chordIntervals[0], chordIntervals[1], chordIntervals[3]];
  } else if (voicing === "rootless-a" && chordIntervals.length >= 4) {
    // 3rd, 5th, 7th, 9th (approximated as 2 semitones above root)
    finalIntervals = [chordIntervals[1], chordIntervals[2], chordIntervals[3], 2];
  } else if (voicing === "rootless-b" && chordIntervals.length >= 4) {
    // 7th, 9th, 3rd, 5th
    finalIntervals = [chordIntervals[3], 2, chordIntervals[1], chordIntervals[2]];
  }

  return finalIntervals.map((interval) => notes[(rootIndex + interval) % 12]);
}

export function noteToMidi(note: string): number {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const match = note.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return -1;

  let noteName = match[1];
  const octave = parseInt(match[2], 10);

  // Normalize flats to sharps
  noteName = noteName.replace("Db", "C#").replace("Eb", "D#").replace("Gb", "F#").replace("Ab", "G#").replace("Bb", "A#");

  const noteIndex = notes.indexOf(noteName);
  if (noteIndex === -1) return -1;

  return (octave + 1) * 12 + noteIndex;
}

export function midiToNote(midi: number): string {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${notes[noteIndex]}${octave}`;
}
