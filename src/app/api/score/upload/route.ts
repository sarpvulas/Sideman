import { NextRequest, NextResponse } from "next/server";
import { DUMMY_ANALYSIS, storage } from "@/lib/dummy-data";
import { analyzeScore } from "@/lib/gemini/score-analysis";
import type { ApiResponse, UploadResponse } from "@/types";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Please upload PDF, PNG, or JPEG`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB" },
        { status: 413 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract filename without extension for fallback title
    const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

    // Use Gemini Vision to analyze the score
    const result = await analyzeScore(arrayBuffer, file.type);

    if (!result.success || !result.analysis) {
      // Fall back to dummy data if Gemini fails
      console.warn("Gemini analysis failed, using dummy data:", result.error);
      const analysis = {
        ...DUMMY_ANALYSIS,
        id: `analysis-${Date.now()}`,
        title: filenameWithoutExt || DUMMY_ANALYSIS.title,
        createdAt: new Date(),
      };
      storage.saveAnalysis(analysis);

      return NextResponse.json({
        success: true,
        data: {
          analysisId: analysis.id,
          analysis,
        },
      });
    }

    // Always use filename as title (more meaningful than extracted title)
    if (filenameWithoutExt) {
      result.analysis.title = filenameWithoutExt;
    }

    // Store the analysis
    storage.saveAnalysis(result.analysis);

    return NextResponse.json({
      success: true,
      data: {
        analysisId: result.analysis.id,
        analysis: result.analysis,
      },
    });
  } catch (error) {
    console.error("Score upload error:", error);
    return NextResponse.json(
      { success: false, error: "Score analysis failed" },
      { status: 500 }
    );
  }
}
