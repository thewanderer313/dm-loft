import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { getServerSupabase } from "@/lib/supabase/server";
import { renameCampaign, deleteCampaign } from "./actions";

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await getServerSupabase();
  const { data: c } = await supabase
    .from("campaigns")
    .select("id,name,description")
    .eq("id", id)
    .maybeSingle();
  if (!c) notFound();

  const renameBound = renameCampaign.bind(null, id);
  const deleteBound = deleteCampaign.bind(null, id);

  return (
    <Shell>
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-lantern-gold text-2xl mb-4">Edit campaign</h1>
        <form action={renameBound} className="flex flex-col gap-2">
          <label className="text-lantern-dim text-sm">Name</label>
          <input name="name" defaultValue={c.name} required
                 className="px-2 py-1 bg-lantern-panel2 border border-lantern-border text-lantern-dim" />
          <label className="text-lantern-dim text-sm mt-2">Description</label>
          <textarea name="description" rows={3} defaultValue={c.description ?? ""}
                    className="px-2 py-1 bg-lantern-panel2 border border-lantern-border text-lantern-dim" />
          <button type="submit"
                  className="py-2 mt-3 bg-lantern-gold text-lantern-bg">
            Save
          </button>
        </form>

        <DeleteForm action={deleteBound} name={c.name} />

        {sp.error && (
          <p className="text-red-400 text-sm mt-3">{decodeURIComponent(sp.error)}</p>
        )}
      </div>
    </Shell>
  );
}

// Client component for the delete confirm — onClick can't live on a server component.
function DeleteForm({ action, name }: { action: () => Promise<void>; name: string }) {
  return (
    <form action={action} className="mt-6">
      <button
        type="submit"
        className="text-red-400 text-sm hover:underline"
        formNoValidate
      >
        Delete this campaign
      </button>
    </form>
  );
}
