import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

describe("safeRedirectPath", () => {
  describe("valid paths pass through", () => {
    it("accepts root", () => expect(safeRedirectPath("/")).toBe("/"));
    it("accepts a single segment", () => expect(safeRedirectPath("/campaigns")).toBe("/campaigns"));
    it("accepts deep paths", () =>
      expect(safeRedirectPath("/c/abc-123/t/initiative")).toBe("/c/abc-123/t/initiative"));
    it("accepts query strings", () =>
      expect(safeRedirectPath("/campaigns?error=foo")).toBe("/campaigns?error=foo"));
    it("accepts encoded slashes in path (treated as literal by browsers)", () =>
      expect(safeRedirectPath("/path%2Fwith%2Fencoded")).toBe("/path%2Fwith%2Fencoded"));
  });

  describe("falls back to '/' for invalid input", () => {
    it("for null", () => expect(safeRedirectPath(null)).toBe("/"));
    it("for undefined", () => expect(safeRedirectPath(undefined)).toBe("/"));
    it("for empty string", () => expect(safeRedirectPath("")).toBe("/"));
    it("for a non-string", () => expect(safeRedirectPath(42)).toBe("/"));
    it("for a path that doesn't start with /", () =>
      expect(safeRedirectPath("campaigns")).toBe("/"));
    it("for a fully-qualified URL", () =>
      expect(safeRedirectPath("https://evil.com/path")).toBe("/"));
  });

  describe("rejects open-redirect bypass patterns", () => {
    it("rejects protocol-relative //evil.com", () =>
      expect(safeRedirectPath("//evil.com")).toBe("/"));
    it("rejects /\\\\evil.com (backslash authority)", () =>
      expect(safeRedirectPath("/\\evil.com/path")).toBe("/"));
    it("rejects backslash anywhere in the path", () =>
      expect(safeRedirectPath("/something\\else")).toBe("/"));
    it("rejects embedded ://", () =>
      expect(safeRedirectPath("/redirect?to=https://evil.com")).toBe("/"));
    it("rejects a tab character (control char)", () =>
      expect(safeRedirectPath("/\t//evil.com")).toBe("/"));
    it("rejects a CR character", () =>
      expect(safeRedirectPath("/\rfoo")).toBe("/"));
    it("rejects a LF character", () =>
      expect(safeRedirectPath("/\nfoo")).toBe("/"));
    it("rejects a NUL character", () =>
      expect(safeRedirectPath("/\x00foo")).toBe("/"));
  });
});
