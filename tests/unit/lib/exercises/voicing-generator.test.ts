import { describe, it, expect } from "vitest";
import { generateVoicing, generateVoicingExercises } from "@/lib/exercises/voicing-generator";

describe("voicing generator", () => {
  it("returns the five voicing types for a chord", () => {
    const types = generateVoicingExercises("Cm7").map((e) => e.type);
    expect(types).toEqual(["shell", "rootless-a", "rootless-b", "drop-2", "full"]);
  });

  it("builds a Cm7 shell voicing from root, third and seventh", () => {
    const notes = generateVoicing("Cm7", "shell").notes;
    expect(notes.map((n) => n.note.replace(/\d/g, ""))).toEqual(["C", "Eb", "Bb"]);
  });

  it("spells dominant 7th shell voicing with flats", () => {
    const notes = generateVoicing("Bb7", "shell").notes.map((n) => n.note.replace(/\d/g, ""));
    expect(notes).toEqual(["Bb", "D", "Ab"]);
  });

  it("every exercise has at least one note", () => {
    for (const ex of generateVoicingExercises("Fmaj7")) {
      expect(ex.notes.length).toBeGreaterThan(0);
    }
  });
});
