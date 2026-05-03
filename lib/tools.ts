import type { SigilKind } from "@/components/Sigil";

export type Tool = {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  sigil: SigilKind;
};

export const TOOLS: Tool[] = [
  { id: "initiative",  name: "Initiative Tracker", blurb: "Combat & HP",            icon: "⚔️", sigil: "sword" },
  { id: "time-moon",   name: "Time & Moon",        blurb: "Calendar & lunar cycle", icon: "🌙", sigil: "moon" },
  { id: "reputation",  name: "Reputation",         blurb: "Faction standing",       icon: "⚖️", sigil: "crown" },
  { id: "battle-map",  name: "Battle Map",         blurb: "Encounters",             icon: "🗺️", sigil: "hex" },
  { id: "roll-tables", name: "Roll Tables",        blurb: "Loot & events",          icon: "🎲", sigil: "die" },
  { id: "rules",       name: "Rules Reference",    blurb: "Quick lookup",           icon: "📖", sigil: "book" },
];

export function getTool(id: string): Tool | null {
  return TOOLS.find(t => t.id === id) ?? null;
}
