#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

export const NAMESPACE_PATCH_MARKER = "/* dm-loft:localStorage-namespace */";

const PATCH = `
<script>${NAMESPACE_PATCH_MARKER}
(function () {
  var p = new URLSearchParams(window.location.search);
  var c = p.get('campaign');
  if (!c) return;
  var ns = 'dmloft:' + c + ':';
  var ls = window.localStorage;
  var origGet = ls.getItem.bind(ls),
      origSet = ls.setItem.bind(ls),
      origRemove = ls.removeItem.bind(ls);
  ls.getItem    = function (k) { return origGet(ns + k); };
  ls.setItem    = function (k, v) { return origSet(ns + k, v); };
  ls.removeItem = function (k) { return origRemove(ns + k); };
})();
</script>
`;

export function injectPatch(html) {
  if (html.includes(NAMESPACE_PATCH_MARKER)) return html; // idempotent
  const m = html.match(/<head[^>]*>/i);
  if (!m) throw new Error("No <head> tag found");
  const idx = m.index + m[0].length;
  return html.slice(0, idx) + PATCH + html.slice(idx);
}

async function main() {
  const [, , src, dest] = process.argv;
  if (!src || !dest) {
    console.error("usage: port-tool.mjs <source.html> <dest.html>");
    process.exit(1);
  }
  const html = await fs.readFile(src, "utf8");
  const patched = injectPatch(html);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, patched, "utf8");
  console.log(`ported: ${src} → ${dest}`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  main();
}
