import { describe, it, expect } from "vitest";

// Re-implement the safeNext logic for testing.
// (The function is private to the route handler; we test the algorithm.)
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.includes("://") || raw.startsWith("//")) return "/";
  return raw;
}

describe("safeNext (auth callback)", () => {
  it("allows a normal relative path", () => {
    expect(safeNext("/c/abc/t/initiative")).toBe("/c/abc/t/initiative");
  });

  it("returns '/' when input is null", () => {
    expect(safeNext(null)).toBe("/");
  });

  it("rejects absolute URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("http://evil.com/path")).toBe("/");
  });

  it("rejects scheme-relative URLs", () => {
    expect(safeNext("//evil.com/path")).toBe("/");
  });

  it("rejects values that don't start with /", () => {
    expect(safeNext("evil")).toBe("/");
  });

  it("rejects sneaky absolute URLs that start with /", () => {
    // "/https://evil.com" technically starts with /, but contains ://
    expect(safeNext("/https://evil.com")).toBe("/");
  });
});
