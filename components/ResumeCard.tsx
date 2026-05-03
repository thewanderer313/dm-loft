import Link from "next/link";
import { getTool } from "@/lib/tools";
import { Sigil } from "@/components/Sigil";

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

  return (
    <Link
      href={`/c/${campaignId}/t/${tool.id}`}
      className="block tome-card p-5 mb-8 flex items-center gap-4 transition-colors"
      style={{ borderLeft: "4px solid var(--tome-oxblood)" }}
    >
      <span style={{ color: "var(--tome-oxblood)" }} aria-hidden>
        <Sigil kind={tool.sigil} size={42} strokeWidth={1.4} />
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[11px] italic uppercase tracking-[0.22em]"
          style={{ fontFamily: "var(--tome-display)", color: "var(--tome-gold)" }}
        >
          Resume thy work
        </div>
        <div
          className="text-2xl mt-0.5 truncate"
          style={{
            fontFamily: "var(--tome-display)",
            color: "var(--tome-ink)",
            fontWeight: 600,
          }}
        >
          {tool.name}
        </div>
        <div
          className="text-xs italic mt-0.5 truncate"
          style={{ color: "var(--tome-ink-soft)" }}
        >
          {campaignName}
          {lastOpenedAt && ` · last opened ${new Date(lastOpenedAt).toLocaleString()}`}
        </div>
      </div>
      <span
        className="hidden sm:block text-2xl shrink-0"
        style={{ color: "var(--tome-gold)", fontFamily: "var(--tome-display)" }}
        aria-hidden
      >
        ↩
      </span>
    </Link>
  );
}
