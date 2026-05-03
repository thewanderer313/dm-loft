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
    <div className="flex items-center gap-3">
      <select
        defaultValue={activeId ?? ""}
        onChange={(e) => {
          window.location.href = `/c/${e.currentTarget.value}`;
        }}
        className="px-2 py-1 text-sm"
        style={{
          fontFamily: "var(--tome-display)",
          fontStyle: "italic",
          background: "transparent",
          color: "var(--tome-ink)",
          border: "1px solid var(--tome-rule)",
        }}
      >
        {options.length === 0 && <option value="">— no campaigns —</option>}
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <Link
        href="/campaigns"
        className="text-xs italic uppercase tracking-[0.18em]"
        style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
      >
        manage
      </Link>
    </div>
  );
}
