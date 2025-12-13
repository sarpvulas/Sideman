import { NextRequest, NextResponse } from "next/server";
import { storage, createLessonFromAnalysis } from "@/lib/dummy-data";
import type { ApiResponse, StartLessonResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<StartLessonResponse>>> {
  try {
    const body = await request.json();
    const { analysisId } = body;

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

    return NextResponse.json({
      success: true,
      data: {
        lessonId: lesson.id,
        lesson,
        currentBar: analysis.bars[0],
      },
    });
  } catch (error) {
    console.error("Lesson start error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start lesson" },
      { status: 500 }
    );
  }
}
