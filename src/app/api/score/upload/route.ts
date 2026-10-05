import { NextRequest, NextResponse } from "next/server";
import { DUMMY_ANALYSIS, storage } from "@/lib/dummy-data";
import { analyzeScore } from "@/lib/gemini/score-analysis";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { errorMessage, rateLimited } from "@/lib/http";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/validation";
import type { ApiResponse, UploadResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UploadResponse>>> {
  // Reject oversized bodies before buffering them (multipart overhead is small)
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json(
      { success: false, error: "File too large. Maximum size is 4MB" },
      { status: 413 }
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
        { status: file.size > MAX_UPLOAD_BYTES ? 413 : 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract filename without extension for fallback title
    const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

    // Only requests that reach Gemini count against the limit
    if (process.env.GEMINI_API_KEY) {
      const rl = checkRateLimit(`gemini:${clientIp(request.headers)}`);
      if (!rl.allowed) return rateLimited(rl.retryAfterSec);
    }

    // Use Gemini Vision to analyze the score
    const result = await analyzeScore(arrayBuffer, file.type);

    if (!result.success || !result.analysis) {
      if (process.env.GEMINI_API_KEY) {
        // A configured deployment must not pass the sample off as the user's score
        console.error("Gemini analysis failed:", result.error?.slice(0, 200));
        return NextResponse.json(
          {
            success: false,
            error: "Could not analyze this lead sheet. Try another file or try again later.",
          },
          { status: 502 }
        );
      }

      // Documented no-key demo mode: serve the built-in sample, clearly marked
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
          isSample: true,
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
    console.error("Score upload error:", errorMessage(error));
    return NextResponse.json(
      { success: false, error: "Score analysis failed" },
      { status: 500 }
    );
  }
}
