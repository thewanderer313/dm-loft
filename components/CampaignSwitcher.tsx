"use client";

import Link from "next/link";

export function CampaignSwitcher({
  activeId,
  options,
}: {
  activeId: string | null;
  options: { id: string; name: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={activeId ?? ""}
        onChange={(e) => { window.location.href = `/c/${e.currentTarget.value}`; }}
        className="bg-lantern-panel2 text-lantern-dim border border-lantern-border px-2 py-1 text-sm font-serif"
      >
        {options.length === 0 && <option value="">— no campaigns —</option>}
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <Link href="/campaigns" className="text-lantern-muted text-xs hover:text-lantern-gold">
        manage
      </Link>
    </div>
  );
}
