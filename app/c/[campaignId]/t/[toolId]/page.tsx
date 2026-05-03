import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Sigil } from "@/components/Sigil";
import { getServerSupabase } from "@/lib/supabase/server";
import { getTool } from "@/lib/tools";
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

  return (
    <Shell
      rightSlot={
        <Link
          href={`/c/${campaignId}`}
          className="text-xs italic uppercase tracking-[0.18em] flex items-center gap-2"
          style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
        >
          ← {campaign.name}
        </Link>
      }
    >
      <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: "var(--tome-rule-soft)" }}>
        <span style={{ color: "var(--tome-oxblood)" }} aria-hidden>
          <Sigil kind={tool.sigil} size={22} strokeWidth={1.4} />
        </span>
        <span
          className="text-lg"
          style={{
            fontFamily: "var(--tome-display)",
            color: "var(--tome-ink)",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {tool.name}
        </span>
        <span
          className="text-[11px] italic uppercase tracking-[0.18em] ml-2"
          style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
        >
          · {tool.blurb}
        </span>
      </div>
      <div className="h-[calc(100vh-49px-49px)]">
        <iframe
          src={src}
          title={tool.name}
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </Shell>
  );
}
