import Link from "next/link";
import { getTool } from "@/lib/tools";

export function ResumeCard({
  campaignId,
  campaignName,
  lastToolId,
  lastOpenedAt,
}: {
  campaignId: string;
  campaignName: string;
  lastToolId: string | null;
  lastOpenedAt: string | null;
}) {
  if (!lastToolId) return null;
  const tool = getTool(lastToolId);
  if (!tool) return null;

  const initial = tool.name.trim().charAt(0).toUpperCase();
  const lastWhen = lastOpenedAt
    ? new Date(lastOpenedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Link
      href={`/c/${campaignId}/t/${tool.id}`}
      className="relative grid items-center gap-4"
      style={{
        gridTemplateColumns: "56px minmax(0, 1fr) auto",
        padding: "18px 20px",
        border: "1.5px solid var(--tome-gold)",
        background: "rgba(40,28,12,0.4)",
        marginTop: 18,
        marginBottom: 18,
      }}
    >
      <span
        className="absolute pointer-events-none"
        style={{
          inset: -3,
          border: "1px solid var(--tome-gold-light)",
          opacity: 0.45,
        }}
        aria-hidden
      />
      <div className="tome-illum" style={{ width: 56, height: 56, fontSize: 36 }}>
        {initial}
      </div>
      <div className="min-w-0">
        <div
          className="italic uppercase text-[13px]"
          style={{
            fontFamily: "var(--tome-display)",
            letterSpacing: "0.2em",
            color: "var(--tome-gold)",
          }}
        >
          resume thy work
        </div>
        <div
          className="truncate"
          style={{
            fontFamily: "var(--tome-display)",
            fontWeight: 600,
            fontSize: 28,
            color: "var(--tome-ink)",
            lineHeight: 1.05,
          }}
        >
          {tool.name}
        </div>
        <div
          className="italic truncate"
          style={{
            fontFamily: "var(--tome-body)",
            fontSize: 14,
            color: "var(--tome-ink-soft)",
          }}
        >
          {campaignName}
          {lastWhen && (
            <>
              {" "}&middot; opened {lastWhen}
            </>
          )}
        </div>
      </div>
      <span
        className="hidden sm:inline-flex italic uppercase cursor-pointer items-center"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 13,
          letterSpacing: "0.12em",
          background: "transparent",
          color: "var(--tome-ink)",
          border: "1px solid var(--tome-ink)",
          padding: "6px 14px",
        }}
      >
        resume &rsaquo;
      </span>
    </Link>
  );
}
