import { Shell } from "@/components/Shell";
import { createCampaign } from "./actions";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Shell>
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-lantern-gold text-2xl mb-4">New campaign</h1>
        <form action={createCampaign} className="flex flex-col gap-2">
          <label className="text-lantern-dim text-sm">Name</label>
          <input name="name" required
                 className="px-2 py-1 bg-lantern-panel2 border border-lantern-border text-lantern-dim" />
          <label className="text-lantern-dim text-sm mt-2">Description (optional)</label>
          <textarea name="description" rows={3}
                    className="px-2 py-1 bg-lantern-panel2 border border-lantern-border text-lantern-dim" />
          <button type="submit"
                  className="py-2 mt-3 bg-lantern-gold text-lantern-bg">
            Create
          </button>
          {sp.error && (
            <p className="text-red-400 text-sm mt-2">{decodeURIComponent(sp.error)}</p>
          )}
        </form>
      </div>
    </Shell>
  );
}
