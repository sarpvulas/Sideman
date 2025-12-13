/**
 * Audio processing module exports
 * Main entry point for chord recognition
 */

export * from "./decode";
export * from "./fft";
export * from "./pitch";
export * from "./chord-inference";
export * from "./reliability";
export * from "./piano-synth";

import { extractSegment, isSilent, AudioData } from "./decode";
import { detectPitches, DetectedPitch } from "./pitch";
import { inferChord, ChordInferenceResult, compareChords } from "./chord-inference";
import { evaluateReliability, ReliabilityResult, DEFAULT_RELIABILITY_CONFIG } from "./reliability";
import { VoicingType } from "@/types";

export interface ChordRecognitionResult {
  success: boolean;
  chord: ChordInferenceResult;
  pitches: DetectedPitch[];
  audioData: {
    duration: number;
    sampleRate: number;
  };
  reliability: ReliabilityResult;
  error?: string;
}

export interface ChordEvaluationResult {
  success: boolean;
  chordMatch: boolean;
  voicingMatch: boolean;
  confidence: number;
  detectedChord: string | null;
  expectedChord: string;
  feedback: string[];
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof AudioContext !== "undefined";
}

/**
 * Decode audio blob to PCM samples (browser only)
 */
async function decodeAudioInBrowser(blob: Blob): Promise<AudioData> {
  if (!isBrowser()) {
    throw new Error("Audio decoding is only available in browser environment");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get mono channel (mix down if stereo)
    let samples: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      samples = audioBuffer.getChannelData(0);
    } else {
      // Mix stereo to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      samples = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        samples[i] = (left[i] + right[i]) / 2;
      }
    }

    return {
      samples,
      sampleRate: audioBuffer.sampleRate,
      duration: audioBuffer.duration,
    };
  } finally {
    await audioContext.close();
  }
}

/**
 * Recognize chord from audio blob
 * Main entry point for chord recognition
 * Note: This function requires browser environment with AudioContext
 */
export async function recognizeChord(blob: Blob): Promise<ChordRecognitionResult> {
  const defaultReliability: ReliabilityResult = {
    isReliable: false,
    issues: [],
    adjustedConfidence: 0,
    signalQuality: "poor",
    recommendations: [],
  };

  try {
    // Decode audio (browser only)
    const audioData = await decodeAudioInBrowser(blob);

    // Check for silence
    if (isSilent(audioData.samples)) {
      return {
        success: false,
        chord: {
          chord: null,
          root: "",
          quality: "major",
          voicingType: "shell",
          confidence: 0,
          pitchClasses: [],
          matchedTemplate: null,
        },
        pitches: [],
        audioData: {
          duration: audioData.duration,
          sampleRate: audioData.sampleRate,
        },
        reliability: {
          ...defaultReliability,
          issues: ["Silence detected"],
          recommendations: ["Play the chord louder or move closer to the microphone"],
        },
        error: "No audio detected. Please play louder.",
      };
    }

    // Extract the most stable segment (middle portion)
    const segmentData = extractStableSegment(audioData);

    // Detect pitches
    const pitches = detectPitches(segmentData.samples, segmentData.sampleRate, {
      minFrequency: 65, // C2
      maxFrequency: 2100, // C7
      threshold: 0.15,
      maxPitches: 8,
    });

    // Infer chord from pitches
    const chord = inferChord(pitches);

    // Evaluate reliability
    const reliability = evaluateReliability(
      segmentData.samples,
      pitches,
      chord.confidence,
      DEFAULT_RELIABILITY_CONFIG
    );

    // Adjust chord confidence based on reliability
    const adjustedChord = {
      ...chord,
      confidence: reliability.adjustedConfidence,
    };

    return {
      success: chord.chord !== null && reliability.isReliable,
      chord: adjustedChord,
      pitches,
      audioData: {
        duration: audioData.duration,
        sampleRate: audioData.sampleRate,
      },
      reliability,
    };
  } catch (error) {
    return {
      success: false,
      chord: {
        chord: null,
        root: "",
        quality: "major",
        voicingType: "shell",
        confidence: 0,
        pitchClasses: [],
        matchedTemplate: null,
      },
      pitches: [],
      audioData: {
        duration: 0,
        sampleRate: 0,
      },
      reliability: {
        ...defaultReliability,
        issues: ["Audio processing failed"],
      },
      error: error instanceof Error ? error.message : "Failed to process audio",
    };
  }
}

/**
 * Extract the most stable segment for analysis
 * Typically the middle 50% of the audio where the chord is sustained
 */
function extractStableSegment(audioData: AudioData): AudioData {
  const { duration } = audioData;

  // For very short clips, use the whole thing
  if (duration < 0.5) {
    return audioData;
  }

  // Extract middle 50%
  const startTime = duration * 0.25;
  const endTime = duration * 0.75;

  return extractSegment(audioData, startTime, endTime);
}

/**
 * Evaluate a chord attempt against expected chord
 * Note: This function requires browser environment with AudioContext
 */
export async function evaluateChordAttempt(
  blob: Blob,
  expectedChord: string,
  expectedVoicing: VoicingType
): Promise<ChordEvaluationResult> {
  const recognition = await recognizeChord(blob);

  if (!recognition.success) {
    return {
      success: false,
      chordMatch: false,
      voicingMatch: false,
      confidence: 0,
      detectedChord: null,
      expectedChord,
      feedback: [recognition.error || "Could not recognize chord"],
    };
  }

  const comparison = compareChords(recognition.chord, expectedChord, expectedVoicing);

  return {
    success: comparison.chordMatch && comparison.voicingMatch,
    chordMatch: comparison.chordMatch,
    voicingMatch: comparison.voicingMatch,
    confidence: recognition.chord.confidence,
    detectedChord: recognition.chord.chord,
    expectedChord,
    feedback: comparison.feedback,
  };
}
