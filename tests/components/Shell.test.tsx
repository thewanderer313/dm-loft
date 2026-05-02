import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Shell } from "@/components/Shell";

describe("Shell", () => {
  it("renders the DM Loft brand and children", () => {
    render(<Shell><p>hello</p></Shell>);
    expect(screen.getByText("DM Loft")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
