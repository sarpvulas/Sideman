"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { Waveform } from "./Waveform";
import { VolumeIndicator } from "./VolumeIndicator";

export interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  disabled?: boolean;
  maxDuration?: number; // in seconds
  className?: string;
}

type RecordingStatus = "idle" | "requesting" | "recording" | "stopped" | "error";

export function AudioRecorder({
  onRecordingComplete,
  disabled = false,
  maxDuration = 10,
  className,
}: AudioRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAnalyser(null);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Revoke audio URL on change
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      setStatus("requesting");
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      chunksRef.current = [];

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      // Create audio context and analyser for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      // Create media recorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("stopped");
        cleanup();
      };

      mediaRecorder.onerror = () => {
        setError("Recording error occurred");
        setStatus("error");
        cleanup();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setStatus("recording");

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 0.1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 100);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied"
          : "Failed to start recording";
      setError(message);
      setStatus("error");
      cleanup();
    }
  }, [cleanup, maxDuration]);

  const stopRecording = useCallback(() => {
    // Clear timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop media recorder if active
    if (mediaRecorderRef.current) {
      const state = mediaRecorderRef.current.state;
      if (state === "recording" || state === "paused") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error("Error stopping recorder:", e);
          // Force cleanup if stop fails
          cleanup();
          setStatus("idle");
        }
      }
    }
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  }, [cleanup]);

  const handleToggle = useCallback(async () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle" || status === "error") {
      await startRecording();
    }
  }, [status, startRecording, stopRecording]);

  const handleSubmit = useCallback(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob);
      reset();
    }
  }, [audioBlob, onRecordingComplete, reset]);

  const isRecording = status === "recording";
  const hasRecording = status === "stopped" && audioBlob;

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Volume indicator (when recording) */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-xs"
          >
            <VolumeIndicator analyser={analyser} isActive={isRecording} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main record button */}
      <div className="relative">
        <motion.button
          data-testid="record-button"
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center",
            "transition-colors duration-200",
            isRecording
              ? "bg-accent-coral"
              : "bg-accent-gold hover:bg-accent-gold-glow",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleToggle}
          disabled={disabled || status === "requesting"}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          whileHover={!disabled ? { scale: 1.05 } : undefined}
          whileTap={!disabled ? { scale: 0.95 } : undefined}
        >
          {isRecording ? (
            <Square className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-primary-900" />
          )}

          {/* Recording pulse animation */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                data-testid="recording-indicator"
                className="absolute inset-0 rounded-full border-4 border-accent-coral"
                initial={{ scale: 1, opacity: 1 }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* Duration indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2"
            >
              <span className="text-sm font-mono text-accent-coral">
                {formatDuration(duration)} / {formatDuration(maxDuration)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-sm text-primary-300 mt-2"
        >
          {status === "idle" && "Tap to record your chord"}
          {status === "requesting" && "Requesting microphone..."}
          {status === "recording" && "Recording... Tap to stop"}
          {status === "stopped" && audioBlob && "Recording complete"}
          {status === "error" && "Recording failed"}
        </motion.p>
      </AnimatePresence>

      {/* Waveform visualization */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            data-testid="waveform"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-xs"
          >
            <Waveform analyser={analyser} isActive={isRecording} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio playback (when recording is complete) */}
      <AnimatePresence>
        {hasRecording && audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-xs"
          >
            <audio
              src={audioUrl}
              controls
              className="w-full h-10 rounded-lg"
              data-testid="audio-playback"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons (when recording is complete) */}
      <AnimatePresence>
        {hasRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-3"
          >
            <button
              className="btn-secondary text-sm flex items-center gap-2"
              onClick={reset}
            >
              <RotateCcw className="w-4 h-4" />
              Re-record
            </button>
            <button
              className="btn-primary text-sm"
              onClick={handleSubmit}
              data-testid="submit-button"
            >
              Submit for Analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-accent-coral text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
