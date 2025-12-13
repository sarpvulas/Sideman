import { describe, it, expect } from "vitest";
import {
  fft,
  computeMagnitudeSpectrum,
  binToFrequency,
  frequencyToBin,
  findPeaks,
  padToPowerOf2,
} from "@/lib/audio/fft";

describe("FFT", () => {
  describe("fft", () => {
    it("handles single element array", () => {
      const real = new Float32Array([1]);
      const imag = new Float32Array([0]);
      const result = fft(real, imag);
      expect(result.real[0]).toBe(1);
      expect(result.imag[0]).toBe(0);
    });

    it("computes FFT of simple signal", () => {
      // DC signal should have all energy at bin 0
      const real = new Float32Array([1, 1, 1, 1]);
      const imag = new Float32Array([0, 0, 0, 0]);
      const result = fft(real, imag);

      // DC component should be sum of all values
      expect(result.real[0]).toBeCloseTo(4, 5);
    });

    it("detects pure sine wave frequency", () => {
      const n = 64;
      const sampleRate = 1000;
      const frequency = 125; // Should appear at bin 8 (125 * 64 / 1000)

      const real = new Float32Array(n);
      const imag = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        real[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
      }

      const result = fft(real, imag);
      const magnitude = computeMagnitudeSpectrum(result.real, result.imag);

      // Find peak bin
      let maxBin = 0;
      let maxMag = 0;
      for (let i = 1; i < magnitude.length; i++) {
        if (magnitude[i] > maxMag) {
          maxMag = magnitude[i];
          maxBin = i;
        }
      }

      expect(maxBin).toBe(8);
    });
  });

  describe("computeMagnitudeSpectrum", () => {
    it("computes magnitude correctly", () => {
      const real = new Float32Array([3, 0, 0, 0]);
      const imag = new Float32Array([4, 0, 0, 0]);
      const magnitude = computeMagnitudeSpectrum(real, imag);

      expect(magnitude[0]).toBeCloseTo(5, 5); // sqrt(3^2 + 4^2) = 5
    });

    it("returns half the FFT length", () => {
      const real = new Float32Array(64);
      const imag = new Float32Array(64);
      const magnitude = computeMagnitudeSpectrum(real, imag);

      expect(magnitude.length).toBe(32);
    });
  });

  describe("binToFrequency", () => {
    it("converts bin 0 to 0 Hz", () => {
      expect(binToFrequency(0, 1024, 44100)).toBe(0);
    });

    it("converts bin correctly", () => {
      // Bin 10 with FFT size 1024 at 44100 Hz
      const freq = binToFrequency(10, 1024, 44100);
      expect(freq).toBeCloseTo(430.66, 1);
    });

    it("handles Nyquist frequency", () => {
      const nyquist = binToFrequency(512, 1024, 44100);
      expect(nyquist).toBeCloseTo(22050, 1);
    });
  });

  describe("frequencyToBin", () => {
    it("converts 0 Hz to bin 0", () => {
      expect(frequencyToBin(0, 1024, 44100)).toBe(0);
    });

    it("converts frequency correctly", () => {
      // 440 Hz with FFT size 1024 at 44100 Hz
      const bin = frequencyToBin(440, 1024, 44100);
      expect(bin).toBe(10);
    });

    it("is inverse of binToFrequency", () => {
      const originalBin = 15;
      const freq = binToFrequency(originalBin, 1024, 44100);
      const recoveredBin = frequencyToBin(freq, 1024, 44100);
      expect(recoveredBin).toBe(originalBin);
    });
  });

  describe("findPeaks", () => {
    it("finds no peaks in flat array", () => {
      const magnitude = new Float32Array([1, 1, 1, 1, 1]);
      const peaks = findPeaks(magnitude, 0.5);
      expect(peaks.length).toBe(0);
    });

    it("finds single peak", () => {
      const magnitude = new Float32Array([0, 1, 5, 1, 0]);
      const peaks = findPeaks(magnitude, 0.1);
      expect(peaks).toContain(2);
    });

    it("finds multiple peaks", () => {
      const magnitude = new Float32Array([0, 5, 1, 1, 8, 1, 0, 3, 0]);
      const peaks = findPeaks(magnitude, 0.1, 1);
      expect(peaks).toContain(1);
      expect(peaks).toContain(4);
      expect(peaks).toContain(7);
    });

    it("respects threshold", () => {
      const magnitude = new Float32Array([0, 1, 0, 10, 0]);
      const peaks = findPeaks(magnitude, 0.5);
      // Only bin 3 should be above 50% threshold
      expect(peaks).toContain(3);
      expect(peaks).not.toContain(1);
    });

    it("respects minimum distance", () => {
      const magnitude = new Float32Array([0, 5, 6, 5, 0, 0, 8, 0]);
      const peaks = findPeaks(magnitude, 0.1, 3);
      // Should keep stronger peak when too close
      expect(peaks.length).toBeLessThanOrEqual(2);
    });
  });

  describe("padToPowerOf2", () => {
    it("does not pad power of 2 array", () => {
      const samples = new Float32Array(64);
      const padded = padToPowerOf2(samples);
      expect(padded.length).toBe(64);
    });

    it("pads to next power of 2", () => {
      const samples = new Float32Array(100);
      const padded = padToPowerOf2(samples);
      expect(padded.length).toBe(128);
    });

    it("preserves original values", () => {
      const samples = new Float32Array([1, 2, 3]);
      const padded = padToPowerOf2(samples);
      expect(padded[0]).toBe(1);
      expect(padded[1]).toBe(2);
      expect(padded[2]).toBe(3);
    });

    it("pads with zeros", () => {
      const samples = new Float32Array([1, 2, 3]);
      const padded = padToPowerOf2(samples);
      expect(padded[3]).toBe(0);
    });
  });
});
