import { NextRequest, NextResponse } from "next/server";
import { storage, DUMMY_ANALYSIS } from "@/lib/dummy-data";
import { badRequest, errorMessage, readJson } from "@/lib/http";
import { attemptRequestSchema } from "@/lib/validation";
import type { ApiResponse, AttemptResponse, Attempt, DetectedChord, VoicingType } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AttemptResponse>>> {
  try {
    const parsed = attemptRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return badRequest("Invalid attempt request");
    }
    const { lessonId, barNumber, recognizedChord } = parsed.data;

    const lesson = storage.getLesson(lessonId);
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Get expected chord for this bar
    const analysis = storage.getAnalysis(lesson.scoreAnalysisId);
    const currentBar = analysis?.bars[barNumber - 1] || DUMMY_ANALYSIS.bars[0];
    const expectedChord = currentBar.chordSymbol;
    const expectedVoicing: VoicingType = "shell"; // Default voicing type

    // Check if we have recognized chord data
    if (!recognizedChord || !recognizedChord.chord) {
      return NextResponse.json({
        success: true,
        data: {
          correct: false,
          detectedChord: null,
          feedback: "No chord detected. Please play the chord clearly and try again.",
          nextBar: currentBar,
          lessonComplete: false,
        },
      });
    }

    // Compare recognized chord with expected
    const normalizedDetected = recognizedChord.chord.toLowerCase();
    const normalizedExpected = expectedChord.toLowerCase();

    const chordMatch = normalizedDetected === normalizedExpected;
    const voicingMatch = recognizedChord.voicingType === expectedVoicing;
    const isCorrect = chordMatch && voicingMatch;

    // Convert to DetectedChord format
    const detectedChord: DetectedChord = {
      root: recognizedChord.chord.charAt(0),
      quality: recognizedChord.chord.slice(1) || "major",
      voicing: recognizedChord.voicingType,
      notes: [], // Could be populated from pitch classes
      confidence: recognizedChord.confidence,
    };

    // Generate feedback message
    let feedback = "";
    if (isCorrect) {
      feedback = "Excellent! Your voicing is clear and the chord quality is correct.";
    } else if (!chordMatch) {
      feedback = `You played ${recognizedChord.chord}, but the target chord is ${expectedChord}. Listen to the difference in quality.`;
    } else if (!voicingMatch) {
      feedback = `Good chord! Try using the ${expectedVoicing} voicing for this exercise.`;
    }

    if (recognizedChord.confidence < 0.7) {
      feedback += " Try playing the notes more clearly and evenly.";
    }

    // Record the attempt
    const attempt: Attempt = {
      id: `attempt-${Date.now()}`,
      barNumber,
      detectedChord,
      expectedChord,
      correct: isCorrect,
      confidence: recognizedChord.confidence,
      feedback,
      timestamp: new Date(),
    };

    // Update lesson with attempt
    const updatedAttempts = [...lesson.attempts, attempt];
    storage.updateLesson(lessonId, { attempts: updatedAttempts });

    // Check if lesson is complete (only advance on success)
    const lessonComplete = isCorrect && barNumber >= (analysis?.bars.length || 8);

    // Determine next bar
    let nextBar = currentBar;
    if (isCorrect && !lessonComplete) {
      nextBar = analysis?.bars[barNumber] || currentBar;
    }

    return NextResponse.json({
      success: true,
      data: {
        correct: isCorrect,
        detectedChord,
        feedback,
        nextBar: lessonComplete ? null : nextBar,
        lessonComplete,
      },
    });
  } catch (error) {
    console.error("Attempt evaluation error:", errorMessage(error));
    return NextResponse.json(
      { success: false, error: "Failed to evaluate attempt" },
      { status: 500 }
    );
  }
}
