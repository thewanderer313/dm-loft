import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { TomePage, Eyebrow, GildedRule, Illum } from "@/components/TomePage";
import { getServerSupabase } from "@/lib/supabase/server";
import { renameCampaign, deleteCampaign } from "./actions";
import { DeleteCampaignButton } from "@/components/DeleteCampaignButton";

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
  const initial = c.name.trim().charAt(0).toUpperCase() || "·";

  return (
    <Shell>
      <TomePage chapter="DM Loft · Errata & Amendments" folio="·">
        <div className="max-w-xl mx-auto pt-4">
          <div className="flex items-start gap-5 mb-8">
            <Illum>{initial}</Illum>
            <div>
              <Eyebrow>Amend a Campaign</Eyebrow>
              <h1
                className="text-4xl mt-1"
                style={{
                  fontFamily: "var(--tome-display)",
                  color: "var(--tome-ink)",
                  fontWeight: 600,
                }}
              >
                {c.name}
              </h1>
            </div>
          </div>

          <GildedRule className="mb-8" />

          <form action={renameBound} className="flex flex-col gap-5">
            <label className="block">
              <span
                className="block text-[11px] italic uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
              >
                Name
              </span>
              <input name="name" defaultValue={c.name} required className="tome-input" />
            </label>

            <label className="block">
              <span
                className="block text-[11px] italic uppercase tracking-[0.2em] mb-1"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
              >
                Description
              </span>
              <textarea
                name="description"
                rows={4}
                defaultValue={c.description ?? ""}
                className="tome-input"
                style={{ resize: "vertical" }}
              />
            </label>

            <div className="flex items-center justify-between mt-3">
              <Link
                href="/campaigns"
                className="text-xs italic uppercase tracking-[0.18em]"
                style={{ fontFamily: "var(--tome-display)", color: "var(--tome-ink-faint)" }}
              >
                ← back to library
              </Link>
              <button type="submit" className="tome-btn tome-btn-primary">
                Save changes
              </button>
            </div>
          </form>

          <div
            className="mt-12 pt-6 border-t"
            style={{ borderColor: "var(--tome-rule-soft)" }}
          >
            <Eyebrow className="mb-3" >Excise this campaign</Eyebrow>
            <DeleteCampaignButton campaignName={c.name} action={deleteBound} />
          </div>

          {sp.error && (
            <p
              className="text-sm italic mt-4"
              style={{ color: "var(--tome-oxblood)" }}
            >
              {decodeURIComponent(sp.error)}
            </p>
          )}
        </div>
      </TomePage>
    </Shell>
  );
}
