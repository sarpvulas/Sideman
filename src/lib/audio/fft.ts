/**
 * FFT (Fast Fourier Transform) implementation
 * For pitch detection and frequency analysis
 */

/**
 * Compute FFT using Cooley-Tukey algorithm
 * Input length must be a power of 2
 */
export function fft(
  real: Float32Array,
  imag: Float32Array
): { real: Float32Array; imag: Float32Array } {
  const n = real.length;

  if (n === 1) {
    return { real, imag };
  }

  // Bit-reversal permutation
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    const reversed = reverseBits(i, bits);
    if (i < reversed) {
      [real[i], real[reversed]] = [real[reversed], real[i]];
      [imag[i], imag[reversed]] = [imag[reversed], imag[i]];
    }
  }

  // Cooley-Tukey iterative FFT
  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angleStep = (-2 * Math.PI) / size;

    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const angle = angleStep * j;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const tReal = cos * real[oddIdx] - sin * imag[oddIdx];
        const tImag = sin * real[oddIdx] + cos * imag[oddIdx];

        real[oddIdx] = real[evenIdx] - tReal;
        imag[oddIdx] = imag[evenIdx] - tImag;
        real[evenIdx] = real[evenIdx] + tReal;
        imag[evenIdx] = imag[evenIdx] + tImag;
      }
    }
  }

  return { real, imag };
}

function reverseBits(x: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (x & 1);
    x >>= 1;
  }
  return result;
}

/**
 * Compute magnitude spectrum from FFT result
 */
export function computeMagnitudeSpectrum(
  real: Float32Array,
  imag: Float32Array
): Float32Array {
  const n = real.length / 2; // Only need positive frequencies
  const magnitude = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }

  return magnitude;
}

/**
 * Convert FFT bin index to frequency
 */
export function binToFrequency(bin: number, fftSize: number, sampleRate: number): number {
  return (bin * sampleRate) / fftSize;
}

/**
 * Convert frequency to FFT bin index
 */
export function frequencyToBin(frequency: number, fftSize: number, sampleRate: number): number {
  return Math.round((frequency * fftSize) / sampleRate);
}

/**
 * Find peaks in the magnitude spectrum
 */
export function findPeaks(
  magnitude: Float32Array,
  threshold: number,
  minDistance: number = 1
): number[] {
  const peaks: number[] = [];
  // Find max without spreading (Float32Array spread requires downlevelIteration)
  let maxMagnitude = 0;
  for (let i = 0; i < magnitude.length; i++) {
    if (magnitude[i] > maxMagnitude) maxMagnitude = magnitude[i];
  }
  const absoluteThreshold = threshold * maxMagnitude;

  for (let i = 1; i < magnitude.length - 1; i++) {
    // Check if this is a local maximum
    if (
      magnitude[i] > magnitude[i - 1] &&
      magnitude[i] > magnitude[i + 1] &&
      magnitude[i] > absoluteThreshold
    ) {
      // Check minimum distance from previous peak
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i);
      } else if (magnitude[i] > magnitude[peaks[peaks.length - 1]]) {
        // Replace previous peak if this one is stronger
        peaks[peaks.length - 1] = i;
      }
    }
  }

  return peaks;
}

/**
 * Pad array to next power of 2
 */
export function padToPowerOf2(samples: Float32Array): Float32Array {
  const n = samples.length;
  const nextPower = Math.pow(2, Math.ceil(Math.log2(n)));

  if (nextPower === n) {
    return samples;
  }

  const padded = new Float32Array(nextPower);
  padded.set(samples);
  return padded;
}
