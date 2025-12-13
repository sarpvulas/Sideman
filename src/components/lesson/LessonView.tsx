"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button, Card, Badge } from "@/components/ui";
import { ChordDiagram, PianoKeyboard } from "@/components/piano";
import { AudioRecorder } from "@/components/audio";
import { FeedbackPanel } from "@/components/feedback";
import type { Bar, Lesson, DetectedChord, NoteHighlight } from "@/types";

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
  const [selectedVoicing, setSelectedVoicing] = useState<string>("shell");

  const progress = ((lesson.currentBarIndex + 1) / lesson.totalBars) * 100;

  // Convert voicingNotes to highlight notes (with octave for piano display)
  const highlightedNotes: NoteHighlight[] = currentBar.voicingNotes
    ? currentBar.voicingNotes.map((vn) => ({
        note: `${vn.note}4`, // Default to octave 4
        role: vn.role as NoteHighlight["role"],
      }))
    : currentBar.recommendedVoicing.map((note, index) => ({
        note: `${note}4`,
        role: index === 0 ? "third" : index === 1 ? "seventh" : "root",
      }));

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
            notes={highlightedNotes}
            voicingType={selectedVoicing as any}
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

      {/* Piano keyboard with highlighted voicing notes */}
      <Card className="py-6 px-8">
        <h3 className="text-sm font-medium text-primary-400 text-center mb-4">
          Recommended Voicing
        </h3>
        <div className="flex justify-center">
          <PianoKeyboard
            startOctave={4}
            endOctave={4}
            highlightedNotes={highlightedNotes}
            showLabels={true}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-primary-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500"></span> Root
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500"></span> 3rd
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500"></span> 5th
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500"></span> 7th
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span> 9th
          </span>
        </div>
      </Card>

      {/* Voicing selector */}
      <Card padding="sm">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-primary-400 mr-2">Voicing:</span>
          <div data-testid="voicing-selector" className="flex gap-2">
            {["shell", "rootless", "drop-2", "full"].map((voicing) => (
              <button
                key={voicing}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  selectedVoicing === voicing
                    ? "bg-accent-teal text-primary-900"
                    : "bg-primary-700 text-primary-300 hover:bg-primary-600"
                )}
                onClick={() => setSelectedVoicing(voicing)}
                data-voicing={voicing}
              >
                {voicing.charAt(0).toUpperCase() + voicing.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

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
