#!/usr/bin/env node
import { injectPatch } from "./port-tool.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const TOOLS = [
  { id: "initiative",  src: "../DND-DMTools/DND-DM_Tools/DND Combat Tracker -final.html" },
  { id: "time-moon",   src: "../DND-Time_Tracker/DND-Time-and-Combat-tracker/oakhart_timer_singlefile_responsive_v2.html" },
  { id: "reputation",  src: "../DND-Oakhart_Reputation_Tracker/Oakhart Reputation Tracker.html" },
  { id: "battle-map",  src: "../DND-DMTools/DND-DM_Tools/oakhart-battlemap.html" },
  { id: "roll-tables", src: "../DND-DMTools/DND-DM_Tools/oakhart-rolltables.html",
    extras: { fromDir: "../DND-DMTools/DND-DM_Tools/data", toDir: "public/tools/roll-tables/data" } },
  { id: "rules",       src: "../DND-DMTools/DND-DM_Tools/oakhart-rules-reference.html" },
];

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const fp = path.join(from, entry.name);
    const tp = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(fp, tp);
    else await fs.copyFile(fp, tp);
  }
}

for (const t of TOOLS) {
  const html = await fs.readFile(t.src, "utf8");
  const patched = injectPatch(html);
  const dest = path.join("public", "tools", t.id, "index.html");
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, patched, "utf8");
  console.log(`ported: ${t.id}`);
  if (t.extras) {
    await copyDir(t.extras.fromDir, t.extras.toDir);
    console.log(`  + extras: ${t.extras.fromDir} → ${t.extras.toDir}`);
  }
}
