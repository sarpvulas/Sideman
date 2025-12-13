/**
 * Audio reliability enhancements
 * Confidence gating, noise detection, silence handling, peak stability
 */

import { calculateRMS } from "./decode";
import { DetectedPitch } from "./pitch";

export interface ReliabilityConfig {
  minConfidenceThreshold: number; // Minimum confidence to accept detection
  silenceThreshold: number; // RMS below this is considered silence
  noiseFloor: number; // dB level below which is noise
  minStablePeaks: number; // Minimum number of stable frequency peaks
  frequencyStabilityWindow: number; // Time window for frequency stability check (ms)
}

export const DEFAULT_RELIABILITY_CONFIG: ReliabilityConfig = {
  minConfidenceThreshold: 0.5,
  silenceThreshold: 0.01,
  noiseFloor: -60, // dB
  minStablePeaks: 2,
  frequencyStabilityWindow: 100,
};

export interface ReliabilityResult {
  isReliable: boolean;
  issues: string[];
  adjustedConfidence: number;
  signalQuality: "good" | "fair" | "poor";
  recommendations: string[];
}

/**
 * Calculate signal-to-noise ratio approximation
 */
export function estimateSNR(samples: Float32Array): number {
  // Simple SNR estimation: compare RMS of signal vs estimated noise floor
  const rms = calculateRMS(samples);

  // Estimate noise floor from quietest 10% of samples
  const sortedAbs = Array.from(samples)
    .map(Math.abs)
    .sort((a, b) => a - b);
  const noiseFloorSamples = sortedAbs.slice(0, Math.floor(sortedAbs.length * 0.1));
  const noiseRMS = Math.sqrt(
    noiseFloorSamples.reduce((sum, s) => sum + s * s, 0) / noiseFloorSamples.length
  );

  if (noiseRMS === 0) return 60; // Very clean signal

  // SNR in dB
  return 20 * Math.log10(rms / noiseRMS);
}

/**
 * Convert RMS to decibels
 */
export function rmsToDb(rms: number): number {
  if (rms === 0) return -100;
  return 20 * Math.log10(rms);
}

/**
 * Check if the signal contains significant noise
 */
export function hasSignificantNoise(
  samples: Float32Array,
  noiseFloorDb: number = -60
): boolean {
  const snr = estimateSNR(samples);
  return snr < 20; // Less than 20dB SNR is considered noisy
}

/**
 * Check if detected pitches are stable (consistent frequencies)
 */
export function checkPitchStability(pitches: DetectedPitch[]): {
  isStable: boolean;
  stabilityScore: number;
} {
  if (pitches.length < 2) {
    return { isStable: true, stabilityScore: 1 };
  }

  // Check if magnitudes are consistent (not wildly varying)
  const magnitudes = pitches.map((p) => p.magnitude);
  const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const magVariance = magnitudes.reduce((sum, m) => sum + Math.pow(m - avgMag, 2), 0) / magnitudes.length;
  const magStdDev = Math.sqrt(magVariance);

  // Coefficient of variation
  const cv = magStdDev / avgMag;

  // Stability is good if CV is low
  const stabilityScore = Math.max(0, 1 - cv);

  return {
    isStable: stabilityScore > 0.5,
    stabilityScore,
  };
}

/**
 * Apply confidence gating and reliability checks
 */
export function evaluateReliability(
  samples: Float32Array,
  pitches: DetectedPitch[],
  baseConfidence: number,
  config: ReliabilityConfig = DEFAULT_RELIABILITY_CONFIG
): ReliabilityResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let adjustedConfidence = baseConfidence;

  // Check for silence
  const rms = calculateRMS(samples);
  const dbLevel = rmsToDb(rms);

  if (rms < config.silenceThreshold) {
    issues.push("Audio level too low (silence detected)");
    recommendations.push("Play the chord louder or move closer to the microphone");
    adjustedConfidence *= 0.2;
  }

  // Check for noise
  const snr = estimateSNR(samples);
  if (snr < 15) {
    issues.push("High background noise detected");
    recommendations.push("Try recording in a quieter environment");
    adjustedConfidence *= 0.7;
  } else if (snr < 25) {
    issues.push("Moderate background noise");
    adjustedConfidence *= 0.85;
  }

  // Check pitch count
  if (pitches.length < config.minStablePeaks) {
    issues.push(`Only ${pitches.length} note(s) detected`);
    recommendations.push("Make sure to play all chord tones clearly");
    adjustedConfidence *= 0.6;
  }

  // Check pitch stability
  const stability = checkPitchStability(pitches);
  if (!stability.isStable) {
    issues.push("Pitch detection was unstable");
    recommendations.push("Try holding the chord more steadily");
    adjustedConfidence *= stability.stabilityScore;
  }

  // Check average magnitude
  if (pitches.length > 0) {
    const avgMagnitude = pitches.reduce((sum, p) => sum + p.magnitude, 0) / pitches.length;
    if (avgMagnitude < 0.3) {
      issues.push("Weak signal from detected notes");
      recommendations.push("Play the chord with more force");
      adjustedConfidence *= 0.8;
    }
  }

  // Determine signal quality
  let signalQuality: "good" | "fair" | "poor" = "good";
  if (issues.length > 2 || adjustedConfidence < 0.4) {
    signalQuality = "poor";
  } else if (issues.length > 0 || adjustedConfidence < 0.7) {
    signalQuality = "fair";
  }

  // Apply minimum threshold
  const isReliable =
    adjustedConfidence >= config.minConfidenceThreshold &&
    signalQuality !== "poor";

  return {
    isReliable,
    issues,
    adjustedConfidence: Math.max(0, Math.min(1, adjustedConfidence)),
    signalQuality,
    recommendations: issues.length > 0 ? recommendations : [],
  };
}

/**
 * Get feedback message based on reliability result
 */
export function getReliabilityFeedback(result: ReliabilityResult): string {
  if (result.signalQuality === "good") {
    return "Audio quality is excellent.";
  }

  if (result.signalQuality === "fair") {
    return `Audio quality is fair. ${result.recommendations[0] || ""}`;
  }

  return `Audio quality is poor: ${result.issues.join(", ")}. ${result.recommendations[0] || ""}`;
}
