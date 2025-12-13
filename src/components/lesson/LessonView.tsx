"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button, Card } from "@/components/ui";
import { ChordDiagram } from "@/components/piano";
import { AudioRecorder } from "@/components/audio";
import { FeedbackPanel } from "@/components/feedback";
import { ExercisePanel } from "@/components/exercises";
import type { Bar, Lesson, DetectedChord } from "@/types";

export interface LessonViewProps {
  lesson: Lesson;
  currentBar: Bar;
  onAttempt: (audioBlob: Blob) => Promise<void>;
  onNextBar: () => void;
  onPreviousBar: () => void;
  isAnalyzing?: boolean;
  lastAttempt?: {
    correct: boolean;
    detectedChord: DetectedChord | null;
    feedback: string;
    suggestion?: string;
    modeExplanation?: string;
    voicingTip?: string;
  } | null;
  className?: string;
}

export function LessonView({
  lesson,
  currentBar,
  onAttempt,
  onNextBar,
  onPreviousBar,
  isAnalyzing = false,
  lastAttempt,
  className,
}: LessonViewProps) {
  const progress = ((lesson.currentBarIndex + 1) / lesson.totalBars) * 100;

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      await onAttempt(blob);
    },
    [onAttempt]
  );

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-primary-400">
          <span>
            Bar {lesson.currentBarIndex + 1} of {lesson.totalBars}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-primary-700 rounded-full overflow-hidden">
          <motion.div
            data-testid="lesson-progress"
            className="h-full bg-accent-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Current chord display */}
      <Card className="text-center py-8">
        <div data-testid="current-chord">
          <ChordDiagram
            chordSymbol={currentBar.chordSymbol}
          />
        </div>

        {/* Mode suggestion */}
        {currentBar.improvModes[0] && (
          <motion.div
            data-testid="mode-suggestion"
            className="mt-6 p-4 bg-primary-700/50 rounded-lg inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-primary-400 mb-1">Suggested mode:</p>
            <p className="text-lg font-medium text-accent-teal">
              {currentBar.improvModes[0].mode}
            </p>
            <p className="text-xs text-primary-400 mt-1 max-w-md">
              {currentBar.improvModes[0].why}
            </p>
          </motion.div>
        )}
      </Card>

      {/* Voicing exercises */}
      <ExercisePanel chordSymbol={currentBar.chordSymbol} />

      {/* Audio recorder */}
      <Card className="py-8">
        {isAnalyzing ? (
          <div
            data-testid="analyzing-indicator"
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 border-4 border-accent-teal border-t-transparent rounded-full animate-spin" />
            <p className="text-primary-300">Analyzing your playing...</p>
          </div>
        ) : (
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        )}
      </Card>

      {/* Feedback panel */}
      {lastAttempt && (
        <FeedbackPanel
          isCorrect={lastAttempt.correct}
          expectedChord={currentBar.chordSymbol}
          detectedChord={lastAttempt.detectedChord}
          feedback={lastAttempt.feedback}
          suggestion={lastAttempt.suggestion}
          modeExplanation={lastAttempt.modeExplanation}
          voicingTip={lastAttempt.voicingTip}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="secondary"
          onClick={onPreviousBar}
          disabled={lesson.currentBarIndex === 0}
          leftIcon={<ChevronLeft className="w-5 h-5" />}
        >
          Previous
        </Button>

        <Button
          variant="ghost"
          onClick={() => window.location.reload()}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Restart
        </Button>

        <Button
          variant="primary"
          onClick={onNextBar}
          disabled={lesson.currentBarIndex >= lesson.totalBars - 1}
          rightIcon={<ChevronRight className="w-5 h-5" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
