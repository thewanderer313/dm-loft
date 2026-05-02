import { describe, it, expect } from "vitest";
import { TOOLS, getTool } from "@/lib/tools";

describe("tool registry", () => {
  it("contains the six MVP tools", () => {
    const ids = TOOLS.map(t => t.id).sort();
    expect(ids).toEqual([
      "battle-map",
      "initiative",
      "reputation",
      "roll-tables",
      "rules",
      "time-moon",
    ]);
  });

  it("getTool returns null for unknown ids", () => {
    expect(getTool("nonexistent")).toBeNull();
  });

  it("getTool returns the tool for known ids", () => {
    expect(getTool("initiative")?.name).toBe("Initiative Tracker");
  });
});
