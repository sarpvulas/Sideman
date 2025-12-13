"use client";

import { useState, useCallback } from "react";
import type { DetectedChord } from "@/types";

export interface CoachingFeedback {
  feedback: string;
  suggestion: string;
  modeExplanation?: string;
  voicingTip?: string;
  shouldRepeat: boolean;
  shouldPracticeScale: boolean;
  encouragement: string;
}

export interface UseCoachingReturn {
  coaching: CoachingFeedback | null;
  isLoading: boolean;
  error: string | null;
  requestCoaching: (params: {
    lessonId: string;
    barNumber: number;
    detectedChord: DetectedChord | null;
    isCorrect: boolean;
    attemptNumber?: number;
  }) => Promise<CoachingFeedback | null>;
  reset: () => void;
}

export function useCoaching(): UseCoachingReturn {
  const [coaching, setCoaching] = useState<CoachingFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCoaching = useCallback(
    async (params: {
      lessonId: string;
      barNumber: number;
      detectedChord: DetectedChord | null;
      isCorrect: boolean;
      attemptNumber?: number;
    }): Promise<CoachingFeedback | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/coaching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to get coaching feedback");
        }

        setCoaching(data.data);
        return data.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setCoaching(null);
    setError(null);
  }, []);

  return {
    coaching,
    isLoading,
    error,
    requestCoaching,
    reset,
  };
}
