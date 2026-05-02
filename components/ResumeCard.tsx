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

  return (
    <Link
      href={`/c/${campaignId}/t/${tool.id}`}
      className="block bg-lantern-panel border-l-4 border-lantern-gold border-y border-r border-y-lantern-border border-r-lantern-border p-4 mb-4 hover:bg-lantern-panel2 transition-colors"
    >
      <div className="text-lantern-muted text-xs uppercase tracking-widest">Resume</div>
      <div className="text-lantern-gold text-lg mt-1">↩ {tool.name}</div>
      <div className="text-lantern-muted text-xs mt-1">
        {campaignName}
        {lastOpenedAt && ` · last opened ${new Date(lastOpenedAt).toLocaleString()}`}
      </div>
    </Link>
  );
}
