import { describe, it, expect } from "vitest";
import {
  parseChordSymbol,
  getChordNotes,
  noteToMidi,
  midiToNote,
} from "@/utils/chord-parser";

describe("parseChordSymbol", () => {
  it("parses major triads", () => {
    expect(parseChordSymbol("C")).toEqual({
      root: "C",
      quality: "major",
      extensions: [],
      bass: null,
    });
  });

  it("parses minor chords", () => {
    expect(parseChordSymbol("Dm")).toEqual({
      root: "D",
      quality: "minor",
      extensions: [],
      bass: null,
    });

    expect(parseChordSymbol("Am")).toEqual({
      root: "A",
      quality: "minor",
      extensions: [],
      bass: null,
    });
  });

  it("parses minor 7th chords", () => {
    expect(parseChordSymbol("Dm7")).toEqual({
      root: "D",
      quality: "minor7",
      extensions: [],
      bass: null,
    });

    expect(parseChordSymbol("Cm7")).toEqual({
      root: "C",
      quality: "minor7",
      extensions: [],
      bass: null,
    });
  });

  it("parses major 7th chords", () => {
    expect(parseChordSymbol("Cmaj7")).toEqual({
      root: "C",
      quality: "major7",
      extensions: [],
      bass: null,
    });

    expect(parseChordSymbol("FM7")).toEqual({
      root: "F",
      quality: "major7",
      extensions: [],
      bass: null,
    });
  });

  it("parses dominant 7th chords", () => {
    expect(parseChordSymbol("G7")).toEqual({
      root: "G",
      quality: "dominant7",
      extensions: [],
      bass: null,
    });

    expect(parseChordSymbol("C7")).toEqual({
      root: "C",
      quality: "dominant7",
      extensions: [],
      bass: null,
    });
  });

  it("parses chords with sharps and flats", () => {
    expect(parseChordSymbol("F#m7")).toEqual({
      root: "F#",
      quality: "minor7",
      extensions: [],
      bass: null,
    });

    expect(parseChordSymbol("Bbmaj7")).toEqual({
      root: "Bb",
      quality: "major7",
      extensions: [],
      bass: null,
    });
  });

  it("parses slash chords", () => {
    expect(parseChordSymbol("Cmaj7/E")).toEqual({
      root: "C",
      quality: "major7",
      extensions: [],
      bass: "E",
    });

    expect(parseChordSymbol("Dm7/A")).toEqual({
      root: "D",
      quality: "minor7",
      extensions: [],
      bass: "A",
    });
  });

  it("parses chords with extensions", () => {
    const result = parseChordSymbol("G7#9");
    expect(result?.root).toBe("G");
    expect(result?.quality).toBe("dominant7");
    expect(result?.extensions).toContain("#9");
  });

  it("parses diminished chords", () => {
    expect(parseChordSymbol("Cdim")).toEqual({
      root: "C",
      quality: "diminished",
      extensions: [],
      bass: null,
    });
  });

  it("parses half-diminished chords", () => {
    const result = parseChordSymbol("Am7b5");
    expect(result?.root).toBe("A");
    expect(result?.quality).toBe("half-diminished");
  });

  it("handles invalid input gracefully", () => {
    expect(parseChordSymbol("")).toBeNull();
    expect(parseChordSymbol("xyz")).toBeNull();
    expect(parseChordSymbol("123")).toBeNull();
  });
});

describe("getChordNotes", () => {
  it("returns notes for major 7th chord", () => {
    const notes = getChordNotes("Cmaj7");
    expect(notes).toContain("C");
    expect(notes).toContain("E");
    expect(notes).toContain("G");
    expect(notes).toContain("B");
  });

  it("returns notes for minor 7th chord", () => {
    const notes = getChordNotes("Dm7");
    expect(notes).toContain("D");
    expect(notes).toContain("F");
    expect(notes).toContain("A");
    expect(notes).toContain("C");
  });

  it("returns shell voicing notes", () => {
    const notes = getChordNotes("Cmaj7", { voicing: "shell" });
    expect(notes).toHaveLength(3);
    expect(notes).toContain("C");
    expect(notes).toContain("E");
    expect(notes).toContain("B");
  });

  it("returns empty array for invalid chord", () => {
    expect(getChordNotes("")).toEqual([]);
    expect(getChordNotes("invalid")).toEqual([]);
  });
});

describe("noteToMidi", () => {
  it("converts note names to MIDI numbers", () => {
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
    expect(noteToMidi("C5")).toBe(72);
  });

  it("handles sharps correctly", () => {
    expect(noteToMidi("C#4")).toBe(61);
    expect(noteToMidi("F#4")).toBe(66);
  });

  it("handles different octaves", () => {
    expect(noteToMidi("C3")).toBe(48);
    expect(noteToMidi("C5")).toBe(72);
    expect(noteToMidi("C6")).toBe(84);
  });

  it("returns -1 for invalid input", () => {
    expect(noteToMidi("X4")).toBe(-1);
    expect(noteToMidi("C")).toBe(-1);
    expect(noteToMidi("")).toBe(-1);
  });
});

describe("midiToNote", () => {
  it("converts MIDI numbers to note names", () => {
    expect(midiToNote(60)).toBe("C4");
    expect(midiToNote(69)).toBe("A4");
    expect(midiToNote(72)).toBe("C5");
  });

  it("handles sharps correctly", () => {
    expect(midiToNote(61)).toBe("C#4");
    expect(midiToNote(66)).toBe("F#4");
  });

  it("handles different octaves", () => {
    expect(midiToNote(48)).toBe("C3");
    expect(midiToNote(84)).toBe("C6");
  });
});
