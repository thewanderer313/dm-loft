import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
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

  // Fire-and-forget bookkeeping. Don't block render on it.
  recordLastOpened(campaignId, toolId).catch(() => {});

  const src = `/tools/${tool.id}/index.html?campaign=${encodeURIComponent(campaignId)}`;

  return (
    <Shell
      rightSlot={
        <Link
          href={`/c/${campaignId}`}
          className="text-lantern-muted text-sm hover:text-lantern-gold"
        >
          ← {campaign.name}
        </Link>
      }
    >
      <div className="h-[calc(100vh-49px)]">
        <iframe
          src={src}
          title={tool.name}
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </Shell>
  );
}
