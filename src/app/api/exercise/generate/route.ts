import { NextRequest, NextResponse } from "next/server";
import { generateVoicingExercisesWithGemini } from "@/lib/gemini/exercise-generation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chordSymbol } = body;

    if (!chordSymbol) {
      return NextResponse.json(
        { error: "Chord symbol is required" },
        { status: 400 }
      );
    }

    const result = await generateVoicingExercisesWithGemini(chordSymbol);

    if (result.error) {
      return NextResponse.json(
        { error: result.error, exercises: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({ exercises: result.exercises });
  } catch (error) {
    console.error("Exercise generation API error:", error);
    return NextResponse.json(
      { error: "Failed to generate exercises" },
      { status: 500 }
    );
  }
}
