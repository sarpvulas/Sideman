import { NextRequest, NextResponse } from "next/server";
import { generateVoicingExercisesWithGemini } from "@/lib/gemini/exercise-generation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { exerciseRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`gemini:${clientIp(request.headers)}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demo rate limit reached. Please try again later.", exercises: [] },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const parsed = exerciseRequestSchema.safeParse(await request.json());
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
    console.error("Exercise generation API error:", error);
    return NextResponse.json(
      { error: "Failed to generate exercises", exercises: [] },
      { status: 500 }
    );
  }
}
