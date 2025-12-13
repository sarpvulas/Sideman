import { describe, it, expect } from "vitest";
import {
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName,
  calculateCents,
  pitchesToPitchClasses,
  groupByNoteName,
  DetectedPitch,
} from "@/lib/audio/pitch";

describe("Pitch detection utilities", () => {
  describe("frequencyToMidi", () => {
    it("converts A4 (440Hz) to MIDI 69", () => {
      expect(frequencyToMidi(440)).toBeCloseTo(69, 5);
    });

    it("converts C4 (261.63Hz) to MIDI 60", () => {
      expect(frequencyToMidi(261.63)).toBeCloseTo(60, 1);
    });

    it("converts A3 (220Hz) to MIDI 57", () => {
      expect(frequencyToMidi(220)).toBeCloseTo(57, 5);
    });

    it("converts A5 (880Hz) to MIDI 81", () => {
      expect(frequencyToMidi(880)).toBeCloseTo(81, 5);
    });

    it("handles low frequencies", () => {
      // C1 is about 32.7 Hz, MIDI 24
      expect(frequencyToMidi(32.7)).toBeCloseTo(24, 1);
    });
  });

  describe("midiToFrequency", () => {
    it("converts MIDI 69 to 440Hz", () => {
      expect(midiToFrequency(69)).toBeCloseTo(440, 5);
    });

    it("converts MIDI 60 to ~261.63Hz", () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
    });

    it("is inverse of frequencyToMidi", () => {
      const originalFreq = 440;
      const midi = frequencyToMidi(originalFreq);
      const recoveredFreq = midiToFrequency(midi);
      expect(recoveredFreq).toBeCloseTo(originalFreq, 5);
    });

    it("handles octave relationships", () => {
      const a4 = midiToFrequency(69);
      const a5 = midiToFrequency(81);
      expect(a5).toBeCloseTo(a4 * 2, 5); // Octave = double frequency
    });
  });

  describe("midiToNoteName", () => {
    it("converts MIDI 60 to C4", () => {
      const result = midiToNoteName(60);
      expect(result.note).toBe("C");
      expect(result.octave).toBe(4);
    });

    it("converts MIDI 69 to A4", () => {
      const result = midiToNoteName(69);
      expect(result.note).toBe("A");
      expect(result.octave).toBe(4);
    });

    it("converts MIDI 61 to C#4", () => {
      const result = midiToNoteName(61);
      expect(result.note).toBe("C#");
      expect(result.octave).toBe(4);
    });

    it("converts MIDI 48 to C3", () => {
      const result = midiToNoteName(48);
      expect(result.note).toBe("C");
      expect(result.octave).toBe(3);
    });

    it("handles negative octaves", () => {
      const result = midiToNoteName(0);
      expect(result.note).toBe("C");
      expect(result.octave).toBe(-1);
    });

    it("rounds fractional MIDI numbers", () => {
      const result = midiToNoteName(60.4);
      expect(result.note).toBe("C");
      expect(result.octave).toBe(4);
    });
  });

  describe("calculateCents", () => {
    it("returns 0 for perfect pitch", () => {
      expect(calculateCents(440)).toBeCloseTo(0, 5);
    });

    it("returns positive cents for sharp pitch", () => {
      // Slightly sharp A4
      const cents = calculateCents(445);
      expect(cents).toBeGreaterThan(0);
      expect(cents).toBeLessThan(50);
    });

    it("returns negative cents for flat pitch", () => {
      // Slightly flat A4
      const cents = calculateCents(435);
      expect(cents).toBeLessThan(0);
      expect(cents).toBeGreaterThan(-50);
    });

    it("returns ~50 cents deviation for quarter tone", () => {
      // Quarter tone above A4 (exactly between A4 and A#4)
      // This rounds to A#4 (MIDI 70), so deviation is -50 cents
      const quarterTone = 440 * Math.pow(2, 0.5 / 12);
      const cents = calculateCents(quarterTone);
      expect(Math.abs(cents)).toBeCloseTo(50, 0);
    });
  });

  describe("pitchesToPitchClasses", () => {
    it("returns empty array for no pitches", () => {
      expect(pitchesToPitchClasses([])).toEqual([]);
    });

    it("extracts pitch classes", () => {
      const pitches: DetectedPitch[] = [
        { frequency: 261.63, midi: 60, note: "C", octave: 4, cents: 0, magnitude: 1 },
        { frequency: 329.63, midi: 64, note: "E", octave: 4, cents: 0, magnitude: 1 },
        { frequency: 392, midi: 67, note: "G", octave: 4, cents: 0, magnitude: 1 },
      ];

      const classes = pitchesToPitchClasses(pitches);
      expect(classes).toContain(0); // C
      expect(classes).toContain(4); // E
      expect(classes).toContain(7); // G
    });

    it("removes octave duplicates", () => {
      const pitches: DetectedPitch[] = [
        { frequency: 261.63, midi: 60, note: "C", octave: 4, cents: 0, magnitude: 1 },
        { frequency: 523.25, midi: 72, note: "C", octave: 5, cents: 0, magnitude: 1 },
      ];

      const classes = pitchesToPitchClasses(pitches);
      expect(classes).toEqual([0]); // Only one C
    });

    it("sorts pitch classes ascending", () => {
      const pitches: DetectedPitch[] = [
        { frequency: 392, midi: 67, note: "G", octave: 4, cents: 0, magnitude: 1 },
        { frequency: 261.63, midi: 60, note: "C", octave: 4, cents: 0, magnitude: 1 },
        { frequency: 329.63, midi: 64, note: "E", octave: 4, cents: 0, magnitude: 1 },
      ];

      const classes = pitchesToPitchClasses(pitches);
      expect(classes).toEqual([0, 4, 7]);
    });
  });

  describe("groupByNoteName", () => {
    it("returns empty map for no pitches", () => {
      const groups = groupByNoteName([]);
      expect(groups.size).toBe(0);
    });

    it("groups pitches by note name", () => {
      const pitches: DetectedPitch[] = [
        { frequency: 261.63, midi: 60, note: "C", octave: 4, cents: 0, magnitude: 1 },
        { frequency: 523.25, midi: 72, note: "C", octave: 5, cents: 0, magnitude: 0.5 },
        { frequency: 329.63, midi: 64, note: "E", octave: 4, cents: 0, magnitude: 1 },
      ];

      const groups = groupByNoteName(pitches);
      expect(groups.get("C")?.length).toBe(2);
      expect(groups.get("E")?.length).toBe(1);
    });

    it("preserves pitch data in groups", () => {
      const pitches: DetectedPitch[] = [
        { frequency: 261.63, midi: 60, note: "C", octave: 4, cents: 0, magnitude: 1 },
      ];

      const groups = groupByNoteName(pitches);
      const cGroup = groups.get("C");
      expect(cGroup?.[0].octave).toBe(4);
      expect(cGroup?.[0].midi).toBe(60);
    });
  });
});
