"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout";
import { LessonView } from "@/components/lesson";
import { Card, Skeleton } from "@/components/ui";
import { DUMMY_ANALYSIS } from "@/lib/dummy-data";
import { useChordRecognition } from "@/hooks/useChordRecognition";
import { useCoaching } from "@/hooks/useCoaching";
import type { Lesson, Bar, DetectedChord, ScoreAnalysis } from "@/types";

interface AttemptResult {
  correct: boolean;
  detectedChord: DetectedChord | null;
  feedback: string;
  suggestion?: string;
  modeExplanation?: string;
  voicingTip?: string;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [analysis, setAnalysis] = useState<ScoreAnalysis>(DUMMY_ANALYSIS);
  const [currentBar, setCurrentBar] = useState<Bar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Chord recognition and coaching hooks
  const { analyzeChord } = useChordRecognition();
  const { requestCoaching, isLoading: isCoachingLoading } = useCoaching();

  // Load lesson on mount
  useEffect(() => {
    const loadLesson = async () => {
      setIsLoading(true);

      try {
        const res = await fetch(`/api/lesson/${encodeURIComponent(lessonId)}`);
        if (res.status === 404) {
          // Lessons live in server memory and expire; do not silently swap in another score
          setLesson(null);
          setIsLoading(false);
          return;
        }
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load lesson");
        setAnalysis(json.data.analysis);
        setLesson(json.data.lesson);
        setCurrentBar(json.data.analysis.bars[json.data.lesson.currentBarIndex]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      }
      setIsLoading(false);
    };

    loadLesson();
  }, [lessonId]);

  // Handle attempt submission
  const handleAttempt = useCallback(
    async (audioBlob: Blob) => {
      if (!lesson || !currentBar) return;

      setIsAnalyzing(true);
      setLastAttempt(null);
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);

      try {
        // Step 1: Analyze chord using client-side recognition
        const recognitionResult = await analyzeChord(audioBlob);

        // Build detected chord for API
        const detectedChord: DetectedChord | null = recognitionResult.chord.chord
          ? {
              root: recognitionResult.chord.root,
              quality: recognitionResult.chord.chord.replace(recognitionResult.chord.root, "") || "major",
              voicing: recognitionResult.chord.voicingType,
              notes: [],
              confidence: recognitionResult.chord.confidence,
            }
          : null;

        // Check if chord matches expected
        const normalizedDetected = recognitionResult.chord.chord?.toLowerCase() || "";
        const normalizedExpected = currentBar.chordSymbol.toLowerCase();
        const isCorrect = normalizedDetected === normalizedExpected;

        // Step 2: Send to API to record attempt
        const response = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            barNumber: currentBar.barNumber,
            recognizedChord: recognitionResult.chord.chord
              ? {
                  chord: recognitionResult.chord.chord,
                  confidence: recognitionResult.chord.confidence,
                  voicingType: recognitionResult.chord.voicingType,
                  pitchClasses: recognitionResult.chord.pitchClasses,
                }
              : null,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Evaluation failed");
        }

        // Step 3: Request AI coaching feedback
        const coaching = await requestCoaching({
          lessonId: lesson.id,
          barNumber: currentBar.barNumber,
          detectedChord,
          isCorrect: result.data.correct,
          attemptNumber: newAttemptCount,
        });

        // Build the attempt result with coaching
        setLastAttempt({
          correct: result.data.correct,
          detectedChord: result.data.detectedChord,
          feedback: coaching?.feedback || result.data.feedback,
          suggestion: coaching?.suggestion || (result.data.correct
            ? "Great! Try the next chord when ready."
            : "Take your time and try again."),
          modeExplanation: coaching?.modeExplanation,
          voicingTip: coaching?.voicingTip,
        });

        // Reset attempt count on success
        if (result.data.correct) {
          setAttemptCount(0);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : "Evaluation failed");
      } finally {
        setIsAnalyzing(false);
      }
    },
    [lesson, currentBar, attemptCount, analyzeChord, requestCoaching]
  );

  // Navigate to next bar
  const handleNextBar = useCallback(() => {
    if (!lesson) return;

    const nextIndex = lesson.currentBarIndex + 1;
    if (nextIndex < lesson.totalBars) {
      const updatedLesson = { ...lesson, currentBarIndex: nextIndex };
      setLesson(updatedLesson);
      setCurrentBar(analysis.bars[nextIndex]);
      setLastAttempt(null);
    }
  }, [lesson, analysis]);

  // Navigate to previous bar
  const handlePreviousBar = useCallback(() => {
    if (!lesson) return;

    const prevIndex = lesson.currentBarIndex - 1;
    if (prevIndex >= 0) {
      const updatedLesson = { ...lesson, currentBarIndex: prevIndex };
      setLesson(updatedLesson);
      setCurrentBar(analysis.bars[prevIndex]);
      setLastAttempt(null);
    }
  }, [lesson, analysis]);

  // Loading state
  if (isLoading) {
    return (
      <PageContainer maxWidth="lg">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Card className="py-16">
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-accent-teal border-t-transparent rounded-full animate-spin" />
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer maxWidth="lg">
        <Card className="text-center py-8">
          <h2 className="text-xl font-semibold text-accent-coral mb-2">
            Error Loading Lesson
          </h2>
          <p className="text-primary-400 mb-4">{error}</p>
          <button
            className="btn-primary"
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        </Card>
      </PageContainer>
    );
  }

  // No lesson found
  if (!lesson || !currentBar) {
    return (
      <PageContainer maxWidth="lg">
        <Card className="text-center py-8">
          <h2 className="text-xl font-semibold text-primary-100 mb-2">
            Lesson Not Found
          </h2>
          <p className="text-primary-400 mb-4">
            Your uploaded lead sheet is no longer available. Upload it again.
          </p>
          <button
            className="btn-primary"
            onClick={() => router.push("/")}
          >
            Upload again
          </button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-display font-bold text-primary-100 text-center mb-8">
          Practice: {analysis.title}
        </h1>

        <LessonView
          lesson={lesson}
          currentBar={currentBar}
          onAttempt={handleAttempt}
          onNextBar={handleNextBar}
          onPreviousBar={handlePreviousBar}
          isAnalyzing={isAnalyzing}
          lastAttempt={lastAttempt}
        />
      </motion.div>
    </PageContainer>
  );
}
