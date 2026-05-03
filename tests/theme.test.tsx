import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

describe("tome theme", () => {
  it("applies tome-page class without error", () => {
    const { container } = render(<div className="tome-page" />);
    expect(container.firstChild).toHaveClass("tome-page");
  });

  it("applies bg-tome-paper utility class", () => {
    const { container } = render(<div className="bg-tome-paper text-tome-ink" />);
    expect(container.firstChild).toHaveClass("bg-tome-paper");
    expect(container.firstChild).toHaveClass("text-tome-ink");
  });
});
