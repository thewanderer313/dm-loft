import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { TomePage } from "@/components/TomePage";
import { ToolGrid } from "@/components/ToolGrid";
import { ResumeCard } from "@/components/ResumeCard";
import { CampaignSwitcher } from "@/components/CampaignSwitcher";
import { getCampaignForDashboard } from "@/lib/data/dashboard";
import { listMyCampaigns } from "@/lib/data/campaigns";

function slugFolio(name: string): string {
  const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return cleaned ? cleaned.slice(0, 14) : "i";
}

export default async function CampaignDashboard({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const [campaign, all] = await Promise.all([
    getCampaignForDashboard(campaignId),
    listMyCampaigns(),
  ]);
  if (!campaign) notFound();

  return (
    <Shell>
      <TomePage chapter={`DM Loft · ${campaign.name}`} folio={slugFolio(campaign.name)}>
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <div
                className="italic uppercase text-[13px]"
                style={{
                  fontFamily: "var(--tome-display)",
                  letterSpacing: "0.22em",
                  color: "var(--tome-gold)",
                }}
              >
                the chronicle
              </div>
              <h1
                className="mt-1 break-words"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontWeight: 600,
                  fontSize: "clamp(48px, 8vw, 76px)",
                  lineHeight: 0.92,
                  color: "var(--tome-ink)",
                  letterSpacing: "-0.01em",
                }}
              >
                {campaign.name}
              </h1>
              {campaign.description && (
                <p
                  className="italic mt-1"
                  style={{
                    fontFamily: "var(--tome-body)",
                    fontSize: 18,
                    color: "var(--tome-ink-soft)",
                    maxWidth: 720,
                  }}
                >
                  {campaign.description}
                </p>
              )}
            </div>
            <div className="pt-2 shrink-0">
              <CampaignSwitcher
                activeId={campaign.id}
                options={all.map(c => ({ id: c.id, name: c.name }))}
              />
            </div>
          </div>

          <ResumeCard
            campaignId={campaign.id}
            campaignName={campaign.name}
            lastToolId={campaign.last_tool_id}
            lastOpenedAt={campaign.last_opened_at}
          />

          <div className="flex items-center gap-3 mt-4 mb-2">
            <span
              className="italic uppercase"
              style={{
                fontFamily: "var(--tome-display)",
                fontSize: 12,
                letterSpacing: "0.22em",
                color: "var(--tome-ink-soft)",
              }}
            >
              Index of instruments &middot; {campaign.name}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--tome-rule)" }} />
          </div>

          <ToolGrid campaignId={campaign.id} />
        </div>
      </TomePage>
    </Shell>
  );
}
