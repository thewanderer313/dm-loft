import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export function ToolGrid({ campaignId }: { campaignId: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {TOOLS.map(t => (
        <Link
          key={t.id}
          href={`/c/${campaignId}/t/${t.id}`}
          className="block bg-lantern-panel border border-lantern-border p-4 hover:border-lantern-gold transition-colors"
        >
          <div className="text-2xl">{t.icon}</div>
          <div className="text-lantern-gold mt-2">{t.name}</div>
          <div className="text-lantern-muted text-xs mt-1">{t.blurb}</div>
        </Link>
      ))}
    </div>
  );
}
