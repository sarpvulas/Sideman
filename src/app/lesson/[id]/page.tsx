"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout";
import { LessonView } from "@/components/lesson";
import { Card, Skeleton } from "@/components/ui";
import { DUMMY_ANALYSIS, storage, createLessonFromAnalysis } from "@/lib/dummy-data";
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

      let storedLesson: Lesson | undefined;
      let storedAnalysis: ScoreAnalysis = DUMMY_ANALYSIS;

      // The server holds the lesson created from the uploaded score
      try {
        const res = await fetch(`/api/lesson/${encodeURIComponent(lessonId)}`);
        const json = await res.json();
        if (json.success) {
          storedLesson = json.data.lesson;
          storedAnalysis = json.data.analysis;
        }
      } catch {
        // fall through to the sample lesson
      }

      // If the lesson is gone (e.g. server restarted), use the sample score
      if (!storedLesson) {
        const dummyLesson = createLessonFromAnalysis(DUMMY_ANALYSIS);
        dummyLesson.id = lessonId;
        storedLesson = dummyLesson;
      }

      setAnalysis(storedAnalysis);
      setLesson(storedLesson);
      setCurrentBar(storedAnalysis.bars[storedLesson.currentBarIndex]);
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

        // If lesson is complete, show completion message
        if (result.data.lessonComplete) {
          console.log("Lesson complete!");
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
      storage.updateLesson(lesson.id, { currentBarIndex: nextIndex });
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
      storage.updateLesson(lesson.id, { currentBarIndex: prevIndex });
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
            This lesson doesn&apos;t exist or has expired.
          </p>
          <button
            className="btn-primary"
            onClick={() => router.push("/")}
          >
            Start New Lesson
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
