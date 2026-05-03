import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Shell } from "@/components/Shell";

describe("Shell", () => {
  it("renders the DM Loft brand and children", () => {
    render(<Shell><p>hello</p></Shell>);
    // Brand text is split across nodes (DM + <em>Loft</em>) — match by accessible link name.
    expect(screen.getByRole("link", { name: /DM\s+Loft/ })).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
