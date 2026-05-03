import type { SigilKind } from "@/components/Sigil";

export type Tool = {
  id: string;
  name: string;
  blurb: string;
  icon: string;
  sigil: SigilKind;
  tomeDesc: string;
  wip?: boolean;
};

export const TOOLS: Tool[] = [
  {
    id: "initiative",
    name: "Initiative Tracker",
    blurb: "Combat & HP",
    icon: "⚔️",
    sigil: "sword",
    tomeDesc: "The order of battle, and who shall strike before whom.",
  },
  {
    id: "time-moon",
    name: "Time & Moon",
    blurb: "Calendar & lunar cycle",
    icon: "🌙",
    sigil: "moon",
    tomeDesc: "Hours, days, and the lunar tide.",
  },
  {
    id: "reputation",
    name: "Reputation",
    blurb: "Faction standing",
    icon: "⚖️",
    sigil: "crown",
    tomeDesc: "Standing among the towns and powers of the realm.",
  },
  {
    id: "battle-map",
    name: "Battle Map",
    blurb: "Encounters",
    icon: "🗺️",
    sigil: "hex",
    tomeDesc: "Terrain, distance, and tactical art.",
  },
  {
    id: "roll-tables",
    name: "Roll Tables",
    blurb: "Loot & events",
    icon: "🎲",
    sigil: "die",
    tomeDesc: "Compendium of fortunes and chances.",
  },
  {
    id: "rules",
    name: "Rules Reference",
    blurb: "Quick lookup",
    icon: "📖",
    sigil: "book",
    tomeDesc: "A keeper's commonplace book.",
  },
];

export function getTool(id: string): Tool | null {
  return TOOLS.find(t => t.id === id) ?? null;
}

export function getToolIndex(id: string): number {
  return TOOLS.findIndex(t => t.id === id);
}
