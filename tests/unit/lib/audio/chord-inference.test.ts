import { describe, it, expect } from "vitest";
import { inferChord, compareChords, ChordInferenceResult } from "@/lib/audio/chord-inference";
import { DetectedPitch } from "@/lib/audio/pitch";

// Helper to create pitches from note names
function createPitches(notes: { note: string; octave: number }[]): DetectedPitch[] {
  const noteToMidi: Record<string, number> = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4, "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11,
  };

  return notes.map(({ note, octave }) => {
    const midi = noteToMidi[note] + (octave + 1) * 12;
    return {
      frequency: 440 * Math.pow(2, (midi - 69) / 12),
      midi,
      note: note.replace("b", "#"), // Normalize to sharps
      octave,
      cents: 0,
      magnitude: 1,
    };
  });
}

describe("Chord inference", () => {
  describe("inferChord", () => {
    it("returns null chord for empty pitches", () => {
      const result = inferChord([]);
      expect(result.chord).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it("detects C major triad", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "E", octave: 4 },
        { note: "G", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("C");
      expect(result.quality).toBe("major");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("detects C minor triad", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "Eb", octave: 4 },
        { note: "G", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("Cm");
      expect(result.quality).toBe("minor");
    });

    it("detects Cmaj7 chord", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "E", octave: 4 },
        { note: "G", octave: 4 },
        { note: "B", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("Cmaj7");
      expect(result.quality).toBe("major7");
    });

    it("detects C7 dominant chord", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "E", octave: 4 },
        { note: "G", octave: 4 },
        { note: "Bb", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("C7");
      expect(result.quality).toBe("dominant7");
    });

    it("detects Cm7 chord", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "Eb", octave: 4 },
        { note: "G", octave: 4 },
        { note: "Bb", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("Cm7");
      expect(result.quality).toBe("minor7");
    });

    it("detects half-diminished chord (m7b5)", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "Eb", octave: 4 },
        { note: "Gb", octave: 4 },
        { note: "Bb", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("Cm7b5");
      expect(result.quality).toBe("half-diminished");
    });

    it("detects diminished 7th chord", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "Eb", octave: 4 },
        { note: "Gb", octave: 4 },
        { note: "A", octave: 4 }, // Bbb = A
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("Cdim7");
      expect(result.quality).toBe("diminished7");
    });

    it("handles inversions", () => {
      // E in bass (first inversion C major)
      const pitches = createPitches([
        { note: "E", octave: 3 },
        { note: "G", octave: 4 },
        { note: "C", octave: 5 },
      ]);

      const result = inferChord(pitches);
      // Should still detect as C major
      expect(result.root).toBe("C");
      expect(result.quality).toBe("major");
    });

    it("works with different roots", () => {
      // G7 chord
      const pitches = createPitches([
        { note: "G", octave: 3 },
        { note: "B", octave: 3 },
        { note: "D", octave: 4 },
        { note: "F", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.chord).toBe("G7");
      expect(result.root).toBe("G");
    });

    it("returns pitch classes", () => {
      const pitches = createPitches([
        { note: "C", octave: 4 },
        { note: "E", octave: 4 },
        { note: "G", octave: 4 },
      ]);

      const result = inferChord(pitches);
      expect(result.pitchClasses).toContain(0); // C
      expect(result.pitchClasses).toContain(4); // E
      expect(result.pitchClasses).toContain(7); // G
    });
  });

  describe("compareChords", () => {
    it("returns match for correct chord and voicing", () => {
      const detected: ChordInferenceResult = {
        chord: "Cmaj7",
        root: "C",
        quality: "major7",
        voicingType: "shell",
        confidence: 0.9,
        pitchClasses: [0, 4, 7, 11],
        matchedTemplate: [0, 4, 7, 11],
      };

      const result = compareChords(detected, "Cmaj7", "shell");
      expect(result.chordMatch).toBe(true);
      expect(result.voicingMatch).toBe(true);
      expect(result.feedback.length).toBe(0);
    });

    it("returns feedback for wrong chord", () => {
      const detected: ChordInferenceResult = {
        chord: "Cm7",
        root: "C",
        quality: "minor7",
        voicingType: "shell",
        confidence: 0.9,
        pitchClasses: [0, 3, 7, 10],
        matchedTemplate: [0, 3, 7, 10],
      };

      const result = compareChords(detected, "Cmaj7", "shell");
      expect(result.chordMatch).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it("returns feedback for wrong voicing", () => {
      const detected: ChordInferenceResult = {
        chord: "Cmaj7",
        root: "C",
        quality: "major7",
        voicingType: "rootless",
        confidence: 0.9,
        pitchClasses: [0, 4, 7, 11],
        matchedTemplate: [0, 4, 7, 11],
      };

      const result = compareChords(detected, "Cmaj7", "shell");
      expect(result.voicingMatch).toBe(false);
      expect(result.feedback.some(f => f.includes("Voicing"))).toBe(true);
    });

    it("provides helpful suggestions for low confidence", () => {
      const detected: ChordInferenceResult = {
        chord: "C",
        root: "C",
        quality: "major",
        voicingType: "shell",
        confidence: 0.5,
        pitchClasses: [0, 4],
        matchedTemplate: [0, 4, 7],
      };

      const result = compareChords(detected, "C", "shell");
      expect(result.feedback.some(f => f.includes("clearly"))).toBe(true);
    });

    it("suggests more notes when too few detected", () => {
      const detected: ChordInferenceResult = {
        chord: "C",
        root: "C",
        quality: "major",
        voicingType: "shell",
        confidence: 0.8,
        pitchClasses: [0, 4], // Only 2 notes
        matchedTemplate: [0, 4, 7],
      };

      const result = compareChords(detected, "C", "shell");
      expect(result.feedback.some(f => f.includes("notes"))).toBe(true);
    });
  });
});
