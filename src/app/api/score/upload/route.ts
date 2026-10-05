import { NextRequest, NextResponse } from "next/server";
import { DUMMY_ANALYSIS, storage } from "@/lib/dummy-data";
import { analyzeScore } from "@/lib/gemini/score-analysis";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { validateUpload } from "@/lib/validation";
import type { ApiResponse, UploadResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  const rl = checkRateLimit(`gemini:${clientIp(request.headers)}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Demo rate limit reached. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const formData = await request.formData();
    const entry = formData.get("file");
    const file = entry instanceof File ? entry : null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const invalid = validateUpload(file);
    if (invalid) {
      return NextResponse.json(
        { success: false, error: invalid },
        { status: file.size > 4 * 1024 * 1024 ? 413 : 400 }
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
