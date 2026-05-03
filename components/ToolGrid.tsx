import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { Sigil } from "@/components/Sigil";

export function ToolGrid({ campaignId }: { campaignId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {TOOLS.map(t => (
        <Link
          key={t.id}
          href={`/c/${campaignId}/t/${t.id}`}
          className="group relative tome-card p-6 flex flex-col items-center text-center transition-colors"
          style={{ minHeight: 180 }}
        >
          <span
            className="absolute inset-2 pointer-events-none border opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ borderColor: "var(--tome-gold)" }}
            aria-hidden
          />
          <span
            className="mb-4"
            style={{ color: "var(--tome-oxblood)" }}
            aria-hidden
          >
            <Sigil kind={t.sigil} size={56} strokeWidth={1.4} />
          </span>
          <span
            className="text-xl"
            style={{
              fontFamily: "var(--tome-display)",
              color: "var(--tome-ink)",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            {t.name}
          </span>
          <span
            className="mt-1 text-xs italic uppercase tracking-[0.16em]"
            style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
          >
            {t.blurb}
          </span>
        </Link>
      ))}
    </div>
  );
}
