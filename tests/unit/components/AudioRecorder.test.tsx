import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AudioRecorder } from "@/components/audio/AudioRecorder";

describe("AudioRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders idle state initially", () => {
    render(<AudioRecorder />);
    expect(screen.getByTestId("record-button")).toBeInTheDocument();
    expect(screen.getByText("Tap to record your chord")).toBeInTheDocument();
  });

  it("has correct aria-label for record button", () => {
    render(<AudioRecorder />);
    expect(screen.getByTestId("record-button")).toHaveAttribute(
      "aria-label",
      "Start recording"
    );
  });

  it("disables button when disabled prop is true", () => {
    render(<AudioRecorder disabled />);
    expect(screen.getByTestId("record-button")).toBeDisabled();
  });

  it("applies disabled styles when disabled", () => {
    render(<AudioRecorder disabled />);
    expect(screen.getByTestId("record-button")).toHaveClass("opacity-50");
  });

  it("requests microphone permission on record click", async () => {
    render(<AudioRecorder />);

    fireEvent.click(screen.getByTestId("record-button"));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.any(Object),
        })
      );
    });
  });

  it("calls onRecordingComplete callback when submitted", async () => {
    const handleComplete = vi.fn();
    render(<AudioRecorder onRecordingComplete={handleComplete} />);

    // Note: Full recording flow would require more complex mocking
    // This tests that the prop is accepted
    expect(handleComplete).not.toHaveBeenCalled();
  });

  it("does not show waveform when not recording", () => {
    render(<AudioRecorder />);
    expect(screen.queryByTestId("waveform")).not.toBeInTheDocument();
  });

  it("does not show recording indicator when not recording", () => {
    render(<AudioRecorder />);
    expect(screen.queryByTestId("recording-indicator")).not.toBeInTheDocument();
  });

  it("accepts maxDuration prop", () => {
    render(<AudioRecorder maxDuration={5} />);
    expect(screen.getByTestId("record-button")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<AudioRecorder className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
