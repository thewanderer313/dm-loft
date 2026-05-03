import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { TomePage, Eyebrow, GildedRule, romanize } from "@/components/TomePage";
import { ToolGrid } from "@/components/ToolGrid";
import { ResumeCard } from "@/components/ResumeCard";
import { CampaignSwitcher } from "@/components/CampaignSwitcher";
import { getCampaignForDashboard } from "@/lib/data/dashboard";
import { listMyCampaigns } from "@/lib/data/campaigns";

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

  const idx = all.findIndex(c => c.id === campaign.id);
  const folio = romanize(idx >= 0 ? idx + 1 : 1);

  return (
    <Shell
      rightSlot={
        <CampaignSwitcher
          activeId={campaign.id}
          options={all.map(c => ({ id: c.id, name: c.name }))}
        />
      }
    >
      <TomePage chapter={`DM Loft · ${campaign.name}`} folio={folio}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <Eyebrow>The Loft</Eyebrow>
            <h1
              className="text-5xl mt-2"
              style={{
                fontFamily: "var(--tome-display)",
                color: "var(--tome-ink)",
                fontWeight: 600,
                letterSpacing: "0.01em",
              }}
            >
              {campaign.name}
            </h1>
            <div className="w-full max-w-md mt-4">
              <GildedRule />
            </div>
          </div>

          <ResumeCard
            campaignId={campaign.id}
            campaignName={campaign.name}
            lastToolId={campaign.last_tool_id}
            lastOpenedAt={campaign.last_opened_at}
          />

          <Eyebrow className="mb-4">Tools of the Trade</Eyebrow>
          <ToolGrid campaignId={campaign.id} />
        </div>
      </TomePage>
    </Shell>
  );
}
