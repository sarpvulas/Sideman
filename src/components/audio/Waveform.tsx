"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export interface WaveformProps {
  analyser: AnalyserNode | null;
  isActive?: boolean;
  barCount?: number;
  className?: string;
}

export function Waveform({
  analyser,
  isActive = false,
  barCount = 32,
  className,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const draw = useCallback(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate bar dimensions
    const barWidth = canvas.width / barCount;
    const gap = 2;
    const actualBarWidth = barWidth - gap;

    // Sample the frequency data
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      // Average a range of frequencies for each bar
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      const average = sum / step;

      // Normalize to canvas height
      const barHeight = (average / 255) * canvas.height * 0.9;

      // Create gradient
      const gradient = ctx.createLinearGradient(
        0,
        canvas.height,
        0,
        canvas.height - barHeight
      );
      gradient.addColorStop(0, "#4ecdc4"); // teal
      gradient.addColorStop(1, "#d4af37"); // gold

      ctx.fillStyle = gradient;

      // Draw bar centered vertically
      const x = i * barWidth + gap / 2;
      const y = (canvas.height - barHeight) / 2;

      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, barHeight, 2);
      ctx.fill();
    }

    if (isActive) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [analyser, barCount, isActive]);

  useEffect(() => {
    if (isActive && analyser) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser, draw]);

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      transition={{ duration: 0.2 }}
    >
      <canvas
        ref={canvasRef}
        width={256}
        height={64}
        className="w-full h-16"
        aria-hidden="true"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 bg-primary-600 rounded-full"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
