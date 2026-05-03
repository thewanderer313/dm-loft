import Link from "next/link";
import { notFound } from "next/navigation";
import { Sigil } from "@/components/Sigil";
import { romanize } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { getTool, getToolIndex } from "@/lib/tools";
import { listAllTracks } from "@/lib/data/tracks";
import { recordLastOpened } from "../[toolId]/actions";
import { AudioLibrary } from "@/components/AudioLibrary";

export default async function AudioToolPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const tool = getTool("audio");
  if (!tool) notFound();

  const supabase = await getServerSupabase();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id,name")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) notFound();

  const [tracks, { data: userResp }] = await Promise.all([
    listAllTracks(),
    supabase.auth.getUser(),
  ]);
  const currentUserId = userResp.user?.id ?? null;
  recordLastOpened(campaignId, "audio").catch(() => {});

  const cap = `Cap. ${romanize(getToolIndex("audio") + 1).toUpperCase()}`;

  return (
    <div className="tome-page min-h-screen flex flex-col">
      <div
        className="flex items-center gap-4 px-5 py-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--tome-rule)" }}
      >
        <Link
          href={`/c/${campaignId}`}
          className="italic uppercase flex items-center gap-2 shrink-0"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 11,
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
            fontSize: 11,
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
            fontSize: 10,
            color: "var(--tome-ink-faint)",
            letterSpacing: "0.18em",
          }}
        >
          &middot; {tool.blurb}
        </span>
      </div>
      <AudioLibrary
        campaignId={campaignId}
        initialTracks={tracks}
        currentUserId={currentUserId}
      />
    </div>
  );
}
