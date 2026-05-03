"use client";

import * as React from "react";
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
      <span
        className="italic uppercase"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 12,
          color: "var(--tome-ink-faint)",
          letterSpacing: "0.12em",
        }}
      >
        chronicle
      </span>
      <div
        className="relative flex items-center"
        style={{
          border: "1px solid var(--tome-gold)",
          padding: "6px 12px",
          fontFamily: "var(--tome-display)",
          fontStyle: "italic",
          fontSize: 14,
          color: "var(--tome-ink)",
        }}
      >
        <select
          defaultValue={activeId ?? ""}
          onChange={(e) => {
            window.location.href = `/c/${e.currentTarget.value}`;
          }}
          className="bg-transparent outline-none cursor-pointer pr-5"
          style={{
            fontFamily: "var(--tome-display)",
            fontStyle: "italic",
            fontSize: 14,
            color: "var(--tome-ink)",
            appearance: "none",
            border: "none",
          }}
        >
          {options.length === 0 && <option value="">— no chronicles —</option>}
          {options.map(o => (
            <option key={o.id} value={o.id} style={{ background: "var(--tome-paper)", color: "var(--tome-ink)" }}>
              {o.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3"
          style={{ color: "var(--tome-gold)" }}
        >
          ▾
        </span>
      </div>
      <Link
        href="/campaigns"
        className="italic uppercase"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 11,
          color: "var(--tome-ink-faint)",
          letterSpacing: "0.18em",
        }}
      >
        manage
      </Link>
    </div>
  );
}
