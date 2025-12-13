"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui";

export interface MetronomeProps {
  defaultTempo?: number;
  defaultEnabled?: boolean;
  onTempoChange?: (tempo: number) => void;
  className?: string;
}

export function Metronome({
  defaultTempo = 120,
  defaultEnabled = false,
  onTempoChange,
  className,
}: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(defaultEnabled);
  const [tempo, setTempo] = useState(defaultTempo);
  const [isMuted, setIsMuted] = useState(false);
  const [beat, setBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const beatCountRef = useRef(0);

  // Create click sound
  const playClick = useCallback(
    (time: number, isAccent: boolean) => {
      if (!audioContextRef.current || isMuted) return;

      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();

      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);

      // Accent on beat 1
      osc.frequency.value = isAccent ? 1000 : 800;
      gain.gain.value = isAccent ? 0.3 : 0.2;

      osc.start(time);
      osc.stop(time + 0.05);
    },
    [isMuted]
  );

  // Schedule next note
  const scheduleNote = useCallback(() => {
    if (!audioContextRef.current) return;

    const secondsPerBeat = 60.0 / tempo;
    const currentTime = audioContextRef.current.currentTime;

    // Schedule notes ahead of time
    while (nextNoteTimeRef.current < currentTime + 0.1) {
      const isAccent = beatCountRef.current % 4 === 0;
      playClick(nextNoteTimeRef.current, isAccent);

      // Update beat for visual
      setBeat(beatCountRef.current % 4);

      nextNoteTimeRef.current += secondsPerBeat;
      beatCountRef.current++;
    }
  }, [tempo, playClick]);

  // Start/stop metronome
  useEffect(() => {
    if (isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      beatCountRef.current = 0;

      const scheduler = () => {
        scheduleNote();
        timerIdRef.current = window.setTimeout(scheduler, 25);
      };

      scheduler();
    } else {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      setBeat(0);
    }

    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, [isPlaying, scheduleNote]);

  // Handle tempo change
  const handleTempoChange = (newTempo: number) => {
    const clampedTempo = Math.min(300, Math.max(40, newTempo));
    setTempo(clampedTempo);
    onTempoChange?.(clampedTempo);
  };

  return (
    <div
      data-testid="metronome"
      className={cn(
        "flex items-center gap-4 p-4 bg-primary-800/50 rounded-lg",
        className
      )}
    >
      {/* Play/Pause button */}
      <Button
        variant={isPlaying ? "primary" : "secondary"}
        size="sm"
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? "Stop metronome" : "Start metronome"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      {/* Beat indicator */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((b) => (
          <motion.div
            key={b}
            className={cn(
              "w-3 h-3 rounded-full",
              beat === b && isPlaying
                ? b === 0
                  ? "bg-accent-coral"
                  : "bg-accent-teal"
                : "bg-primary-600"
            )}
            animate={{
              scale: beat === b && isPlaying ? 1.3 : 1,
            }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>

      {/* Tempo control */}
      <div className="flex items-center gap-2">
        <button
          className="w-6 h-6 flex items-center justify-center bg-primary-700 rounded text-primary-300 hover:bg-primary-600"
          onClick={() => handleTempoChange(tempo - 5)}
        >
          -
        </button>

        <div className="w-16 text-center">
          <input
            type="number"
            value={tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value, 10) || 120)}
            className="w-full bg-transparent text-center text-primary-100 font-mono text-sm focus:outline-none"
            min={40}
            max={300}
          />
          <span className="text-xs text-primary-500">BPM</span>
        </div>

        <button
          className="w-6 h-6 flex items-center justify-center bg-primary-700 rounded text-primary-300 hover:bg-primary-600"
          onClick={() => handleTempoChange(tempo + 5)}
        >
          +
        </button>
      </div>

      {/* Mute button */}
      <button
        className={cn(
          "p-1.5 rounded transition-colors",
          isMuted ? "bg-accent-coral/20 text-accent-coral" : "bg-primary-700 text-primary-300"
        )}
        onClick={() => setIsMuted(!isMuted)}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
