/**
 * Gemini Score Analysis Service
 * Uses Gemini Vision to analyze uploaded sheet music and extract chord information
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScoreAnalysis, Bar } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SCORE_ANALYSIS_PROMPT = `Analyze this sheet music and return ONLY a JSON object (no markdown, no explanation):

{"title":"Title from sheet","key":"Bb Major","timeSignature":"4/4","form":["A"],"bars":[{"barNumber":1,"chordSymbol":"Cm7","voicingNotes":[{"note":"C","role":"root"},{"note":"Eb","role":"third"},{"note":"G","role":"fifth"},{"note":"Bb","role":"seventh"}],"improvModes":[{"mode":"C Dorian","why":"ii chord"}]}]}

Rules:
- title: Extract the EXACT title written on the sheet music. Look for text at the top of the page. If no title is visible, use "Untitled"
- voicingNotes must include note name and role (root/third/fifth/seventh/ninth/eleventh/thirteenth)
- Include at least root, third, and seventh for each chord
- Note names: use flats (Bb, Eb, Ab) not sharps
- improvModes: one mode with short "why" (under 8 words)

Return ONLY valid JSON.`;

export interface ScoreAnalysisResult {
  success: boolean;
  analysis?: ScoreAnalysis;
  error?: string;
}

/**
 * Analyze a score image using Gemini Vision
 */
export async function analyzeScore(
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<ScoreAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: "Gemini API key not configured",
    };
  }

  try {
    // Use gemini-2.5-pro for vision capabilities (most capable model)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Convert ArrayBuffer to base64
    const base64Data = Buffer.from(fileBuffer).toString("base64");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            { text: SCORE_ANALYSIS_PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent output
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;

    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse Gemini response - no JSON found");
      return {
        success: false,
        error: "Failed to parse score analysis",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and transform the response
    const analysis: ScoreAnalysis = {
      id: `analysis-${Date.now()}`,
      title: parsed.title || "Untitled",
      key: parsed.key || "Unknown",
      timeSignature: parsed.timeSignature || "4/4",
      form: Array.isArray(parsed.form) ? parsed.form : ["A"],
      bars: transformBars(parsed.bars),
      createdAt: new Date(),
    };

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    // JSON.parse errors can quote model output, so keep the log short
    console.error(
      "Gemini score analysis error:",
      (error instanceof Error ? error.message : "unknown").slice(0, 120)
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Score analysis failed",
    };
  }
}

/**
 * Transform and validate bars from Gemini response
 */
function transformBars(bars: unknown[]): Bar[] {
  if (!Array.isArray(bars) || bars.length === 0) {
    return [
      {
        barNumber: 1,
        chordSymbol: "Cmaj7",
        recommendedVoicing: ["E", "B", "D"],
        voicingNotes: [
          { note: "C", role: "root" },
          { note: "E", role: "third" },
          { note: "B", role: "seventh" },
        ],
        improvModes: [{ mode: "C Ionian", why: "Default major scale" }],
      },
    ];
  }

  return bars.map((bar, index) => {
    const b = bar as Record<string, unknown>;

    // Parse voicingNotes if present
    let voicingNotes: { note: string; role: string }[] | undefined;
    if (Array.isArray(b.voicingNotes)) {
      voicingNotes = b.voicingNotes
        .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
        .map((v) => ({
          note: typeof v.note === "string" ? v.note : "C",
          role: typeof v.role === "string" ? v.role : "root",
        }));
    }

    // Fall back to recommendedVoicing if voicingNotes not present
    const recommendedVoicing = Array.isArray(b.recommendedVoicing)
      ? b.recommendedVoicing.filter((n): n is string => typeof n === "string")
      : voicingNotes
        ? voicingNotes.map((v) => v.note)
        : ["C", "E", "G"];

    // If no voicingNotes but have recommendedVoicing, create voicingNotes with default roles
    if (!voicingNotes && recommendedVoicing.length > 0) {
      const roles = ["third", "seventh", "root", "fifth", "ninth"] as const;
      voicingNotes = recommendedVoicing.map((note, i) => ({
        note,
        role: roles[i] || "tension",
      }));
    }

    return {
      barNumber: typeof b.barNumber === "number" ? b.barNumber : index + 1,
      chordSymbol: typeof b.chordSymbol === "string" ? b.chordSymbol : "N.C.",
      recommendedVoicing,
      voicingNotes: voicingNotes as Bar["voicingNotes"],
      improvModes: Array.isArray(b.improvModes)
        ? b.improvModes.map((m) => {
            const mode = m as Record<string, unknown>;
            return {
              mode: typeof mode.mode === "string" ? mode.mode : "Unknown",
              why: typeof mode.why === "string" ? mode.why : "",
            };
          })
        : [{ mode: "Unknown", why: "" }],
    };
  });
}

/**
 * Analyze a PDF score (extracts first page as image)
 * Note: For PDFs, we need to convert to image first
 */
export async function analyzePdfScore(
  pdfBuffer: ArrayBuffer
): Promise<ScoreAnalysisResult> {
  // Gemini can handle PDFs directly with gemini-1.5-flash
  return analyzeScore(pdfBuffer, "application/pdf");
}
