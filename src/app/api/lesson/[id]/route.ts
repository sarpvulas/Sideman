import { NextResponse } from "next/server";
import { storage } from "@/lib/dummy-data";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const lesson = storage.getLesson(params.id);
  const analysis = lesson ? storage.getAnalysis(lesson.scoreAnalysisId) : undefined;

  if (!lesson || !analysis) {
    return NextResponse.json(
      { success: false, error: "Lesson not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { lesson, analysis } });
}
