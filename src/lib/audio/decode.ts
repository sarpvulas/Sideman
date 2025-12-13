/**
 * Audio decoding utilities
 * Converts audio blobs to PCM samples for analysis
 */

export interface AudioData {
  samples: Float32Array;
  sampleRate: number;
  duration: number;
}

/**
 * Decode an audio blob to PCM samples
 */
export async function decodeAudioBlob(blob: Blob): Promise<AudioData> {
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
 * Extract a segment of audio for analysis
 * Useful for analyzing the most stable part of a chord
 */
export function extractSegment(
  data: AudioData,
  startTime: number,
  endTime: number
): AudioData {
  const startSample = Math.floor(startTime * data.sampleRate);
  const endSample = Math.floor(endTime * data.sampleRate);

  const segmentSamples = data.samples.slice(startSample, endSample);

  return {
    samples: segmentSamples,
    sampleRate: data.sampleRate,
    duration: endTime - startTime,
  };
}

/**
 * Apply a Hann window to reduce spectral leakage
 */
export function applyHannWindow(samples: Float32Array): Float32Array {
  const windowed = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
    windowed[i] = samples[i] * window;
  }
  return windowed;
}

/**
 * Calculate RMS (root mean square) energy
 * Useful for detecting silence/noise
 */
export function calculateRMS(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Detect if audio contains silence
 */
export function isSilent(samples: Float32Array, threshold = 0.01): boolean {
  return calculateRMS(samples) < threshold;
}
