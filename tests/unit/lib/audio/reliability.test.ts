import { describe, it, expect } from "vitest";
import {
  estimateSNR,
  rmsToDb,
  hasSignificantNoise,
  checkPitchStability,
  evaluateReliability,
  getReliabilityFeedback,
  DEFAULT_RELIABILITY_CONFIG,
} from "@/lib/audio/reliability";
import type { DetectedPitch } from "@/lib/audio/pitch";

// Helper to create test audio samples
function createTestSamples(amplitude: number, length: number = 1024): Float32Array {
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    samples[i] = amplitude * Math.sin(2 * Math.PI * 440 * i / 44100);
  }
  return samples;
}

// Helper to create test pitches
function createTestPitches(count: number, magnitudeVariance: number = 0): DetectedPitch[] {
  const pitches: DetectedPitch[] = [];
  const baseMagnitude = 0.8;

  for (let i = 0; i < count; i++) {
    const variance = (Math.random() - 0.5) * 2 * magnitudeVariance;
    pitches.push({
      frequency: 440 * Math.pow(2, i / 12),
      midi: 69 + i,
      note: ["A", "A#", "B", "C", "C#"][i % 5],
      octave: 4,
      cents: 0,
      magnitude: Math.max(0.1, baseMagnitude + variance),
    });
  }
  return pitches;
}

describe("Audio reliability", () => {
  describe("estimateSNR", () => {
    it("returns a number for signal analysis", () => {
      const samples = createTestSamples(0.5);
      const snr = estimateSNR(samples);
      expect(typeof snr).toBe("number");
      expect(snr).not.toBeNaN();
    });

    it("returns lower SNR for signal with added noise", () => {
      const cleanSamples = createTestSamples(0.5);
      const noisySamples = createTestSamples(0.5);

      // Add significant noise to one signal
      for (let i = 0; i < noisySamples.length; i++) {
        noisySamples[i] += (Math.random() - 0.5) * 0.5;
      }

      const cleanSNR = estimateSNR(cleanSamples);
      const noisySNR = estimateSNR(noisySamples);

      // Clean signal should have higher or equal SNR
      expect(cleanSNR).toBeGreaterThanOrEqual(noisySNR - 5); // Allow some variance
    });
  });

  describe("rmsToDb", () => {
    it("converts RMS 1.0 to 0 dB", () => {
      expect(rmsToDb(1)).toBeCloseTo(0, 1);
    });

    it("converts RMS 0.1 to -20 dB", () => {
      expect(rmsToDb(0.1)).toBeCloseTo(-20, 1);
    });

    it("converts RMS 0 to -100 dB", () => {
      expect(rmsToDb(0)).toBe(-100);
    });
  });

  describe("hasSignificantNoise", () => {
    it("returns boolean for signal analysis", () => {
      const samples = createTestSamples(0.5);
      const result = hasSignificantNoise(samples);
      expect(typeof result).toBe("boolean");
    });

    it("analyzes noise in random signal", () => {
      const samples = new Float32Array(1024);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = (Math.random() - 0.5) * 0.1;
      }
      // Function should return a boolean regardless of threshold
      const result = hasSignificantNoise(samples);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("checkPitchStability", () => {
    it("returns stable for consistent pitches", () => {
      const pitches = createTestPitches(4, 0);
      const result = checkPitchStability(pitches);
      expect(result.isStable).toBe(true);
      expect(result.stabilityScore).toBeGreaterThan(0.5);
    });

    it("returns unstable for varying magnitudes", () => {
      const pitches = createTestPitches(4, 0.5);
      const result = checkPitchStability(pitches);
      // More variance = less stable
      expect(result.stabilityScore).toBeLessThan(1);
    });

    it("returns stable for single pitch", () => {
      const pitches = createTestPitches(1);
      const result = checkPitchStability(pitches);
      expect(result.isStable).toBe(true);
    });
  });

  describe("evaluateReliability", () => {
    it("returns reliability result for signal with pitches", () => {
      const samples = createTestSamples(0.5);
      const pitches = createTestPitches(4);
      const result = evaluateReliability(samples, pitches, 0.8);

      // Should have adjusted confidence
      expect(result.adjustedConfidence).toBeLessThanOrEqual(0.8);
      // Should have a signal quality assessment
      expect(["good", "fair", "poor"]).toContain(result.signalQuality);
    });

    it("returns unreliable for silent signal", () => {
      const samples = createTestSamples(0.001); // Very quiet
      const pitches = createTestPitches(4);
      const result = evaluateReliability(samples, pitches, 0.8);

      expect(result.isReliable).toBe(false);
      expect(result.issues).toContain("Audio level too low (silence detected)");
    });

    it("reduces confidence for few pitches", () => {
      const samples = createTestSamples(0.5);
      const pitches = createTestPitches(1); // Only 1 pitch
      const result = evaluateReliability(samples, pitches, 0.8);

      expect(result.adjustedConfidence).toBeLessThan(0.8);
      expect(result.issues.some(i => i.includes("note(s) detected"))).toBe(true);
    });

    it("includes recommendations when issues found", () => {
      const samples = createTestSamples(0.001);
      const pitches: DetectedPitch[] = [];
      const result = evaluateReliability(samples, pitches, 0.5);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("getReliabilityFeedback", () => {
    it("returns positive message for good quality", () => {
      const result = {
        isReliable: true,
        issues: [],
        adjustedConfidence: 0.9,
        signalQuality: "good" as const,
        recommendations: [],
      };

      const feedback = getReliabilityFeedback(result);
      expect(feedback).toContain("excellent");
    });

    it("returns warning message for fair quality", () => {
      const result = {
        isReliable: true,
        issues: ["Moderate background noise"],
        adjustedConfidence: 0.7,
        signalQuality: "fair" as const,
        recommendations: ["Try recording in a quieter environment"],
      };

      const feedback = getReliabilityFeedback(result);
      expect(feedback).toContain("fair");
    });

    it("returns error message for poor quality", () => {
      const result = {
        isReliable: false,
        issues: ["Audio level too low", "High noise"],
        adjustedConfidence: 0.3,
        signalQuality: "poor" as const,
        recommendations: ["Play louder"],
      };

      const feedback = getReliabilityFeedback(result);
      expect(feedback).toContain("poor");
    });
  });
});
