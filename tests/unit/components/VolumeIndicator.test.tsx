import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VolumeIndicator } from "@/components/audio/VolumeIndicator";

describe("VolumeIndicator", () => {
  it("renders volume bar container", () => {
    const { container } = render(<VolumeIndicator analyser={null} />);
    const volumeBar = container.querySelector(".bg-primary-700");
    expect(volumeBar).toBeInTheDocument();
  });

  it("renders level indicator dots", () => {
    const { container } = render(<VolumeIndicator analyser={null} />);
    // Should have 5 level indicator dots (w-1.5 class)
    const dots = container.querySelectorAll('[class*="w-1"]');
    expect(dots.length).toBeGreaterThanOrEqual(5);
  });

  it("shows dB readout when showDb is true", () => {
    render(<VolumeIndicator analyser={null} showDb />);
    expect(screen.getByText(/dB/)).toBeInTheDocument();
  });

  it("does not show dB readout when showDb is false", () => {
    render(<VolumeIndicator analyser={null} showDb={false} />);
    expect(screen.queryByText(/dB/)).not.toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<VolumeIndicator analyser={null} className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("renders with flex layout", () => {
    const { container } = render(<VolumeIndicator analyser={null} />);
    const flexContainer = container.querySelector(".flex");
    expect(flexContainer).toBeInTheDocument();
  });
});
