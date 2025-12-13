"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Card, Badge } from "@/components/ui";
import { staggerContainerVariants, staggerItemVariants } from "@/hooks";
import type { Bar } from "@/types";

export interface ChordProgressionProps {
  bars: Bar[];
  currentBarIndex?: number;
  onBarClick?: (barIndex: number) => void;
  className?: string;
}

export function ChordProgression({
  bars,
  currentBarIndex,
  onBarClick,
  className,
}: ChordProgressionProps) {
  return (
    <motion.div
      data-testid="chord-grid"
      className={cn("grid grid-cols-4 md:grid-cols-8 gap-3", className)}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {bars.map((bar, index) => (
        <motion.button
          key={bar.barNumber}
          data-testid="chord-cell"
          variants={staggerItemVariants}
          className={cn(
            "p-4 rounded-xl text-center transition-all",
            "border-2 hover:border-accent-teal",
            currentBarIndex === index
              ? "bg-accent-teal/20 border-accent-teal"
              : "bg-primary-800 border-primary-700",
            onBarClick && "cursor-pointer"
          )}
          onClick={() => onBarClick?.(index)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xs text-primary-400 block mb-1">
            Bar {bar.barNumber}
          </span>
          <span className="text-xl font-bold text-primary-100 block">
            {bar.chordSymbol}
          </span>
          {bar.improvModes[0] && (
            <span className="text-xs text-primary-400 block mt-1 truncate">
              {bar.improvModes[0].mode}
            </span>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}

export interface AnalysisResultProps {
  title: string;
  keySignature: string;
  timeSignature: string;
  form: string[];
  bars: Bar[];
  onStartLesson: () => void;
  className?: string;
}

export function AnalysisResult({
  title,
  keySignature,
  timeSignature,
  form,
  bars,
  onStartLesson,
  className,
}: AnalysisResultProps) {
  return (
    <motion.div
      data-testid="analysis-result"
      className={cn("space-y-6", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <Card className="text-center">
        <h2 className="text-2xl font-display font-bold text-primary-100 mb-4">
          {title}
        </h2>

        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="info">Key: {keySignature}</Badge>
          <Badge variant="info">Time: {timeSignature}</Badge>
          <Badge variant="default">Form: {form.join(" - ")}</Badge>
        </div>
      </Card>

      {/* Chord progression */}
      <Card>
        <h3 className="text-lg font-semibold text-primary-100 mb-4">
          Chord Progression
        </h3>
        <ChordProgression bars={bars} />
      </Card>

      {/* Mode suggestions */}
      <Card>
        <h3 className="text-lg font-semibold text-primary-100 mb-4">
          Suggested Modes
        </h3>
        <div className="space-y-2">
          {bars.slice(0, 4).map((bar) => (
            <div
              key={bar.barNumber}
              className="flex items-start gap-3 p-3 bg-primary-700/50 rounded-lg"
            >
              <Badge variant="success" size="sm">
                {bar.chordSymbol}
              </Badge>
              <div>
                <p className="text-sm font-medium text-primary-100">
                  {bar.improvModes[0]?.mode || "No mode suggested"}
                </p>
                <p className="text-xs text-primary-400">
                  {bar.improvModes[0]?.why || ""}
                </p>
              </div>
            </div>
          ))}
          {bars.length > 4 && (
            <p className="text-sm text-primary-400 text-center">
              + {bars.length - 4} more bars
            </p>
          )}
        </div>
      </Card>

      {/* Start lesson button */}
      <div className="flex justify-center">
        <motion.button
          className="btn-primary text-lg px-8 py-4"
          onClick={onStartLesson}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Lesson
        </motion.button>
      </div>
    </motion.div>
  );
}
