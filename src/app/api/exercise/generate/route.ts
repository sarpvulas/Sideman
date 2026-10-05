import { NextRequest, NextResponse } from "next/server";
import { generateVoicingExercisesWithGemini } from "@/lib/gemini/exercise-generation";
import { errorMessage, rateLimited, readJson } from "@/lib/http";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { exerciseRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const parsed = exerciseRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid chord symbol is required", exercises: [] },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI exercises are not configured on this deployment", exercises: [] },
        { status: 503 }
      );
    }

    // Only requests that reach Gemini count against the limit
    const rl = checkRateLimit(`gemini:${clientIp(request.headers)}`);
    if (!rl.allowed) return rateLimited(rl.retryAfterSec, { exercises: [] });

    const result = await generateVoicingExercisesWithGemini(parsed.data.chordSymbol);

    if (result.error) {
      console.error("Exercise generation failed:", result.error);
      return NextResponse.json(
        { error: "Could not generate exercises right now", exercises: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ exercises: result.exercises });
  } catch (error) {
    console.error("Exercise generation API error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to generate exercises", exercises: [] },
      { status: 500 }
    );
  }
}
