import Link from "next/link";
import { Shell } from "@/components/Shell";
import { listMyCampaigns } from "@/lib/data/campaigns";

export default async function CampaignsPage() {
  const campaigns = await listMyCampaigns();
  return (
    <Shell>
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lantern-gold text-2xl">Campaigns</h1>
          <Link
            href="/campaigns/new"
            className="text-sm py-1 px-3 bg-lantern-gold text-lantern-bg"
          >
            + New
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-lantern-muted">
            No campaigns yet. Create your first to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map(c => (
              <li key={c.id} className="bg-lantern-panel border border-lantern-border p-3">
                <Link href={`/c/${c.id}`} className="text-lantern-gold">
                  {c.name}
                </Link>
                {c.description && (
                  <p className="text-lantern-muted text-sm mt-1">{c.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
