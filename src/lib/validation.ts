import { z } from "zod";

/** Chord symbols such as Cm7, F#maj7, Bb7b9, Dø7, G7/B. Bounded to keep prompts small. */
export const chordSymbolSchema = z
  .string()
  .trim()
  // normalise typographic accidentals so "B♭maj7" becomes "Bbmaj7"
  .transform((s) => s.replace(/♭/g, "b").replace(/♯/g, "#"))
  .pipe(
    z
      .string()
      .min(1)
      .max(20)
      .regex(/^[A-G][#b]?[A-Za-z0-9#b+\-–−°øΔ∆△(),/]*$/, "Invalid chord symbol")
  );

export const exerciseRequestSchema = z.object({
  chordSymbol: chordSymbolSchema,
});

const voicingTypeSchema = z.enum(["shell", "rootless", "drop-2", "quartal", "full"]);

export const startLessonSchema = z.object({
  analysisId: z.string().min(1).max(100),
});

export const attemptRequestSchema = z.object({
  lessonId: z.string().min(1).max(100),
  barNumber: z.number().int().min(1).max(512),
  recognizedChord: z
    .object({
      chord: z.string().max(20).nullable(),
      confidence: z.number().min(0).max(1),
      voicingType: voicingTypeSchema,
      pitchClasses: z.array(z.number().int().min(0).max(11)).max(12),
    })
    .nullable(),
});

export const coachingRequestSchema = z.object({
  lessonId: z.string().min(1).max(100),
  barNumber: z.number().int().min(1).max(512),
  detectedChord: z
    .object({
      root: z.string().max(4),
      quality: z.string().max(20),
      voicing: voicingTypeSchema,
      notes: z.array(z.string().max(4)).max(12),
      confidence: z.number().min(0).max(1),
    })
    .nullable(),
  isCorrect: z.boolean(),
  attemptNumber: z.number().int().min(1).max(1000).optional(),
});

/** Largest upload accepted. Vercel serverless functions reject bodies over 4.5MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;

export function validateUpload(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    return "Invalid file type. Please upload PDF, PNG, or JPEG";
  }
  if (file.size === 0) return "File is empty";
  if (file.size > MAX_UPLOAD_BYTES) return "File too large. Maximum size is 4MB";
  return null;
}
