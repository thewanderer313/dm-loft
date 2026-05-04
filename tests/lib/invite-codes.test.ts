import { describe, it, expect } from "vitest";
import { generateInviteCode, slugify } from "@/lib/invite-codes";

describe("slugify", () => {
  it("lowercases", () => expect(slugify("Oakhart")).toBe("oakhart"));
  it("replaces non-alphanum with hyphens and collapses runs", () => {
    expect(slugify("The Salt Road!")).toBe("the-salt-road");
  });
  it("strips ambiguous characters and re-collapses", () => {
    expect(slugify("ALL Ohms 1010")).toBe("a-hms"); // 'l','o','1','0' all stripped
  });
  it("trims leading/trailing hyphens", () => {
    expect(slugify("-- hi --")).toBe("hi");
  });
  it("truncates long names to 12 chars", () => {
    expect(slugify("Beneath the Brassgate of Oakhart")).toHaveLength(12);
  });
  it("falls back to 'chronicle' on empty input", () => {
    expect(slugify("   ")).toBe("chronicle");
    expect(slugify("01l0")).toBe("chronicle"); // every char stripped
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
