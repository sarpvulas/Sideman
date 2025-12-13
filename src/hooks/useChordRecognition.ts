"use client";

import { useState, useCallback } from "react";
import { recognizeChord, ChordRecognitionResult } from "@/lib/audio";
import type { VoicingType } from "@/types";

export interface ChordRecognitionState {
  isAnalyzing: boolean;
  result: ChordRecognitionResult | null;
  error: string | null;
}

export interface UseChordRecognitionReturn extends ChordRecognitionState {
  analyzeChord: (blob: Blob) => Promise<ChordRecognitionResult>;
  evaluateAttempt: (
    blob: Blob,
    expectedChord: string,
    expectedVoicing?: VoicingType
  ) => Promise<{
    success: boolean;
    chordMatch: boolean;
    voicingMatch: boolean;
    confidence: number;
    detectedChord: string | null;
    expectedChord: string;
    feedback: string[];
  }>;
  reset: () => void;
}

export function useChordRecognition(): UseChordRecognitionReturn {
  const [state, setState] = useState<ChordRecognitionState>({
    isAnalyzing: false,
    result: null,
    error: null,
  });

  const analyzeChord = useCallback(async (blob: Blob): Promise<ChordRecognitionResult> => {
    setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const result = await recognizeChord(blob);

      setState({
        isAnalyzing: false,
        result,
        error: result.error || null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState({
        isAnalyzing: false,
        result: null,
        error: errorMessage,
      });

      return {
        success: false,
        chord: {
          chord: null,
          root: "",
          quality: "major",
          voicingType: "shell",
          confidence: 0,
          pitchClasses: [],
          matchedTemplate: null,
        },
        pitches: [],
        audioData: { duration: 0, sampleRate: 0 },
        reliability: {
          isReliable: false,
          issues: [errorMessage],
          adjustedConfidence: 0,
          signalQuality: "poor" as const,
          recommendations: [],
        },
        error: errorMessage,
      };
    }
  }, []);

  const evaluateAttempt = useCallback(
    async (
      blob: Blob,
      expectedChord: string,
      expectedVoicing: VoicingType = "shell"
    ) => {
      const result = await analyzeChord(blob);

      if (!result.success || !result.chord.chord) {
        return {
          success: false,
          chordMatch: false,
          voicingMatch: false,
          confidence: 0,
          detectedChord: null,
          expectedChord,
          feedback: [result.error || "Could not recognize chord"],
        };
      }

      // Compare detected chord with expected
      const normalizedDetected = result.chord.chord.toLowerCase();
      const normalizedExpected = expectedChord.toLowerCase();

      const chordMatch = normalizedDetected === normalizedExpected;
      const voicingMatch = result.chord.voicingType === expectedVoicing;

      const feedback: string[] = [];

      if (!chordMatch) {
        feedback.push(
          `You played ${result.chord.chord}, but the target chord is ${expectedChord}.`
        );
      }

      if (!voicingMatch && chordMatch) {
        feedback.push(
          `Voicing: expected ${expectedVoicing}, detected ${result.chord.voicingType}`
        );
      }

      if (result.chord.confidence < 0.7) {
        feedback.push("Try playing the notes more clearly and evenly");
      }

      return {
        success: chordMatch && voicingMatch,
        chordMatch,
        voicingMatch,
        confidence: result.chord.confidence,
        detectedChord: result.chord.chord,
        expectedChord,
        feedback,
      };
    },
    [analyzeChord]
  );

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyzeChord,
    evaluateAttempt,
    reset,
  };
}
