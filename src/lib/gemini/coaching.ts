/**
 * Gemini Coaching Service
 * Provides AI-powered jazz instruction based on chord recognition results
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Bar, VoicingType, DetectedChord } from "@/types";

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface CoachingContext {
  currentBar: Bar;
  previousBar?: Bar;
  detectedChord: DetectedChord | null;
  expectedChord: string;
  expectedVoicing: VoicingType;
  isCorrect: boolean;
  attemptNumber: number;
  lessonHistory: {
    barNumber: number;
    wasCorrect: boolean;
    detectedChord: string | null;
  }[];
}

export interface CoachingResponse {
  feedback: string;
  suggestion: string;
  modeExplanation?: string;
  voicingTip?: string;
  shouldRepeat: boolean;
  shouldPracticeScale: boolean;
  encouragement: string;
}

// System prompt for the jazz coaching AI
const JAZZ_COACH_SYSTEM_PROMPT = `You are an expert jazz piano teacher with decades of experience teaching chord voicings and improvisation. You specialize in helping students learn:

1. Shell voicings (root + 3rd + 7th)
2. Rootless voicings (Type A and Type B)
3. Drop-2 voicings
4. Quartal voicings
5. Voice leading between chords
6. Modal improvisation over chord changes

Your teaching style is:
- Encouraging but honest
- Focused on practical, actionable advice
- Explains music theory in accessible terms
- Celebrates small victories
- Provides specific finger/note suggestions when helpful

Always respond in JSON format with this structure:
{
  "feedback": "Direct feedback on what was played",
  "suggestion": "Specific thing to try next",
  "modeExplanation": "If relevant, explain the appropriate mode/scale",
  "voicingTip": "Specific voicing advice for this chord",
  "shouldRepeat": true/false,
  "shouldPracticeScale": true/false,
  "encouragement": "Brief encouraging message"
}`;

/**
 * Generate coaching feedback using Gemini
 */
export async function generateCoaching(
  context: CoachingContext
): Promise<CoachingResponse> {
  // If no API key, return fallback feedback
  if (!process.env.GEMINI_API_KEY) {
    return generateFallbackCoaching(context);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = buildCoachingPrompt(context);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: JAZZ_COACH_SYSTEM_PROMPT + "\n\n" + prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        feedback: parsed.feedback || "Keep practicing!",
        suggestion: parsed.suggestion || "Try again with more focus.",
        modeExplanation: parsed.modeExplanation,
        voicingTip: parsed.voicingTip,
        shouldRepeat: parsed.shouldRepeat ?? !context.isCorrect,
        shouldPracticeScale: parsed.shouldPracticeScale ?? false,
        encouragement: parsed.encouragement || "You're making progress!",
      };
    }

    // If JSON parsing fails, extract what we can
    return {
      feedback: text.slice(0, 200),
      suggestion: "Try the chord again with clear articulation.",
      shouldRepeat: !context.isCorrect,
      shouldPracticeScale: false,
      encouragement: "Keep at it!",
    };
  } catch (error) {
    console.error("Gemini coaching error:", error instanceof Error ? error.message : "unknown");
    return generateFallbackCoaching(context);
  }
}

/**
 * Build the coaching prompt from context
 */
function buildCoachingPrompt(context: CoachingContext): string {
  const {
    currentBar,
    previousBar,
    detectedChord,
    expectedChord,
    expectedVoicing,
    isCorrect,
    attemptNumber,
    lessonHistory,
  } = context;

  let prompt = `
## Current Situation

The student is practicing "${expectedChord}" with ${expectedVoicing} voicing.

**Expected chord:** ${expectedChord}
**Recommended voicing notes:** ${currentBar.recommendedVoicing.join(", ")}
**Mode for improvisation:** ${currentBar.improvModes[0]?.mode || "N/A"}
**Why this mode:** ${currentBar.improvModes[0]?.why || "N/A"}

**What the student played:**
- Detected chord: ${detectedChord?.root}${detectedChord?.quality} (${detectedChord ? "detected" : "nothing detected"})
- Detected voicing: ${detectedChord?.voicing || "unknown"}
- Confidence: ${detectedChord?.confidence ? (detectedChord.confidence * 100).toFixed(0) + "%" : "N/A"}
- Attempt number: ${attemptNumber}
- Result: ${isCorrect ? "CORRECT" : "INCORRECT"}
`;

  if (previousBar) {
    prompt += `
**Previous bar:** ${previousBar.chordSymbol}
(Consider voice leading from ${previousBar.chordSymbol} to ${expectedChord})
`;
  }

  if (lessonHistory.length > 0) {
    const recentHistory = lessonHistory.slice(-5);
    const correctCount = recentHistory.filter((h) => h.wasCorrect).length;
    prompt += `
**Recent performance:** ${correctCount}/${recentHistory.length} correct in last attempts
`;
  }

  prompt += `
Please provide coaching feedback in JSON format as specified.
`;

  return prompt;
}

/**
 * Generate fallback coaching without AI
 */
function generateFallbackCoaching(context: CoachingContext): CoachingResponse {
  const { isCorrect, detectedChord, expectedChord, currentBar, attemptNumber } =
    context;

  if (isCorrect) {
    return {
      feedback: `Excellent! Your ${expectedChord} voicing is clear and correct.`,
      suggestion: `Now try adding some rhythmic variation - maybe a swing pattern.`,
      modeExplanation: currentBar.improvModes[0]
        ? `For improvising, use ${currentBar.improvModes[0].mode}: ${currentBar.improvModes[0].why}`
        : undefined,
      voicingTip: `Your voicing included ${currentBar.recommendedVoicing.join(", ")} - great job!`,
      shouldRepeat: false,
      shouldPracticeScale: false,
      encouragement: "Keep up the great work!",
    };
  }

  // Incorrect attempt
  const feedbackOptions = [
    `You played ${detectedChord?.root || "something"}${detectedChord?.quality || ""}, but we need ${expectedChord}.`,
    `Almost there! The chord should be ${expectedChord}.`,
    `Let's work on this ${expectedChord} chord.`,
  ];

  const suggestions = [
    `Focus on the 3rd and 7th - they define the chord quality.`,
    `Try the notes ${currentBar.recommendedVoicing.join(", ")} for a clean voicing.`,
    `Make sure your root note is clear.`,
    `Listen for the major/minor quality in the 3rd.`,
  ];

  const encouragements = [
    "You're getting closer!",
    "Jazz takes time - keep at it!",
    "Every attempt makes you better.",
    "Don't give up - this chord will click soon.",
  ];

  return {
    feedback: feedbackOptions[attemptNumber % feedbackOptions.length],
    suggestion: suggestions[attemptNumber % suggestions.length],
    modeExplanation: currentBar.improvModes[0]
      ? `Tip: For this chord, try ${currentBar.improvModes[0].mode}`
      : undefined,
    voicingTip: `Recommended notes: ${currentBar.recommendedVoicing.join(", ")}`,
    shouldRepeat: true,
    shouldPracticeScale: attemptNumber > 3,
    encouragement: encouragements[attemptNumber % encouragements.length],
  };
}

/**
 * Generate mode/scale practice suggestions
 */
export async function generateScalePractice(
  bar: Bar
): Promise<{ notes: string[]; pattern: string; tip: string }> {
  const mode = bar.improvModes[0];

  if (!mode) {
    return {
      notes: [],
      pattern: "Play the chord tones ascending and descending",
      tip: "Focus on the root, 3rd, 5th, and 7th",
    };
  }

  // Extract root from mode name (e.g., "C Dorian" -> "C")
  const modeRoot = mode.mode.split(" ")[0];
  const modeType = mode.mode.split(" ").slice(1).join(" ").toLowerCase();

  // Scale patterns based on mode type
  const scalePatterns: Record<string, number[]> = {
    dorian: [0, 2, 3, 5, 7, 9, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    "natural minor": [0, 2, 3, 5, 7, 8, 10],
    "hw diminished": [0, 1, 3, 4, 6, 7, 9, 10],
    aeolian: [0, 2, 3, 5, 7, 8, 10],
  };

  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rootIndex = noteNames.indexOf(modeRoot.replace("b", "#"));

  const intervals = scalePatterns[modeType] || scalePatterns.dorian;
  const notes = intervals.map((i) => noteNames[(rootIndex + i) % 12]);

  return {
    notes,
    pattern: "1-2-3-4-5-6-7-8 ascending, then descending",
    tip: mode.why,
  };
}
