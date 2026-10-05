import type { ScoreAnalysis, Lesson, Bar } from "@/types";

// Dummy score analysis data (fallback when Gemini fails)
export const DUMMY_ANALYSIS: ScoreAnalysis = {
  id: "analysis-1",
  title: "Untitled",
  key: "G minor",
  timeSignature: "4/4",
  form: ["A", "A", "B", "A"],
  bars: [
    {
      barNumber: 1,
      chordSymbol: "Cm7",
      recommendedVoicing: ["C", "Eb", "Bb"],
      improvModes: [
        { mode: "C Dorian", why: "ii chord in Bb major, natural 6 available" },
      ],
    },
    {
      barNumber: 2,
      chordSymbol: "F7",
      recommendedVoicing: ["A", "Eb", "G"],
      improvModes: [
        { mode: "F Mixolydian", why: "V7 chord resolving to BbMaj7" },
      ],
    },
    {
      barNumber: 3,
      chordSymbol: "BbMaj7",
      recommendedVoicing: ["D", "A", "C"],
      improvModes: [
        { mode: "Bb Lydian", why: "IMaj7 - Lydian adds color with #11" },
      ],
    },
    {
      barNumber: 4,
      chordSymbol: "EbMaj7",
      recommendedVoicing: ["G", "D", "F"],
      improvModes: [
        { mode: "Eb Lydian", why: "IVMaj7 - Lydian #11 for brightness" },
      ],
    },
    {
      barNumber: 5,
      chordSymbol: "Am7b5",
      recommendedVoicing: ["G", "C", "Eb"],
      improvModes: [
        { mode: "A Locrian", why: "viiø7 - half-diminished requires Locrian" },
      ],
    },
    {
      barNumber: 6,
      chordSymbol: "D7b9",
      recommendedVoicing: ["F#", "C", "Eb"],
      improvModes: [
        { mode: "D HW Diminished", why: "V7alt to Gm - use half-whole dim" },
      ],
    },
    {
      barNumber: 7,
      chordSymbol: "Gm7",
      recommendedVoicing: ["Bb", "F", "A"],
      improvModes: [
        { mode: "G Dorian", why: "i chord - Dorian is standard for minor" },
      ],
    },
    {
      barNumber: 8,
      chordSymbol: "Gm7",
      recommendedVoicing: ["Bb", "F", "A"],
      improvModes: [
        { mode: "G Natural Minor", why: "Resolve with natural minor for closure" },
      ],
    },
  ],
  createdAt: new Date(),
};

// Create a lesson from analysis
export function createLessonFromAnalysis(analysis: ScoreAnalysis): Lesson {
  return {
    id: `lesson-${Date.now()}`,
    scoreAnalysisId: analysis.id,
    currentBarIndex: 0,
    totalBars: analysis.bars.length,
    attempts: [],
    startedAt: new Date(),
  };
}

// Generate dummy chord recognition result
export function generateDummyRecognition(expectedChord: string) {
  const isCorrect = Math.random() > 0.3; // 70% success rate for demo
  const confidence = isCorrect ? 0.85 + Math.random() * 0.15 : 0.4 + Math.random() * 0.3;

  if (!isCorrect) {
    // Return a wrong chord
    const wrongChords = ["Dm7", "G7", "Cmaj7", "Am7", "Fmaj7"];
    const wrongChord = wrongChords[Math.floor(Math.random() * wrongChords.length)];
    return {
      correct: false,
      detectedChord: {
        root: wrongChord.charAt(0),
        quality: wrongChord.slice(1),
        voicing: "shell" as const,
        notes: ["C", "E", "Bb"],
        confidence,
      },
      feedback: `You played ${wrongChord}, but the target chord is ${expectedChord}. Listen to the difference in quality.`,
      suggestion: "Try focusing on the 3rd and 7th of the chord - these define the quality.",
    };
  }

  return {
    correct: true,
    detectedChord: {
      root: expectedChord.charAt(0),
      quality: expectedChord.slice(1),
      voicing: "shell" as const,
      notes: ["C", "Eb", "Bb"],
      confidence,
    },
    feedback: "Excellent! Your voicing is clear and the chord quality is correct.",
    suggestion: "Now try adding the 9th for a richer sound.",
  };
}

// In-memory storage for Phase 0. Entries expire after TTL_MS and each store
// holds at most MAX_ENTRIES (oldest evicted first), so a public demo cannot
// grow memory without bound.
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 200;

interface Stamped<T> {
  value: T;
  savedAt: number;
}

export class ExpiringStore<T> {
  private map = new Map<string, Stamped<T>>();

  constructor(
    private ttlMs: number = TTL_MS,
    private maxEntries: number = MAX_ENTRIES
  ) {}

  set(id: string, value: T, now: number = Date.now()): void {
    this.map.delete(id);
    this.map.set(id, { value, savedAt: now });
    this.map.forEach((entry, key) => {
      if (now - entry.savedAt > this.ttlMs) this.map.delete(key);
    });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value as string;
      this.map.delete(oldest);
    }
  }

  get(id: string, now: number = Date.now()): T | undefined {
    const entry = this.map.get(id);
    if (!entry) return undefined;
    if (now - entry.savedAt > this.ttlMs) {
      this.map.delete(id);
      return undefined;
    }
    return entry.value;
  }

  update(id: string, updates: Partial<T>, now: number = Date.now()): void {
    const entry = this.map.get(id);
    if (!entry || now - entry.savedAt > this.ttlMs) return;
    // keep the original save time so a lesson still expires after the TTL
    this.map.set(id, { value: { ...entry.value, ...updates }, savedAt: entry.savedAt });
  }
}

// Use globalThis to persist across Next.js hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __sidemanAnalysisStore: ExpiringStore<ScoreAnalysis> | undefined;
  // eslint-disable-next-line no-var
  var __sidemanLessonStore: ExpiringStore<Lesson> | undefined;
}

const analysisStore = globalThis.__sidemanAnalysisStore ?? new ExpiringStore<ScoreAnalysis>();
const lessonStore = globalThis.__sidemanLessonStore ?? new ExpiringStore<Lesson>();

globalThis.__sidemanAnalysisStore = analysisStore;
globalThis.__sidemanLessonStore = lessonStore;

export const storage = {
  saveAnalysis: (analysis: ScoreAnalysis) => analysisStore.set(analysis.id, analysis),
  getAnalysis: (id: string) => analysisStore.get(id),
  saveLesson: (lesson: Lesson) => lessonStore.set(lesson.id, lesson),
  getLesson: (id: string) => lessonStore.get(id),
  updateLesson: (id: string, updates: Partial<Lesson>) => lessonStore.update(id, updates),
};
