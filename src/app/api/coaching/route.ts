import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/dummy-data";
import { generateCoaching, CoachingContext, CoachingResponse } from "@/lib/gemini";
import { badRequest, errorMessage, rateLimited, readJson } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { coachingRequestSchema } from "@/lib/validation";
import type { ApiResponse, VoicingType } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CoachingResponse>>> {
  try {
    const parsed = coachingRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return badRequest("Invalid coaching request");
    }
    const { lessonId, barNumber, detectedChord, isCorrect, attemptNumber = 1 } = parsed.data;

    const lesson = storage.getLesson(lessonId);
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Get bar information
    const analysis = storage.getAnalysis(lesson.scoreAnalysisId);
    const currentBar = analysis?.bars[barNumber - 1];
    if (!analysis || !currentBar) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }
    const previousBar = barNumber > 1 ? analysis.bars[barNumber - 2] : undefined;
    const expectedVoicing: VoicingType = "shell";

    // Build lesson history from attempts
    const lessonHistory = lesson.attempts.map((attempt) => ({
      barNumber: attempt.barNumber,
      wasCorrect: attempt.correct,
      detectedChord: attempt.detectedChord
        ? `${attempt.detectedChord.root}${attempt.detectedChord.quality}`
        : null,
    }));

    // Build coaching context
    const context: CoachingContext = {
      currentBar,
      previousBar,
      detectedChord,
      expectedChord: currentBar.chordSymbol,
      expectedVoicing,
      isCorrect,
      attemptNumber,
      lessonHistory,
    };

    // Only requests that will actually call Gemini count against the limit
    if (process.env.GEMINI_API_KEY) {
      const rl = checkRateLimit(`gemini:${clientIp(request.headers)}`);
      if (!rl.allowed) return rateLimited(rl.retryAfterSec);
    }

    // Generate coaching feedback
    const coaching = await generateCoaching(context);

    return NextResponse.json({
      success: true,
      data: coaching,
    });
  } catch (error) {
    console.error("Coaching API error:", errorMessage(error));
    return NextResponse.json(
      { success: false, error: "Failed to generate coaching feedback" },
      { status: 500 }
    );
  }
}
