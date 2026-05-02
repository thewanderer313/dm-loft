import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
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

  return (
    <Shell rightSlot={
      <CampaignSwitcher
        activeId={campaign.id}
        options={all.map(c => ({ id: c.id, name: c.name }))}
      />
    }>
      <div className="max-w-3xl mx-auto p-5">
        <ResumeCard
          campaignId={campaign.id}
          campaignName={campaign.name}
          lastToolId={campaign.last_tool_id}
          lastOpenedAt={campaign.last_opened_at}
        />
        <div className="text-lantern-muted text-xs uppercase tracking-widest mb-2">
          Tools · {campaign.name}
        </div>
        <ToolGrid campaignId={campaign.id} />
      </div>
    </Shell>
  );
}
