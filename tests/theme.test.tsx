import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

describe("lantern theme", () => {
  it("applies bg-lantern-bg class without error", () => {
    const { container } = render(<div className="bg-lantern-bg" />);
    expect(container.firstChild).toHaveClass("bg-lantern-bg");
  });
});
