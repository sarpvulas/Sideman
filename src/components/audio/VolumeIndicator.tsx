"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export interface VolumeIndicatorProps {
  analyser: AnalyserNode | null;
  isActive?: boolean;
  showDb?: boolean;
  className?: string;
}

export function VolumeIndicator({
  analyser,
  isActive = false,
  showDb = false,
  className,
}: VolumeIndicatorProps) {
  const [volume, setVolume] = useState(0);
  const [peak, setPeak] = useState(0);
  const animationRef = useRef<number>();
  const peakDecayRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !analyser) {
      setVolume(0);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedVolume = Math.min(rms / 128, 1);

      setVolume(normalizedVolume);

      // Peak hold with decay
      if (normalizedVolume > peak) {
        setPeak(normalizedVolume);
        peakDecayRef.current = 0;
      } else {
        peakDecayRef.current++;
        if (peakDecayRef.current > 30) {
          setPeak((prev) => Math.max(prev - 0.02, normalizedVolume));
        }
      }

      animationRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser, peak]);

  // Convert to dB for display
  const db = volume > 0 ? 20 * Math.log10(volume) : -60;
  const clampedDb = Math.max(-60, Math.min(0, db));

  // Determine color based on volume level
  const getColor = () => {
    if (volume > 0.9) return "bg-accent-coral"; // Clipping
    if (volume > 0.7) return "bg-accent-amber"; // Hot
    if (volume > 0.3) return "bg-accent-gold"; // Good
    return "bg-accent-teal"; // Low
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Volume bar */}
      <div className="flex-1 h-3 bg-primary-700 rounded-full overflow-hidden relative">
        <motion.div
          className={cn("h-full rounded-full transition-colors", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${volume * 100}%` }}
          transition={{ duration: 0.05 }}
        />
        {/* Peak indicator */}
        <motion.div
          className="absolute top-0 w-0.5 h-full bg-white/80"
          initial={{ left: 0 }}
          animate={{ left: `${peak * 100}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>

      {/* dB readout */}
      {showDb && (
        <span className="text-xs text-primary-400 w-12 text-right font-mono">
          {clampedDb.toFixed(0)} dB
        </span>
      )}

      {/* Level indicator dots */}
      <div className="flex gap-0.5">
        {[0.2, 0.4, 0.6, 0.8, 0.95].map((threshold, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              volume >= threshold
                ? i >= 4
                  ? "bg-accent-coral"
                  : i >= 3
                  ? "bg-accent-amber"
                  : "bg-accent-teal"
                : "bg-primary-600"
            )}
          />
        ))}
      </div>
    </div>
  );
}
