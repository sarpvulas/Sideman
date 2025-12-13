"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, ChevronLeft, ChevronRight, X, Sparkles, Play, Music } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card, Button } from "@/components/ui";
import { PianoKeyboard } from "@/components/piano";
import { getPianoSynth } from "@/lib/audio/piano-synth";
import type { NoteHighlight, NoteRole } from "@/types";

export interface ExercisePanelProps {
  chordSymbol: string;
  className?: string;
}

interface VoicingExercise {
  type: string;
  name: string;
  description: string;
  notes: { note: string; octave: number; role: NoteRole }[];
}

export function ExercisePanel({ chordSymbol, className }: ExercisePanelProps) {
  const [exercises, setExercises] = useState<VoicingExercise[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get current exercise notes as strings for playback
  const currentExercise = exercises?.[currentIndex];
  const noteStrings = currentExercise?.notes.map((n) => `${n.note}${n.octave}`) || [];

  // Play chord (all notes at once)
  const handlePlayChord = useCallback(() => {
    if (noteStrings.length === 0) return;
    setIsPlaying(true);
    const synth = getPianoSynth();
    synth.init();
    synth.playChord(noteStrings, 2);
    setTimeout(() => setIsPlaying(false), 2000);
  }, [noteStrings]);

  // Play arpeggio (notes one by one)
  const handlePlayArpeggio = useCallback(() => {
    if (noteStrings.length === 0) return;
    setIsPlaying(true);
    const synth = getPianoSynth();
    synth.init();
    synth.playArpeggio(noteStrings, 0.2, 1.5);
    const duration = noteStrings.length * 200 + 1500;
    setTimeout(() => setIsPlaying(false), duration);
  }, [noteStrings]);

  // Reset exercises when chord changes
  useEffect(() => {
    setExercises(null);
    setCurrentIndex(0);
    setError(null);
  }, [chordSymbol]);

  const handleGenerateExercises = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/exercise/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chordSymbol }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setExercises(null);
      } else if (data.exercises && data.exercises.length > 0) {
        setExercises(data.exercises);
        setCurrentIndex(0);
      } else {
        setError("No exercises generated");
      }
    } catch (err) {
      setError("Failed to generate exercises");
    } finally {
      setIsGenerating(false);
    }
  }, [chordSymbol]);

  const handleClose = useCallback(() => {
    setExercises(null);
    setCurrentIndex(0);
    setError(null);
  }, []);

  const handleNext = useCallback(() => {
    if (exercises) {
      setCurrentIndex((prev) => (prev + 1) % exercises.length);
    }
  }, [exercises]);

  const handlePrevious = useCallback(() => {
    if (exercises) {
      setCurrentIndex((prev) => (prev - 1 + exercises.length) % exercises.length);
    }
  }, [exercises]);

  // Convert exercise notes to highlight format with octave
  const highlightedNotes: NoteHighlight[] = currentExercise
    ? currentExercise.notes.map((n) => ({
        note: `${n.note}${n.octave}`,
        role: n.role,
      }))
    : [];

  // Voicing type colors for badges
  const voicingColors: Record<string, string> = {
    shell: "bg-emerald-500",
    "rootless-a": "bg-blue-500",
    "rootless-b": "bg-indigo-500",
    "drop-2": "bg-purple-500",
    full: "bg-amber-500",
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Generate button */}
      {!exercises && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2"
        >
          <Button
            variant="secondary"
            onClick={handleGenerateExercises}
            disabled={isGenerating}
            leftIcon={
              isGenerating ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )
            }
          >
            {isGenerating ? "Generating with AI..." : "Generate Voicing Exercises"}
          </Button>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </motion.div>
      )}

      {/* Exercise display */}
      <AnimatePresence mode="wait">
        {exercises && currentExercise && (
          <motion.div
            key="exercise-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-primary-700 hover:bg-primary-600 transition-colors"
                aria-label="Close exercises"
              >
                <X className="w-4 h-4 text-primary-300" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium text-white",
                      voicingColors[currentExercise.type] || "bg-gray-500"
                    )}
                  >
                    {currentExercise.type.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-semibold text-white">
                    {currentExercise.name}
                  </h3>
                  <span title="AI Generated"><Sparkles className="w-4 h-4 text-accent-gold" /></span>
                </div>
                <p className="text-sm text-primary-400 max-w-md mx-auto">
                  {currentExercise.description}
                </p>
                <p className="text-xs text-primary-500 mt-2">
                  Exercise {currentIndex + 1} of {exercises.length} for{" "}
                  <span className="text-accent-gold font-medium">{chordSymbol}</span>
                </p>
              </div>

              {/* Piano keyboard */}
              <div className="flex justify-center mb-4 px-4">
                <PianoKeyboard
                  startOctave={3}
                  endOctave={4}
                  highlightedNotes={highlightedNotes}
                  showLabels={true}
                />
              </div>

              {/* Play buttons */}
              <div className="flex justify-center gap-3 mb-6">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePlayChord}
                  disabled={isPlaying}
                  leftIcon={<Play className="w-4 h-4" />}
                >
                  Play Chord
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePlayArpeggio}
                  disabled={isPlaying}
                  leftIcon={<Music className="w-4 h-4" />}
                >
                  Play Arpeggio
                </Button>
              </div>

              {/* Note legend */}
              <div className="flex flex-wrap justify-center gap-3 mb-6 text-xs">
                {currentExercise.notes.map((n, i) => (
                  <motion.span
                    key={`${n.note}-${n.octave}-${i}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-1.5 bg-primary-700 px-2 py-1 rounded"
                  >
                    <span
                      className={cn(
                        "w-3 h-3 rounded",
                        n.role === "root" && "bg-red-500",
                        n.role === "third" && "bg-orange-500",
                        n.role === "fifth" && "bg-cyan-500",
                        n.role === "seventh" && "bg-purple-500",
                        n.role === "ninth" && "bg-blue-500"
                      )}
                    />
                    <span className="text-primary-200 font-medium">
                      {n.note}
                    </span>
                    <span className="text-primary-400">({n.role})</span>
                  </motion.span>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {/* Dots indicator */}
                <div className="flex gap-1.5">
                  {exercises.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i === currentIndex
                          ? "bg-accent-gold"
                          : "bg-primary-600 hover:bg-primary-500"
                      )}
                      aria-label={`Go to exercise ${i + 1}`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
