import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { Sigil } from "@/components/Sigil";
import { romanize } from "@/components/TomePage";

export function ToolGrid({ campaignId }: { campaignId: string }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {TOOLS.map((tool, i) => {
        const cap = `Cap. ${romanize(i + 1).toUpperCase()}`;
        const wip = tool.wip;
        return (
          <Link
            key={tool.id}
            href={`/c/${campaignId}/t/${tool.id}`}
            className="relative flex flex-col justify-between min-h-[138px] hover:bg-[rgba(255,250,235,0.07)] transition-colors"
            style={{
              border: "1px solid var(--tome-rule)",
              background: "rgba(255,250,235,0.04)",
              padding: "14px 14px 12px",
              opacity: wip ? 0.6 : 1,
            }}
          >
            <div className="flex items-start justify-between">
              <Sigil
                kind={tool.sigil}
                size={24}
                color="var(--tome-oxblood)"
                strokeWidth={1.4}
              />
              <span
                className="italic"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 13,
                  color: "var(--tome-gold)",
                  letterSpacing: "0.1em",
                }}
              >
                {cap}
              </span>
            </div>
            <div className="mt-3">
              <div
                style={{
                  fontFamily: "var(--tome-display)",
                  fontWeight: 500,
                  fontSize: 20,
                  color: "var(--tome-ink)",
                  lineHeight: 1.1,
                }}
              >
                {tool.name}
              </div>
              <div
                className="italic mt-0.5"
                style={{
                  fontFamily: "var(--tome-body)",
                  fontSize: 13,
                  color: "var(--tome-ink-soft)",
                }}
              >
                {tool.tomeDesc}
              </div>
            </div>
            <div
              className="mt-3 uppercase"
              style={{
                fontFamily: "var(--tome-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                color: "var(--tome-ink-faint)",
              }}
            >
              {tool.blurb}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
