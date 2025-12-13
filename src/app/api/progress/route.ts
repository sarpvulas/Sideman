import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

interface ProgressData {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  lessonsCompleted: number;
  averageConfidence: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProgressData>>> {
  try {
    // In Phase 0, return dummy progress data
    // In Phase 5, this will query the database
    const progress: ProgressData = {
      totalAttempts: 24,
      correctAttempts: 18,
      accuracy: 75,
      lessonsCompleted: 3,
      averageConfidence: 0.82,
    };

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
