"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface UseAudioAnalyserReturn {
  analyser: AnalyserNode | null;
  isActive: boolean;
  error: string | null;
  startAnalyser: (stream: MediaStream) => void;
  stopAnalyser: () => void;
}

export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startAnalyser = useCallback((stream: MediaStream) => {
    try {
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;

      // Resume if suspended
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create source from stream
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create analyser
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;

      // Connect source -> analyser
      source.connect(analyserNode);

      setAnalyser(analyserNode);
      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create analyser");
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setAnalyser(null);
    setIsActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalyser();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [stopAnalyser]);

  return {
    analyser,
    isActive,
    error,
    startAnalyser,
    stopAnalyser,
  };
}
