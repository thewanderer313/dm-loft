"use client";

import * as React from "react";
import {
  generateInvite,
  revokeInvite,
} from "@/app/campaigns/[id]/edit/actions";
import type { Invite } from "@/lib/data/invites";

export function InviteManager({
  campaignId,
  invites,
  origin,
}: {
  campaignId: string;
  invites: Invite[];
  origin: string;
}) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const generateBound = generateInvite.bind(null, campaignId);

  async function copy(code: string) {
    const url = `${origin}/join/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(code);
      // Only clear if our timer is the one whose code is still showing —
      // the user may have clicked copy on a different row in the interim.
      setTimeout(() => setCopied(c => (c === code ? null : c)), 1500);
    } catch {
      window.prompt("Copy this invite link", url);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={generateBound}>
        <button
          type="submit"
          className="cursor-pointer"
          style={{
            fontFamily: "var(--tome-display)",
            fontStyle: "italic",
            fontSize: 13,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "var(--tome-oxblood)",
            color: "var(--tome-paper)",
            border: "1px solid var(--tome-oxblood)",
            padding: "10px 18px",
          }}
        >
          + Generate invite link
        </button>
      </form>

      {invites.length === 0 ? (
        <p
          className="italic"
          style={{
            fontFamily: "var(--tome-body)",
            color: "var(--tome-ink-soft)",
          }}
        >
          No invites yet. Generate one and paste it into Discord (or wherever thy table gathers).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {invites.map(inv => {
            const url = `${origin}/join/${inv.code}`;
            const stale = inv.revoked
              || (inv.expires_at !== null && new Date(inv.expires_at) < new Date())
              || (inv.max_uses !== null && inv.uses >= inv.max_uses);
            const revokeBound = revokeInvite.bind(null, campaignId, inv.code);
            return (
              <li
                key={inv.code}
                className="grid items-center gap-3"
                style={{
                  gridTemplateColumns: "1fr auto auto",
                  borderBottom: "1px dotted var(--tome-rule)",
                  padding: "10px 0",
                  opacity: stale ? 0.55 : 1,
                }}
              >
                <div className="min-w-0">
                  <div
                    className="truncate"
                    style={{
                      fontFamily: "var(--tome-mono)",
                      fontSize: 14,
                      color: "var(--tome-ink)",
                    }}
                  >
                    {url}
                  </div>
                  <div
                    className="italic mt-0.5"
                    style={{
                      fontFamily: "var(--tome-display)",
                      fontSize: 12,
                      color: "var(--tome-ink-faint)",
                    }}
                  >
                    {inv.uses} use{inv.uses === 1 ? "" : "s"}
                    {inv.max_uses !== null && ` of ${inv.max_uses}`}
                    {inv.revoked && " · revoked"}
                    {inv.expires_at && ` · expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copy(inv.code)}
                  className="cursor-pointer italic uppercase"
                  style={{
                    fontFamily: "var(--tome-display)",
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    padding: "4px 10px",
                    background: "transparent",
                    color: "var(--tome-ink)",
                    border: "1px solid var(--tome-rule)",
                  }}
                  disabled={stale}
                >
                  {copied === inv.code ? "copied" : "copy"}
                </button>
                {!inv.revoked && (
                  <form
                    action={revokeBound}
                    onSubmit={(e) => {
                      if (!confirm("Revoke this invite? Anyone with the link can no longer use it.")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="cursor-pointer italic uppercase"
                      style={{
                        fontFamily: "var(--tome-display)",
                        fontSize: 12,
                        letterSpacing: "0.1em",
                        padding: "4px 10px",
                        background: "transparent",
                        color: "var(--tome-oxblood)",
                        border: "1px solid var(--tome-rule)",
                      }}
                    >
                      revoke
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
