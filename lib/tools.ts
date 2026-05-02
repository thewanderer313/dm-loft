export type Tool = {
  id: string;
  name: string;
  blurb: string;
  icon: string;
};

export const TOOLS: Tool[] = [
  { id: "initiative",  name: "Initiative Tracker", blurb: "Combat & HP",        icon: "⚔️" },
  { id: "time-moon",   name: "Time & Moon",        blurb: "Calendar & lunar cycle", icon: "🌙" },
  { id: "reputation",  name: "Reputation",         blurb: "Faction standing",   icon: "⚖️" },
  { id: "battle-map",  name: "Battle Map",         blurb: "Encounters",         icon: "🗺️" },
  { id: "roll-tables", name: "Roll Tables",        blurb: "Loot & events",      icon: "🎲" },
  { id: "rules",       name: "Rules Reference",    blurb: "Quick lookup",       icon: "📖" },
];

export function getTool(id: string): Tool | null {
  return TOOLS.find(t => t.id === id) ?? null;
}
