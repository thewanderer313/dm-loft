import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Sigil } from "@/components/Sigil";
import { romanize } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { getTool, getToolIndex } from "@/lib/tools";
import { recordLastOpened } from "./actions";

export default async function ToolPage({
  params,
}: {
  params: Promise<{ campaignId: string; toolId: string }>;
}) {
  const { campaignId, toolId } = await params;
  const tool = getTool(toolId);
  if (!tool) notFound();

  const supabase = await getServerSupabase();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id,name")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) notFound();

  recordLastOpened(campaignId, toolId).catch(() => {});

  const src = `/tools/${tool.id}/index.html?campaign=${encodeURIComponent(campaignId)}`;
  const cap = `Cap. ${romanize(getToolIndex(tool.id) + 1).toUpperCase()}`;

  return (
    <Shell>
      <div
        className="flex items-center gap-4 px-5 py-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--tome-rule)" }}
      >
        <Link
          href={`/c/${campaignId}`}
          className="italic uppercase flex items-center gap-2 shrink-0"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 13,
            letterSpacing: "0.18em",
            color: "var(--tome-ink-faint)",
          }}
        >
          ← {campaign.name}
        </Link>
        <span style={{ color: "var(--tome-rule)" }} aria-hidden>·</span>
        <span style={{ color: "var(--tome-oxblood)" }} aria-hidden>
          <Sigil kind={tool.sigil} size={20} strokeWidth={1.4} />
        </span>
        <span
          className="italic"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 13,
            color: "var(--tome-gold)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {cap}
        </span>
        <span
          style={{
            fontFamily: "var(--tome-display)",
            fontWeight: 600,
            fontSize: 18,
            color: "var(--tome-ink)",
            letterSpacing: "0.01em",
          }}
        >
          {tool.name}
        </span>
        <span
          className="italic uppercase"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 12,
            color: "var(--tome-ink-faint)",
            letterSpacing: "0.18em",
          }}
        >
          &middot; {tool.blurb}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          src={src}
          title={tool.name}
          className="w-full h-full border-0 bg-white"
          style={{ minHeight: "calc(100vh - 110px)" }}
        />
      </div>
    </Shell>
  );
}
