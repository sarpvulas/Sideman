import { NextRequest, NextResponse } from "next/server";
import { storage, createLessonFromAnalysis } from "@/lib/dummy-data";
import { errorMessage, readJson } from "@/lib/http";
import { startLessonSchema } from "@/lib/validation";
import type { ApiResponse, StartLessonResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<StartLessonResponse>>> {
  try {
    const parsed = startLessonSchema.safeParse(await readJson(request));
    const analysisId = parsed.success ? parsed.data.analysisId : null;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "Analysis ID required" },
        { status: 400 }
      );
    }

    const analysis = storage.getAnalysis(analysisId);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Create a new lesson
    const lesson = createLessonFromAnalysis(analysis);
    storage.saveLesson(lesson);
    // Re-save so the analysis expires after, not before, the lesson that uses it
    storage.saveAnalysis(analysis);

    return NextResponse.json({
      success: true,
      data: {
        lessonId: lesson.id,
        lesson,
        currentBar: analysis.bars[0],
      },
    });
  } catch (error) {
    console.error("Lesson start error:", errorMessage(error));
    return NextResponse.json(
      { success: false, error: "Failed to start lesson" },
      { status: 500 }
    );
  }
}
