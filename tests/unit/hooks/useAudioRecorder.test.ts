import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

describe("useAudioRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns idle state initially", () => {
    const { result } = renderHook(() => useAudioRecorder());

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.audioBlob).toBeNull();
  });

  it("has startRecording function", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(typeof result.current.startRecording).toBe("function");
  });

  it("has stopRecording function", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(typeof result.current.stopRecording).toBe("function");
  });

  it("has reset function", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(typeof result.current.reset).toBe("function");
  });

  it("requests microphone permission on start", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    act(() => {
      result.current.startRecording();
    });

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ audio: expect.any(Object) })
      );
    });
  });

  it("resets state correctly", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    // Start recording
    act(() => {
      result.current.startRecording();
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.audioBlob).toBeNull();
  });
});
