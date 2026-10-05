/**
 * Gemini Exercise Generation
 * Uses Gemini to generate chord voicing exercises with structured JSON output
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NoteRole } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface VoicingExercise {
  type: string;
  name: string;
  description: string;
  notes: { note: string; octave: number; role: NoteRole }[];
}

export interface ExerciseGenerationResult {
  exercises: VoicingExercise[];
  error: string | null;
}

const EXERCISE_GENERATION_PROMPT = `You are a jazz piano voicing expert. Generate 5 different voicing exercises for the given chord.

Return ONLY a JSON array with exactly 5 voicing exercises. No markdown, no explanation.

Each exercise must have:
- type: "shell" | "rootless-a" | "rootless-b" | "drop-2" | "full"
- name: Display name (e.g., "Shell Voicing")
- description: Brief explanation of the voicing
- notes: Array of notes with:
  - note: Note name using flats (C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B)
  - octave: 3 or 4 (left hand typically uses octave 3-4)
  - role: "root" | "third" | "fifth" | "seventh" | "ninth"

Voicing rules:
1. Shell: Root (octave 3) + 3rd + 7th (octave 4)
2. Rootless Type A: 3rd + 5th + 7th + 9th (no root, starts octave 3)
3. Rootless Type B: 7th + 9th + 3rd + 5th (no root, starts octave 3)
4. Drop-2: 5th (octave 3) + Root + 3rd + 7th (octave 4)
5. Full: Root + 3rd + 5th + 7th + 9th (spread across octaves 3-4)

For minor 7th chords: minor 3rd (b3), perfect 5th, minor 7th (b7)
For dominant 7th chords: major 3rd, perfect 5th, minor 7th (b7)
For major 7th chords: major 3rd, perfect 5th, major 7th
For half-diminished: minor 3rd (b3), diminished 5th (b5), minor 7th (b7)

Example for Dm7:
[
  {
    "type": "shell",
    "name": "Shell Voicing",
    "description": "Root + 3rd + 7th - Essential chord tones",
    "notes": [
      {"note": "D", "octave": 3, "role": "root"},
      {"note": "F", "octave": 4, "role": "third"},
      {"note": "C", "octave": 4, "role": "seventh"}
    ]
  }
]

Return ONLY the JSON array.`;

/**
 * Generate voicing exercises using Gemini
 */
export async function generateVoicingExercisesWithGemini(
  chordSymbol: string
): Promise<ExerciseGenerationResult> {
  if (!process.env.GEMINI_API_KEY) {
    return { exercises: [], error: "Gemini API key not configured" };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `${EXERCISE_GENERATION_PROMPT}\n\nGenerate voicing exercises for: ${chordSymbol}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const exercises = JSON.parse(jsonMatch[0]) as VoicingExercise[];

      // Validate and clean up the exercises
      const validExercises = exercises.map((ex) => ({
        type: ex.type || "shell",
        name: ex.name || "Voicing",
        description: ex.description || "",
        notes: (ex.notes || []).map((n) => ({
          note: n.note,
          octave: n.octave || 4,
          role: n.role as NoteRole,
        })),
      }));

      return { exercises: validExercises, error: null };
    }

    return { exercises: [], error: "Failed to parse exercises from response" };
  } catch (error) {
    console.error("Exercise generation error:", error instanceof Error ? error.message : "unknown");
    return {
      exercises: [],
      error: error instanceof Error ? error.message : "Failed to generate exercises",
    };
  }
}
