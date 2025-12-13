"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card, Badge } from "@/components/ui";
import type { DetectedChord } from "@/types";

export interface FeedbackPanelProps {
  isCorrect: boolean | null;
  expectedChord: string;
  detectedChord: DetectedChord | null;
  feedback: string;
  suggestion?: string;
  modeExplanation?: string;
  voicingTip?: string;
  className?: string;
}

export function FeedbackPanel({
  isCorrect,
  expectedChord,
  detectedChord,
  feedback,
  suggestion,
  modeExplanation,
  voicingTip,
  className,
}: FeedbackPanelProps) {
  if (isCorrect === null) {
    return null;
  }

  return (
    <motion.div
      data-testid="feedback-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn("w-full", className)}
    >
      <Card
        className={cn(
          "border-2",
          isCorrect ? "border-accent-gold" : "border-accent-coral"
        )}
      >
        {/* Result header */}
        <div className="flex items-center gap-3 mb-4">
          {isCorrect ? (
            <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-accent-gold" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent-coral/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-accent-coral" />
            </div>
          )}

          <div>
            <h3
              className={cn(
                "text-lg font-semibold",
                isCorrect ? "text-accent-gold" : "text-accent-coral"
              )}
            >
              {isCorrect ? "Correct!" : "Not quite"}
            </h3>
            <p className="text-sm text-primary-400">
              Expected: {expectedChord}
            </p>
          </div>
        </div>

        {/* Detected chord */}
        {detectedChord && (
          <div className="mb-4 p-3 bg-primary-700/50 rounded-lg">
            <p className="text-sm text-primary-400 mb-1">You played:</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-100">
                {detectedChord.root}
                {detectedChord.quality}
              </span>
              <Badge variant="info" size="sm">
                {detectedChord.voicing}
              </Badge>
              <Badge
                variant={detectedChord.confidence > 0.8 ? "success" : "warning"}
                size="sm"
              >
                {Math.round(detectedChord.confidence * 100)}% confidence
              </Badge>
            </div>
            {detectedChord.notes.length > 0 && (
              <p className="text-xs text-primary-400 mt-1">
                Notes: {detectedChord.notes.join(", ")}
              </p>
            )}
          </div>
        )}

        {!detectedChord && (
          <div className="mb-4 p-3 bg-primary-700/50 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent-amber" />
            <p className="text-sm text-primary-300">No chord detected</p>
          </div>
        )}

        {/* Feedback message */}
        <div role="status" aria-live="polite" aria-atomic="true">
          <p className="text-primary-200">{feedback}</p>
        </div>

        {/* Suggestion */}
        {suggestion && (
          <div className="mt-4 p-3 bg-accent-teal/10 border border-accent-teal/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary-200">{suggestion}</p>
            </div>
          </div>
        )}

        {/* Voicing Tip */}
        {voicingTip && (
          <div className="mt-4 p-3 bg-primary-700/50 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">🎹</span>
              <div>
                <p className="text-xs text-primary-400 uppercase tracking-wide mb-1">Voicing Tip</p>
                <p className="text-sm text-primary-200">{voicingTip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mode Explanation */}
        {modeExplanation && (
          <div className="mt-4 p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">🎵</span>
              <div>
                <p className="text-xs text-primary-400 uppercase tracking-wide mb-1">For Improvisation</p>
                <p className="text-sm text-primary-200">{modeExplanation}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
