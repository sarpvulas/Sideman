import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Waveform } from "@/components/audio/Waveform";

describe("Waveform", () => {
  it("renders canvas element", () => {
    const { container } = render(<Waveform analyser={null} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders with correct canvas dimensions", () => {
    const { container } = render(<Waveform analyser={null} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("width", "256");
    expect(canvas).toHaveAttribute("height", "64");
  });

  it("shows inactive state when not active", () => {
    const { container } = render(<Waveform analyser={null} isActive={false} />);
    // Should show placeholder bars when inactive
    const placeholderBars = container.querySelectorAll(".bg-primary-600");
    expect(placeholderBars.length).toBe(5);
  });

  it("accepts custom className", () => {
    const { container } = render(<Waveform analyser={null} className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("renders canvas with aria-hidden", () => {
    const { container } = render(<Waveform analyser={null} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
  });
});
