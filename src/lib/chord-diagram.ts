/**
 * SVG Chord Diagram Generator
 * Creates visual chord diagrams with highlighted keys
 */

import type { VoicingType, NoteHighlight } from "@/types";

export interface ChordDiagramConfig {
  width: number;
  height: number;
  startOctave: number;
  endOctave: number;
  showLabels: boolean;
  voicingType: VoicingType;
}

const DEFAULT_CONFIG: ChordDiagramConfig = {
  width: 600,
  height: 200,
  startOctave: 3,
  endOctave: 5,
  showLabels: true,
  voicingType: "shell",
};

// Key dimensions
const WHITE_KEY_WIDTH = 30;
const WHITE_KEY_HEIGHT = 140;
const BLACK_KEY_WIDTH = 20;
const BLACK_KEY_HEIGHT = 90;

// Colors by role
const ROLE_COLORS: Record<string, string> = {
  root: "#4ade80", // Green
  third: "#60a5fa", // Blue
  fifth: "#a78bfa", // Purple
  seventh: "#f472b6", // Pink
  tension: "#facc15", // Yellow
};

const ROLE_LABELS: Record<string, string> = {
  root: "R",
  third: "3",
  fifth: "5",
  seventh: "7",
  tension: "T",
};

// Note positions (semitones from C)
const NOTE_SEMITONES: Record<string, number> = {
  C: 0, "C#": 1, Db: 1,
  D: 2, "D#": 3, Eb: 3,
  E: 4, F: 5, "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8,
  A: 9, "A#": 10, Bb: 10,
  B: 11,
};

const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_NOTES = ["C#", "D#", "F#", "G#", "A#"];

/**
 * Calculate the X position of a key
 */
function getKeyX(note: string, octave: number, startOctave: number): number {
  const octaveOffset = (octave - startOctave) * 7 * WHITE_KEY_WIDTH;
  const noteName = note.replace(/\d/, "");
  const baseNote = noteName.replace("#", "").replace("b", "");

  const whiteKeyIndex = WHITE_NOTES.indexOf(baseNote);
  const isBlack = BLACK_NOTES.includes(noteName) || noteName.includes("#") || noteName.includes("b");

  if (isBlack) {
    // Black key position is between white keys
    const semitone = NOTE_SEMITONES[noteName];
    // Map semitone to position
    const blackKeyOffsets: Record<number, number> = {
      1: 0.7, // C#
      3: 1.7, // D#
      6: 3.7, // F#
      8: 4.7, // G#
      10: 5.7, // A#
    };
    return octaveOffset + (blackKeyOffsets[semitone] || 0) * WHITE_KEY_WIDTH;
  }

  return octaveOffset + whiteKeyIndex * WHITE_KEY_WIDTH;
}

/**
 * Check if a note is a black key
 */
function isBlackKey(noteName: string): boolean {
  const name = noteName.replace(/\d/, "");
  return name.includes("#") || name.includes("b");
}

/**
 * Generate SVG for a single key
 */
function generateKeySVG(
  note: string,
  octave: number,
  startOctave: number,
  highlight?: NoteHighlight,
  showLabel: boolean = true
): string {
  const noteName = note.replace(/\d/, "");
  const isBlack = isBlackKey(noteName);
  const x = getKeyX(noteName, octave, startOctave);
  const y = 10;

  const width = isBlack ? BLACK_KEY_WIDTH : WHITE_KEY_WIDTH;
  const height = isBlack ? BLACK_KEY_HEIGHT : WHITE_KEY_HEIGHT;

  // Default colors
  let fillColor = isBlack ? "#1a1a2e" : "#f5f5f5";
  let strokeColor = "#333";
  let textColor = isBlack ? "#fff" : "#333";

  // Highlighted colors
  if (highlight) {
    fillColor = ROLE_COLORS[highlight.role] || ROLE_COLORS.root;
    textColor = "#fff";
  }

  let svg = `
    <rect
      x="${x}"
      y="${y}"
      width="${width - 1}"
      height="${height}"
      rx="3"
      fill="${fillColor}"
      stroke="${strokeColor}"
      stroke-width="1"
    />
  `;

  // Add label if highlighted
  if (highlight && showLabel) {
    const labelY = y + height - 15;
    const labelX = x + width / 2;

    svg += `
      <text
        x="${labelX}"
        y="${labelY}"
        text-anchor="middle"
        font-size="12"
        font-weight="bold"
        fill="${textColor}"
      >${ROLE_LABELS[highlight.role] || highlight.role}</text>
    `;

    // Also show note name
    svg += `
      <text
        x="${labelX}"
        y="${labelY - 15}"
        text-anchor="middle"
        font-size="10"
        fill="${textColor}"
      >${noteName}</text>
    `;
  }

  return svg;
}

/**
 * Generate complete SVG chord diagram
 */
export function generateChordDiagramSVG(
  highlightedNotes: NoteHighlight[],
  config: Partial<ChordDiagramConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { startOctave, endOctave, showLabels } = finalConfig;

  // Create a map for quick lookup
  const highlightMap = new Map<string, NoteHighlight>();
  highlightedNotes.forEach((note) => {
    highlightMap.set(note.note, note);
  });

  const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Calculate width based on octaves
  const octaveCount = endOctave - startOctave + 1;
  const width = octaveCount * 7 * WHITE_KEY_WIDTH + 20;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${WHITE_KEY_HEIGHT + 20}">`;

  // Background
  svg += `<rect width="${width}" height="${WHITE_KEY_HEIGHT + 20}" fill="#0d0d0d" rx="8"/>`;

  // Generate white keys first (behind black keys)
  for (let octave = startOctave; octave <= endOctave; octave++) {
    WHITE_NOTES.forEach((noteName) => {
      const fullNote = `${noteName}${octave}`;
      const highlight = highlightMap.get(fullNote);
      svg += generateKeySVG(noteName, octave, startOctave, highlight, showLabels);
    });
  }

  // Generate black keys (on top)
  for (let octave = startOctave; octave <= endOctave; octave++) {
    BLACK_NOTES.forEach((noteName) => {
      const fullNote = `${noteName}${octave}`;
      const highlight = highlightMap.get(fullNote);
      svg += generateKeySVG(noteName, octave, startOctave, highlight, showLabels);
    });
  }

  svg += "</svg>";

  return svg;
}

/**
 * Generate a data URL for the SVG
 */
export function generateChordDiagramDataURL(
  highlightedNotes: NoteHighlight[],
  config: Partial<ChordDiagramConfig> = {}
): string {
  const svg = generateChordDiagramSVG(highlightedNotes, config);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Convert chord notes to highlighted notes for diagram
 */
export function chordToHighlights(
  chordNotes: string[],
  voicingType: VoicingType
): NoteHighlight[] {
  return chordNotes.map((note, index) => {
    let role: NoteHighlight["role"];

    // Assign roles based on position in voicing
    if (index === 0) {
      role = "root";
    } else if (index === 1) {
      role = "third";
    } else if (index === 2 && chordNotes.length === 3) {
      // Shell voicing: root, 3rd, 7th
      role = voicingType === "shell" ? "seventh" : "fifth";
    } else if (index === 2) {
      role = "fifth";
    } else {
      role = "seventh";
    }

    return { note, role };
  });
}
