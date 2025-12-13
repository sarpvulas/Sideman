"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui";
import type { CoachingFeedback as CoachingFeedbackType } from "@/hooks/useCoaching";

export interface CoachingFeedbackProps {
  coaching: CoachingFeedbackType | null;
  isLoading?: boolean;
  isCorrect?: boolean;
  className?: string;
}

export function CoachingFeedback({
  coaching,
  isLoading,
  isCorrect,
  className,
}: CoachingFeedbackProps) {
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-primary-400"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm">Getting feedback...</span>
          </motion.div>
        )}

        {!isLoading && coaching && (
          <motion.div
            key="coaching"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Main feedback */}
            <div
              className={cn(
                "p-4 rounded-lg border",
                isCorrect
                  ? "bg-green-900/20 border-green-700/50"
                  : "bg-amber-900/20 border-amber-700/50"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{isCorrect ? "✓" : "○"}</span>
                <div className="flex-1">
                  <p className="text-primary-100 font-medium">{coaching.feedback}</p>
                  <p className="text-primary-300 text-sm mt-1">{coaching.encouragement}</p>
                </div>
              </div>
            </div>

            {/* Suggestion */}
            {coaching.suggestion && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-3 bg-primary-800/50 rounded-lg"
              >
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-sm font-medium text-primary-200">Suggestion</p>
                  <p className="text-sm text-primary-300">{coaching.suggestion}</p>
                </div>
              </motion.div>
            )}

            {/* Voicing tip */}
            {coaching.voicingTip && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 p-3 bg-primary-800/50 rounded-lg"
              >
                <span className="text-xl">🎹</span>
                <div>
                  <p className="text-sm font-medium text-primary-200">Voicing Tip</p>
                  <p className="text-sm text-primary-300">{coaching.voicingTip}</p>
                </div>
              </motion.div>
            )}

            {/* Mode explanation */}
            {coaching.modeExplanation && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 p-3 bg-primary-800/50 rounded-lg"
              >
                <span className="text-xl">🎵</span>
                <div>
                  <p className="text-sm font-medium text-primary-200">For Improvisation</p>
                  <p className="text-sm text-primary-300">{coaching.modeExplanation}</p>
                </div>
              </motion.div>
            )}

            {/* Action badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {coaching.shouldRepeat && (
                <Badge variant="warning" size="sm">
                  Practice this chord again
                </Badge>
              )}
              {coaching.shouldPracticeScale && (
                <Badge variant="info" size="sm">
                  Try practicing the scale first
                </Badge>
              )}
              {isCorrect && !coaching.shouldRepeat && (
                <Badge variant="success" size="sm">
                  Ready for next chord!
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        {!isLoading && !coaching && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-primary-500 text-sm text-center py-4"
          >
            Play a chord to receive feedback
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
