import { describe, it, expect } from "vitest";
import { generateInviteCode, slugify } from "@/lib/invite-codes";

describe("slugify", () => {
  it("lowercases", () => {
    expect(slugify("Oakhart")).toBe("oakhart");
  });

  it("replaces non-alphanum with hyphens and collapses runs", () => {
    expect(slugify("The---Salt!")).toBe("the-salt");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("-- hi --")).toBe("hi");
  });

  it("truncates long names and strips a trailing hyphen left by truncation", () => {
    // raw → "beneath-the-brassgate-of-oakhart"; first 12 chars → "beneath-the-"
    // trailing hyphen then stripped → "beneath-the"
    expect(slugify("Beneath the Brassgate of Oakhart")).toBe("beneath-the");
  });

  it("preserves ambiguous letters in the slug for human recognition", () => {
    // The random-suffix alphabet drops l/1/o/0 for typeability, but the
    // slug should still read as the campaign's name.
    expect(slugify("Oakhart")).toBe("oakhart");
    expect(slugify("Lola 1010")).toBe("lola-1010");
  });

  it("falls back to 'chronicle' on input that has no alphanumerics", () => {
    expect(slugify("   ")).toBe("chronicle");
    expect(slugify("---")).toBe("chronicle");
    expect(slugify("!!!")).toBe("chronicle");
  });
});

describe("generateInviteCode", () => {
  it("returns slug-random shape", () => {
    const code = generateInviteCode("Oakhart");
    expect(code).toMatch(/^oakhart-[a-z2-9]{4}$/);
  });

  it("uses ambiguous-free random suffix (no l, 1, o, 0)", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode("Oakhart");
      const suffix = code.slice(code.lastIndexOf("-") + 1);
      expect(suffix).toMatch(/^[a-z2-9]{4}$/);
      expect(suffix).not.toMatch(/[l1o0]/);
    }
  });

  it("returns different codes on successive calls (not a constant)", () => {
    const a = generateInviteCode("Oakhart");
    const b = generateInviteCode("Oakhart");
    expect(a).not.toBe(b);
  });
});
