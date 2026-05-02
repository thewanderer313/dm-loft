import { describe, it, expect } from "vitest";
import { injectPatch, NAMESPACE_PATCH_MARKER } from "@/scripts/port-tool";

describe("port-tool injectPatch", () => {
  const sample = `<!doctype html><html><head><title>x</title></head><body></body></html>`;

  it("inserts the patch right after <head>", () => {
    const out = injectPatch(sample);
    expect(out).toContain(NAMESPACE_PATCH_MARKER);
    const headIdx = out.indexOf("<head>");
    const patchIdx = out.indexOf(NAMESPACE_PATCH_MARKER);
    expect(patchIdx).toBeGreaterThan(headIdx);
    expect(patchIdx).toBeLessThan(out.indexOf("<title>"));
  });

  it("is idempotent (does not double-inject)", () => {
    const once = injectPatch(sample);
    const twice = injectPatch(once);
    const occurrences = twice.split(NAMESPACE_PATCH_MARKER).length - 1;
    expect(occurrences).toBe(1);
  });
});
